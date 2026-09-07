import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import AppLayout from '../components/layout/AppLayout';
import PropertyCard from '../components/property/PropertyCard';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import web3Service from '../services/web3Service';
import propertyApi from '../api/propertyApi';
import contractsConfig from '../config/contracts.config';
import { useWeb3 } from '../context/Web3Context';
import {
  formatShares,
  formatStable,
  isValidPriceTier,
  parseShares,
  parseStable,
  PRICE_STEP,
  PRICE_TIERS,
} from '../utils/units';

const DEFAULT_LISTING_PRICE = 40;

const ListMarketplacePage = () => {
  const { address: userAddress } = useWeb3();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fractionalEvents, setFractionalEvents] = useState({});
  const [tokensInputs, setTokenInputs] = useState({});
  const [priceInputs, setPriceInputs] = useState({});
  const [existingListings, setExistingListings] = useState({});
  const [fractionalizeBasePrices, setFractionalizeBasePrices] = useState({});
  const [userTokenBalances, setUserTokenBalances] = useState([]);

  const fetchProperties = async (address) => {
    try {
      const data = await propertyApi.getOwnerProperties(address);
      const allProps = data.properties || [];

      const propertyNftContract = web3Service.getReadOnlyPropertyNftContract();
      const marketplaceContract = web3Service.getReadOnlyMarketplaceContract();
      const vaultContract = web3Service.getReadOnlyVaultContract();
      const filteredProps = [];
      for (const prop of allProps) {
        try {
          const isFrac = await propertyNftContract.isFractionalized(prop.propertyId);
          if (!isFrac) continue;

          filteredProps.push(prop);

          // An active listing already has a price; only a new listing lets the
          // owner choose one, so record which case each property is in.
          const listing = await marketplaceContract.listings(prop.propertyId);
          setExistingListings((prev) => ({
            ...prev,
            [prop.propertyId]: listing.active ? formatStable(listing.pricePerToken) : null,
          }));

          // The vault doesn't store the base price Fractionalize used, but
          // propertyPrice / totalShares recovers it exactly (that's how
          // totalShares was derived in the first place).
          if (!listing.active) {
            const { totalShares } = await vaultContract.fractionalData(prop.propertyId);
            if (!totalShares.isZero()) {
              const basePrice = Number(prop.propertyPrice) / Number(formatShares(totalShares));
              setFractionalizeBasePrices((prev) => ({ ...prev, [prop.propertyId]: basePrice }));
            }
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
    if (!userAddress) return;
    try {
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
              provider
            );

            const balance = await tokenContract.balanceOf(userAddress);

            balances.push({
              propertyId: prop.propertyId,
              propertyName: prop.propertyName,
              tokenAddress: propertyShareTokenAddr,
              balance: formatShares(balance),
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

    const listingPrice = priceInputs[tokenId] ?? DEFAULT_LISTING_PRICE;
    if (!isValidPriceTier(listingPrice)) {
      toast.error(`Price per share must be a multiple of $${PRICE_STEP}.`);
      return;
    }

    try {
      const tokensToListForProp = parseShares(inputValue);

      const vaultContract = await web3Service.getVaultContract();
      const propertyToken = await vaultContract.fractionalData(tokenId);
      const propertyShareTokenAddr = propertyToken.tokenAddress;

      const propertyTokensTxn = await web3Service.getShareTokenContract(propertyShareTokenAddr);

      const marketplaceContract = await web3Service.getMarketplaceContract();
      const checkListingData = await marketplaceContract.listings(tokenId);
      const checkListing = checkListingData.active;

      const approveTx = await propertyTokensTxn.approve(
        contractsConfig.marketplace.address,
        tokensToListForProp
      );
      await approveTx.wait();

      if (!checkListing) {
        // listProperty takes the share token itself (not the tokenId) and the
        // opening price; the marketplace derives the tokenId from the token.
        const listTx = await marketplaceContract.listProperty(
          propertyShareTokenAddr,
          tokensToListForProp,
          parseStable(listingPrice)
        );
        await listTx.wait();
      } else {
        const addTokensTx = await marketplaceContract.addTokensToListing(
          tokenId,
          tokensToListForProp
        );
        await addTokensTx.wait();
      }

      const afterListingData = await marketplaceContract.listings(tokenId);
      const listingInfo = {
        shareToken: afterListingData.propertyToken,
        totalShares: formatShares(afterListingData.totalTokens),
        pricePerToken: formatStable(afterListingData.pricePerToken),
        remainingTokens: formatShares(afterListingData.remainingTokens),
      };

      setFractionalEvents((prev) => ({
        ...prev,
        [tokenId]: listingInfo,
      }));
      setExistingListings((prev) => ({ ...prev, [tokenId]: listingInfo.pricePerToken }));

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
    if (userAddress) {
      fetchProperties(userAddress);
    } else {
      setLoading(false);
    }
  }, [userAddress]);

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
        icon={<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />}
      />
      {loading ? (
        <Spinner words={['properties', 'balances', 'listings', 'properties']} />
      ) : properties.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((prop) => {
            const tokenBalanceObj = userTokenBalances.find(
              (b) => b.propertyId === prop.propertyId
            );
            const availableBalance = tokenBalanceObj ? tokenBalanceObj.balance : '0';
            const listedPrice = existingListings[prop.propertyId];

            // Default the dropdown to the price per share this property was
            // fractionalized at, snapped to the nearest offered tier — the
            // owner can still pick a different tier before listing.
            const basePrice = fractionalizeBasePrices[prop.propertyId];
            const defaultPrice = basePrice
              ? PRICE_TIERS.reduce((closest, tier) =>
                  Math.abs(tier - basePrice) < Math.abs(closest - basePrice) ? tier : closest
                )
              : DEFAULT_LISTING_PRICE;
            const selectedPrice = priceInputs[prop.propertyId] ?? defaultPrice;

            return (
              <PropertyCard key={prop.propertyId} property={prop}>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Your balance: <span className="text-slate-700 dark:text-slate-200 font-medium">{availableBalance}</span>
                  </p>
                  <Input
                    label="Tokens to list"
                    type="number"
                    placeholder="e.g. 500"
                    value={tokensInputs[prop.propertyId] || ''}
                    onChange={(e) => handleInputChange(prop.propertyId, e.target.value)}
                  />
                  {listedPrice ? (
                    <p className="text-xs text-slate-500">
                      Already listed at{' '}
                      <span className="font-medium text-slate-600 dark:text-slate-300">${listedPrice}</span> per
                      share. These tokens will be added to that listing at the same price.
                    </p>
                  ) : (
                    <Select
                      label="Price per share"
                      value={selectedPrice}
                      onChange={(e) =>
                        setPriceInputs((prev) => ({ ...prev, [prop.propertyId]: e.target.value }))
                      }
                    >
                      {PRICE_TIERS.map((tier) => (
                        <option key={tier} value={tier}>
                          ${tier}
                        </option>
                      ))}
                    </Select>
                  )}
                  <Button fullWidth onClick={() => listToMarketplace(prop.propertyId)}>
                    {listedPrice ? 'Add to Listing' : 'List Property'}
                  </Button>
                  {fractionalEvents[prop.propertyId] && (
                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-700 dark:text-emerald-300 space-y-1 break-all">
                      <p><span className="text-emerald-600/70 dark:text-emerald-400/70">Share Token:</span> {fractionalEvents[prop.propertyId].shareToken}</p>
                      <p><span className="text-emerald-600/70 dark:text-emerald-400/70">Total Listed:</span> {fractionalEvents[prop.propertyId].totalShares}</p>
                      <p><span className="text-emerald-600/70 dark:text-emerald-400/70">Price/Token:</span> ${fractionalEvents[prop.propertyId].pricePerToken}</p>
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
