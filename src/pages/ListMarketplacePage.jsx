import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import AppLayout from '../components/layout/AppLayout';
import PropertyCard from '../components/property/PropertyCard';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import web3Service from '../services/web3Service';
import propertyApi from '../api/propertyApi';
import contractsConfig from '../config/contracts.config';

const DEFAULT_LISTING_PRICE = 40;

const ListMarketplacePage = () => {
  const [properties, setProperties] = useState([]);
  const [userAddress, setUserAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [fractionalEvents, setFractionalEvents] = useState({});
  const [tokensInputs, setTokenInputs] = useState({});
  const [userTokenBalances, setUserTokenBalances] = useState([]);

  const fetchProperties = async (address) => {
    try {
      const data = await propertyApi.getOwnerProperties(address);
      const allProps = data.properties || [];

      const propertyNftContract = web3Service.getReadOnlyPropertyNftContract();
      const filteredProps = [];
      for (const prop of allProps) {
        try {
          const isFrac = await propertyNftContract.isFractionalized(prop.propertyId);
          if (isFrac) {
            filteredProps.push(prop);
          }
        } catch (err) {
          console.error(`Error checking fractionalization for token ${prop.propertyId}:`, err);
        }
      }
      setProperties(filteredProps);
    } catch (err) {
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTokenBalance = async () => {
    try {
      const address = await web3Service.getWalletAddress();
      if (!address) return;

      const vaultContract = web3Service.getReadOnlyVaultContract();
      const balances = [];

      for (const prop of properties) {
        try {
          const propertyTokenData = await vaultContract.fractionalData(prop.propertyId);
          const propertyShareTokenAddr = propertyTokenData.tokenAddress;

          if (propertyShareTokenAddr && propertyShareTokenAddr !== ethers.constants.AddressZero) {
            const provider = web3Service.getProvider();
            const tokenContract = new ethers.Contract(
              propertyShareTokenAddr,
              ['function balanceOf(address) view returns (uint256)'],
              provider,
            );

            const balance = await tokenContract.balanceOf(address);

            balances.push({
              propertyId: prop.propertyId,
              propertyName: prop.propertyName,
              tokenAddress: propertyShareTokenAddr,
              balance: ethers.utils.formatUnits(balance, 18),
            });
          }
        } catch (err) {
          console.error(`Error fetching balance for property ${prop.propertyId}:`, err);
        }
      }

      setUserTokenBalances(balances);
    } catch (err) {
      console.error('Error fetching token balances:', err);
    }
  };

  const listToMarketplace = async (tokenId) => {
    const inputValue = tokensInputs[tokenId];
    if (!inputValue) {
      toast.error('Please enter the number of tokens to list.');
      return;
    }

    try {
      const signer = await web3Service.getSigner();
      const tokensToListForProp = ethers.utils.parseUnits(inputValue.toString(), 18);

      const vaultContract = await web3Service.getVaultContract();
      const propertyToken = await vaultContract.fractionalData(tokenId);
      const propertyShareTokenAddr = propertyToken.tokenAddress;

      const propertyTokensTxn = new ethers.Contract(propertyShareTokenAddr, contractsConfig.vault.abi, signer);

      const marketplaceContract = await web3Service.getMarketplaceContract();
      const checkListingData = await marketplaceContract.listings(tokenId);
      const checkListing = checkListingData.active;

      const approveTx = await propertyTokensTxn.approve(contractsConfig.marketplace.address, tokensToListForProp);
      await approveTx.wait();

      if (!checkListing) {
        const listTx = await marketplaceContract.listProperty(tokenId, propertyShareTokenAddr, tokensToListForProp);
        await listTx.wait();
      } else {
        const addTokensTx = await marketplaceContract.addMoreTokensToListing(tokenId, tokensToListForProp);
        await addTokensTx.wait();
      }

      const afterListingData = await marketplaceContract.listings(tokenId);
      const listingInfo = {
        shareToken: afterListingData.propertyToken,
        totalShares: Number(ethers.utils.formatUnits(afterListingData.totalTokens, 18)).toString(),
        pricePerToken: Number(ethers.utils.formatUnits(afterListingData.pricePerToken, 6)).toString(),
        remainingTokens: Number(ethers.utils.formatUnits(afterListingData.remainingTokens, 18)).toString(),
      };

      setFractionalEvents((prev) => ({
        ...prev,
        [tokenId]: listingInfo,
      }));

      toast.success('Successfully listed to marketplace!');
      fetchUserTokenBalance();
    } catch (error) {
      console.error('Error listing tokens:', error);
      toast.error('Transaction Failed.');
    }
  };

  const handleInputChange = (tokenId, value) => {
    setTokenInputs((prev) => ({
      ...prev,
      [tokenId]: value,
    }));
  };

  useEffect(() => {
    const init = async () => {
      const address = await web3Service.getWalletAddress();
      if (address) {
        setUserAddress(address);
        fetchProperties(address);
      } else {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (properties.length > 0 && userAddress) {
      fetchUserTokenBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties, userAddress]);

  return (
    <AppLayout>
      <PageHeader
        title="List to Marketplace"
        description="Make your fractionalized property shares available for purchase."
        icon={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 21h19.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
          />
        }
      />
      {loading ? (
        <Spinner words={['properties', 'balances', 'listings', 'properties']} />
      ) : properties.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((prop) => {
            const tokenBalanceObj = userTokenBalances.find((b) => b.propertyId === prop.propertyId);
            const availableBalance = tokenBalanceObj ? tokenBalanceObj.balance : '0';

            return (
              <PropertyCard key={prop.propertyId} property={prop}>
                <div className="space-y-3 border-t border-slate-200 pt-2 dark:border-slate-800">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Your balance:{' '}
                    <span className="font-medium text-slate-700 dark:text-slate-200">{availableBalance}</span>
                  </p>
                  <Input
                    label="Tokens to list"
                    type="number"
                    placeholder="e.g. 500"
                    value={tokensInputs[prop.propertyId] || ''}
                    onChange={(e) => handleInputChange(prop.propertyId, e.target.value)}
                  />
                  <Button fullWidth onClick={() => listToMarketplace(prop.propertyId)}>
                    List Property
                  </Button>
                  <p className="text-xs text-slate-500">
                    Default listing price is{' '}
                    <span className="font-medium text-slate-600 dark:text-slate-300">${DEFAULT_LISTING_PRICE}</span> per
                    share.
                  </p>
                  {fractionalEvents[prop.propertyId] && (
                    <div className="space-y-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs break-all text-emerald-700 dark:text-emerald-300">
                      <p>
                        <span className="text-emerald-600/70 dark:text-emerald-400/70">Share Token:</span>{' '}
                        {fractionalEvents[prop.propertyId].shareToken}
                      </p>
                      <p>
                        <span className="text-emerald-600/70 dark:text-emerald-400/70">Total Listed:</span>{' '}
                        {fractionalEvents[prop.propertyId].totalShares}
                      </p>
                      <p>
                        <span className="text-emerald-600/70 dark:text-emerald-400/70">Price/Token:</span> $
                        {fractionalEvents[prop.propertyId].pricePerToken}
                      </p>
                    </div>
                  )}
                </div>
              </PropertyCard>
            );
          })}
        </div>
      ) : (
        <EmptyState>No fractionalized properties found for this wallet.</EmptyState>
      )}
    </AppLayout>
  );
};

export default ListMarketplacePage;
