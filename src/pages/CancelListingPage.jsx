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
import { useWeb3 } from '../context/Web3Context';
import { getContractErrorMessage } from '../utils/web3Errors';
import { formatShares } from '../utils/units';

const SHARES_PER_DOLLAR_DIVISOR = 40;

const CancelListingPage = () => {
  const { address: currentSigner } = useWeb3();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fractionalEvents, setFractionalEvents] = useState({});
  const [userTokenBalances, setUserTokenBalances] = useState([]);
  const [propertyShares, setPropertyShares] = useState({});
  const [listingOwners, setListingOwners] = useState({});
  const [lockedByBuyBack, setLockedByBuyBack] = useState({});

  const fetchProperties = async () => {
    try {
      const data = await propertyApi.getAllMarketplaceProperties();
      const allProps = data.properties || [];

      const marketplaceContract = web3Service.getReadOnlyMarketplaceContract();
      const filteredProps = [];
      for (const prop of allProps) {
        try {
          const checkListing = await marketplaceContract.listings(prop.propertyId);
          if (!checkListing.active) continue;

          filteredProps.push(prop);
          setPropertyShares((prev) => ({
            ...prev,
            [prop.propertyId]: formatShares(checkListing.totalTokens),
          }));
          setListingOwners((prev) => ({ ...prev, [prop.propertyId]: checkListing.owner }));
          // A listing with escrow still committed to holders can't be
          // cancelled until the claim window closes and the owner withdraws.
          setLockedByBuyBack((prev) => ({
            ...prev,
            [prop.propertyId]: !checkListing.buyBackEscrow.isZero(),
          }));
        } catch (err) {
          console.error(`Error checking marketplace listing for token ${prop.propertyId}:`, err);
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
    if (!currentSigner) return;
    try {
      const provider = web3Service.getProvider();
      const vaultContract = web3Service.getReadOnlyVaultContract();
      const balances = [];

      for (const prop of properties) {
        try {
          const fractionalData = await vaultContract.fractionalData(prop.propertyId);
          const tokenAddress = fractionalData.tokenAddress;

          if (tokenAddress && tokenAddress !== ethers.constants.AddressZero) {
            const tokenContract = new ethers.Contract(tokenAddress, contractsConfig.shareToken.abi, provider);

            const [balance, symbol] = await Promise.all([
              tokenContract.balanceOf(currentSigner),
              tokenContract.symbol(),
            ]);

            balances.push({
              propertyId: prop.propertyId,
              tokenAddress,
              symbol,
              balance: formatShares(balance),
            });
          }
        } catch (err) {
          console.error(`Failed for property ID ${prop.propertyId}:`, err);
        }
      }
      setUserTokenBalances(balances);
    } catch (err) {
      console.error('Error fetching token balances:', err);
    }
  };

  const cancelListing = async (tokenId) => {
    try {
      const listTokensContract = await web3Service.getMarketplaceContract();
      const cancelTx = await listTokensContract.cancelListing(tokenId);
      await cancelTx.wait();

      const listing = await listTokensContract.listings(tokenId);
      const listingData = {
        propertyTokenAddress: listing.propertyToken,
        remainingTokens: formatShares(listing.remainingTokens),
      };

      setFractionalEvents((prev) => ({
        ...prev,
        [tokenId]: listingData,
      }));
      toast.success('Listing cancelled successfully.');
    } catch (error) {
      console.error('Transaction error:', error);
      toast.error(getContractErrorMessage(error, 'Failed to cancel listing. Please try again.'));
    }
  };

  useEffect(() => {
    if (properties.length > 0 && currentSigner) {
      fetchUserTokenBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties, currentSigner]);

  useEffect(() => {
    fetchProperties();
  }, []);

  return (
    <AppLayout>
      <PageHeader
        title="Cancel Listing"
        description="Delist your active properties and reclaim any unsold shares."
        icon={<path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />}
      />
      {loading ? (
        <Spinner words={['listings', 'buybacks', 'properties', 'listings']} />
      ) : properties.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((prop) => {
            const tokenInfo = userTokenBalances.find(
              (tkn) => tkn.propertyId === prop.propertyId
            );
            const isOwner = listingOwners[prop.propertyId]?.toLowerCase() === currentSigner?.toLowerCase();

            return (
              <PropertyCard key={prop.propertyId} property={prop}>
                {tokenInfo && isOwner ? (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2 text-sm">
                    <p className="text-slate-500 dark:text-slate-400">
                      Your balance: <span className="text-slate-700 dark:text-slate-200 font-medium">{tokenInfo.balance}</span>
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      Expected: <span className="text-slate-700 dark:text-slate-200 font-medium">{Math.floor(Number(prop.propertyPrice) / SHARES_PER_DOLLAR_DIVISOR)}</span>
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      Total listed: <span className="text-slate-700 dark:text-slate-200 font-medium">{propertyShares[prop.propertyId] || 'N/A'}</span>
                    </p>
                    <p className="text-xs text-slate-500 break-all">{tokenInfo.tokenAddress}</p>

                    {fractionalEvents[prop.propertyId] ? (
                      <p className="text-emerald-600 dark:text-emerald-400 font-semibold">Delisting Successful</p>
                    ) : lockedByBuyBack[prop.propertyId] ? (
                      <p className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300">
                        A funded buyback is still open on this listing. Withdraw the remaining escrow
                        from the Buyback Program page once the claim window closes, then delist.
                      </p>
                    ) : (
                      <Button fullWidth variant="danger" onClick={() => cancelListing(prop.propertyId)}>
                        Delist
                      </Button>
                    )}

                    {fractionalEvents[prop.propertyId] && (
                      <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-700 dark:text-emerald-300 space-y-1 break-all">
                        <p><span className="text-emerald-600/70 dark:text-emerald-400/70">Share Token:</span> {fractionalEvents[prop.propertyId].propertyTokenAddress}</p>
                        <p><span className="text-emerald-600/70 dark:text-emerald-400/70">Remaining:</span> {fractionalEvents[prop.propertyId].remainingTokens}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="pt-2 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-500">Delisted</p>
                )}
              </PropertyCard>
            );
          })}
        </div>
      ) : (
        <EmptyState>No active listings found for this wallet.</EmptyState>
      )}
    </AppLayout>
  );
};

export default CancelListingPage;
