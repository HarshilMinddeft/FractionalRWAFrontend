import { useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { motion } from 'motion/react';
import AppLayout from '../components/layout/AppLayout';
import PropertyCard from '../components/property/PropertyCard';
import PropertyGridSkeleton from '../components/property/PropertyGridSkeleton';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import web3Service from '../services/web3Service';
import propertyApi from '../api/propertyApi';
import contractsConfig from '../config/contracts.config';
import { getContractErrorMessage } from '../utils/web3Errors';
import { expectedShares, formatNumber } from '../lib/utils';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const rise = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' } },
};

const CancelListingPage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fractionalEvents, setFractionalEvents] = useState({});
  const [userTokenBalances, setUserTokenBalances] = useState([]);
  const [currentSigner, setCurrentSigner] = useState('');
  const [propertyShares, setPropertyShares] = useState({});
  const [listingOwners, setListingOwners] = useState({});
  const [busyId, setBusyId] = useState(null);

  const totals = useMemo(() => {
    let shares = 0;
    for (const key of Object.keys(propertyShares)) {
      shares += Number(propertyShares[key]) || 0;
    }
    return { count: properties.length, shares };
  }, [properties, propertyShares]);

  const fetchProperties = async () => {
    try {
      const data = await propertyApi.getAllMarketplaceProperties();
      const allProps = data.properties || [];

      const marketplaceContract = web3Service.getReadOnlyMarketplaceContract();
      const filteredProps = [];
      const shares = {};
      const owners = {};
      for (const prop of allProps) {
        try {
          const checkListing = await marketplaceContract.listings(prop.propertyId);
          const buyBack = checkListing.buyBack;
          const sh = Number(ethers.utils.formatUnits(checkListing.totalTokens, 18)).toString();
          const owner = checkListing.owner;

          if (buyBack) {
            filteredProps.push(prop);
            shares[prop.propertyId] = sh;
            owners[prop.propertyId] = owner;
          }
        } catch (err) {
          console.error(`Error checking marketplace listing for token ${prop.propertyId}:`, err);
        }
      }
      setProperties(filteredProps);
      setPropertyShares(shares);
      setListingOwners(owners);
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

      const provider = web3Service.getProvider();
      const vaultContract = web3Service.getReadOnlyVaultContract();
      const balances = [];

      for (const prop of properties) {
        try {
          const fractionalData = await vaultContract.fractionalData(prop.propertyId);
          const tokenAddress = fractionalData.tokenAddress;

          if (tokenAddress && tokenAddress !== ethers.constants.AddressZero) {
            const tokenContract = new ethers.Contract(tokenAddress, contractsConfig.vault.abi, provider);

            const [balance, symbol, decimals] = await Promise.all([
              tokenContract.balanceOf(address),
              tokenContract.symbol(),
              tokenContract.decimals(),
            ]);

            balances.push({
              propertyId: prop.propertyId,
              tokenAddress,
              symbol,
              balance: ethers.utils.formatUnits(balance, decimals),
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
    setBusyId(tokenId);
    try {
      const listTokensContract = await web3Service.getMarketplaceContract();
      const cancelTx = await listTokensContract.cancelListing(tokenId);
      await cancelTx.wait();

      const listing = await listTokensContract.listings(tokenId);
      const listingData = {
        propertyTokenAddress: listing.propertyToken,
        remainingTokens: listing.remainingTokens.toString(),
      };

      setFractionalEvents((prev) => ({
        ...prev,
        [tokenId]: listingData,
      }));
      toast.success('Listing cancelled successfully.');
    } catch (error) {
      console.error('Transaction error:', error);
      toast.error(getContractErrorMessage(error, 'Failed to cancel listing. Please try again.'));
    } finally {
      setBusyId(null);
    }
  };

  useEffect(() => {
    if (properties.length > 0) {
      fetchUserTokenBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties]);

  useEffect(() => {
    const init = async () => {
      const address = await web3Service.getWalletAddress();
      if (address) {
        setCurrentSigner(address);
      }
      fetchProperties();
    };
    init();
  }, []);

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Your assets"
        title="Cancel Listing"
        description="End a buyback program: withdraw the shares that are still held in the marketplace contract and delist the property."
        icon={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        }
      />

      {!loading && (
        <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          <StatCard
            label="Buyback listings"
            value={formatNumber(totals.count, 0)}
            tone="danger"
            icon={<CancelIcon />}
          />
          <StatCard
            label="Shares in escrow"
            value={formatNumber(totals.shares, 0)}
            sub="held by the marketplace"
            tone="warning"
            icon={<LockIcon />}
          />
          <StatCard
            label="Eligible withdrawers"
            value={userTokenBalances.length > 0 ? formatNumber(userTokenBalances.length, 0) : '—'}
            sub="with matching wallet balance"
            tone="brand"
            icon={<WalletIcon />}
          />
        </div>
      )}

      {loading ? (
        <PropertyGridSkeleton />
      ) : properties.length > 0 ? (
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {properties.map((prop) => {
            const tokenInfo = userTokenBalances.find((tkn) => tkn.propertyId === prop.propertyId);
            const isOwner = listingOwners[prop.propertyId]?.toLowerCase() === currentSigner?.toLowerCase();
            const done = fractionalEvents[prop.propertyId];
            const shares = propertyShares[prop.propertyId];

            return (
              <motion.div key={prop.propertyId} variants={rise} className="h-full">
                <PropertyCard property={prop}>
                  {done ? (
                    <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-3.5 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                      <Badge tone="success" dot>
                        Delisted successfully
                      </Badge>
                      <p className="mt-2 text-xs leading-relaxed text-emerald-800/80 dark:text-emerald-200/70">
                        The buyback program was closed. Shares are no longer listed on the marketplace.
                      </p>
                    </div>
                  ) : tokenInfo && isOwner ? (
                    <div className="space-y-2.5">
                      <div className="space-y-1.5 rounded-xl bg-red-50/70 px-3.5 py-2.5 text-[13px] dark:bg-red-950/20">
                        <Row label="Your balance" value={`${formatNumber(tokenInfo.balance)} ${tokenInfo.symbol || ''}`} />
                        <Row label="Total listed" value={`${formatNumber(shares)} shares`} />
                        <Row
                          label="Expected share count"
                          value={formatNumber(expectedShares(prop.propertyPrice))}
                        />
                        <p className="truncate pt-1 font-mono text-[10.5px] text-red-400/70 dark:text-red-300/50">
                          {tokenInfo.tokenAddress}
                        </p>
                      </div>
                      <Button
                        fullWidth
                        variant="danger"
                        loading={busyId === prop.propertyId}
                        onClick={() => cancelListing(prop.propertyId)}
                      >
                        Delist property
                      </Button>
                      <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
                        Ends the buyback and withdraws escrowed shares to your wallet
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-slate-50 px-3.5 py-3 text-center text-[13px] font-medium text-slate-400 dark:bg-slate-950/50 dark:text-slate-500">
                      Buyback program active — the listing owner can delist from their wallet.
                    </div>
                  )}
                </PropertyCard>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <EmptyState
          title="No active buyback listings"
          action={
            <Button variant="soft" size="sm" onClick={() => (window.location.href = '/marketplace')}>
              Back to the marketplace
            </Button>
          }
        >
          Properties show up here once their owner activates a buyback program from the property page.
        </EmptyState>
      )}
    </AppLayout>
  );
};

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between">
    <span className="text-slate-400 dark:text-slate-500">{label}</span>
    <span className="font-semibold text-slate-700 tabular-nums dark:text-slate-200">{value}</span>
  </div>
);

const CancelIcon = () => (
  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const LockIcon = () => (
  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
    />
  </svg>
);

const WalletIcon = () => (
  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3"
    />
  </svg>
);

export default CancelListingPage;
