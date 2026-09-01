import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import AppLayout from '../components/layout/AppLayout';
import PropertyCard from '../components/property/PropertyCard';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import web3Service from '../services/web3Service';
import propertyApi from '../api/propertyApi';
import contractsConfig from '../config/contracts.config';
import { getContractErrorMessage } from '../utils/web3Errors';

const SHARES_PER_DOLLAR_DIVISOR = 40;

const RedeemTokensPage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fractionalEvents, setFractionalEvents] = useState({});

  const fetchProperties = async (address) => {
    try {
      const data = await propertyApi.getOwnerProperties(address);
      const allProps = data.properties || [];

      const propertyNftContract = web3Service.getReadOnlyPropertyNftContract();
      const marketplaceContract = web3Service.getReadOnlyMarketplaceContract();
      const filteredProps = [];
      for (const prop of allProps) {
        try {
          const checkListing = await marketplaceContract.listings(prop.propertyId);
          const isFrac = await propertyNftContract.isFractionalized(prop.propertyId);
          if (isFrac && !checkListing.active) {
            filteredProps.push(prop);
          }
        } catch (err) {
          console.error(`Error checking property ${prop.propertyId}:`, err);
        }
      }
      setProperties(filteredProps);
    } catch (err) {
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const redeemTokens = async (tokenId, complianceAddress) => {
    try {
      const signer = await web3Service.getSigner();
      const vaultContract = await web3Service.getVaultContract();

      const propertyToken = await vaultContract.fractionalData(tokenId);
      const propertyShareTokenAddr = propertyToken.tokenAddress;
      const totalTokens = propertyToken.totalShares;

      const propertyTokensTxn = new ethers.Contract(propertyShareTokenAddr, contractsConfig.vault.abi, signer);

      const approveTx = await propertyTokensTxn.approve(contractsConfig.vault.address, totalTokens);
      await approveTx.wait();

      const vaultTx = await vaultContract.redeemShares(tokenId);
      await vaultTx.wait();

      const unbindTokenContract = new ethers.Contract(complianceAddress, contractsConfig.compliance.abi, signer);

      const unbindTx = await unbindTokenContract.unbindToken(propertyShareTokenAddr);
      await unbindTx.wait();

      const afterData = await vaultContract.fractionalData(tokenId);
      setFractionalEvents((prev) => ({
        ...prev,
        [tokenId]: {
          shareToken: afterData.tokenAddress,
          totalShares: afterData.totalShares.toString(),
          originalOwner: afterData.originalOwner,
          compAddress: afterData.complianceAddress,
        },
      }));
      toast.success('Property tokens redeemed successfully.');
    } catch (error) {
      console.error('Error redeeming property tokens:', error);
      toast.error(getContractErrorMessage(error, 'Redemption failed. Please try again.'));
    }
  };

  useEffect(() => {
    const init = async () => {
      const address = await web3Service.getWalletAddress();
      if (address) {
        fetchProperties(address);
      } else {
        setLoading(false);
      }
    };
    init();
  }, []);

  return (
    <AppLayout>
      <PageHeader
        title="Redeem Property"
        description="Redeem fractional tokens to reclaim the underlying property."
        icon={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        }
      />
      {loading ? (
        <Spinner words={['tokens', 'balances', 'properties', 'tokens']} />
      ) : properties.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((prop) => (
            <PropertyCard key={prop.propertyId} property={prop}>
              <div className="space-y-3 border-t border-slate-200 pt-2 dark:border-slate-800">
                {!fractionalEvents[prop.propertyId] ? (
                  <>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      You should have{' '}
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {Math.floor(Number(prop.propertyPrice) / SHARES_PER_DOLLAR_DIVISOR)}
                      </span>{' '}
                      fractional tokens
                    </p>
                    <Button fullWidth onClick={() => redeemTokens(prop.propertyId, prop.complianceAddress)}>
                      Redeem Property
                    </Button>
                  </>
                ) : (
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">All Tokens Redeemed</p>
                )}
                {fractionalEvents[prop.propertyId] && (
                  <div className="space-y-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs break-all text-emerald-700 dark:text-emerald-300">
                    <p>
                      <span className="text-emerald-600/70 dark:text-emerald-400/70">Share Token:</span>{' '}
                      {fractionalEvents[prop.propertyId].shareToken}
                    </p>
                    <p>
                      <span className="text-emerald-600/70 dark:text-emerald-400/70">Total Shares:</span>{' '}
                      {fractionalEvents[prop.propertyId].totalShares}
                    </p>
                  </div>
                )}
              </div>
            </PropertyCard>
          ))}
        </div>
      ) : (
        <EmptyState>No properties found for this wallet.</EmptyState>
      )}
    </AppLayout>
  );
};

export default RedeemTokensPage;
