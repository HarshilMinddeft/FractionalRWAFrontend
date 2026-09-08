import { useCallback, useEffect, useState } from 'react';
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
import { useWeb3 } from '../context/Web3Context';
import { getContractErrorMessage } from '../utils/web3Errors';
import { formatShares, formatStable, parseStable } from '../utils/units';

/** Buyback must be priced at least 10% above the listing price (contract rule). */
const MIN_BUYBACK_MULTIPLIER = 1.1;

const formatDeadline = (timestamp) =>
  new Date(Number(timestamp) * 1000).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const StatRow = ({ label, value, emphasis = false }) => (
  <div className="flex items-baseline justify-between gap-3 text-sm">
    <span className="text-slate-500 dark:text-slate-400">{label}</span>
    <span
      className={`font-medium ${
        emphasis ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'
      }`}
    >
      {value}
    </span>
  </div>
);

/** Owner-side controls for a listing that has no buyback open yet. */
const ActivateBuyBack = ({ listing, onActivate }) => {
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);

  const minPrice = (Number(listing.pricePerToken) * MIN_BUYBACK_MULTIPLIER).toFixed(2);
  const deposit =
    price && Number(price) > 0
      ? (Number(price) * Number(listing.outstandingTokens)).toLocaleString(undefined, {
          maximumFractionDigits: 2,
        })
      : null;

  const handle = async () => {
    setBusy(true);
    try {
      await onActivate(price);
    } finally {
      setBusy(false);
    }
  };

  const noOutstanding = Number(listing.outstandingTokens) === 0;

  return (
    <div className="space-y-3 border-t border-slate-200 pt-3 dark:border-slate-800">
      <StatRow label="Price per token" value={`$${listing.pricePerToken}`} />
      <StatRow label="Outstanding shares" value={listing.outstandingTokens} />

      {noOutstanding ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
          No shares are held by investors yet, so there is nothing to buy back.
        </p>
      ) : (
        <>
          <Input
            label="Buyback price per token"
            type="number"
            min={minPrice}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={`Min $${minPrice}`}
          />
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300">
            <p className="font-semibold">You escrow the full cost up front.</p>
            <p className="mt-1">
              Activating transfers{' '}
              {deposit ? <span className="font-semibold">${deposit}</span> : 'the full buyback cost'} in
              stablecoin to the marketplace so every holder is guaranteed a payout. It is locked for 60
              days, after which you can reclaim whatever is unclaimed.
            </p>
          </div>
          <Button fullWidth onClick={handle} disabled={busy || !price}>
            {busy ? 'Activating…' : 'Activate Buyback'}
          </Button>
        </>
      )}
    </div>
  );
};

/** Owner-side view for a listing whose buyback is already live. */
const ActiveBuyBack = ({ listing, onWithdraw }) => {
  const [busy, setBusy] = useState(false);
  const windowOpen = Date.now() < Number(listing.buyBackDeadline) * 1000;
  const nothingLeft = Number(listing.buyBackEscrow) === 0;

  const handle = async () => {
    setBusy(true);
    try {
      await onWithdraw();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 border-t border-slate-200 pt-3 dark:border-slate-800">
      <div className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
        Buyback active
      </div>

      <StatRow label="Buyback price" value={`$${listing.buyBackPrice}`} emphasis />
      <StatRow label="Escrow remaining" value={`$${listing.buyBackEscrow}`} />
      <StatRow label="Shares still out" value={listing.outstandingTokens} />
      <StatRow label="Claim window ends" value={formatDeadline(listing.buyBackDeadline)} />

      {nothingLeft ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          The escrow is fully paid out — every holder who sold back has been settled.
        </p>
      ) : windowOpen ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
          Holders can sell back until the claim window closes. The remaining escrow unlocks afterwards.
        </p>
      ) : (
        <Button fullWidth variant="secondary" onClick={handle} disabled={busy}>
          {busy ? 'Withdrawing…' : `Withdraw $${listing.buyBackEscrow}`}
        </Button>
      )}
    </div>
  );
};

const BuyBackPage = () => {
  const { address } = useWeb3();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!address) {
      setRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await propertyApi.getAllMarketplaceProperties();
      const allProps = data.properties || [];
      const marketplace = web3Service.getReadOnlyMarketplaceContract();

      const owned = [];
      for (const prop of allProps) {
        try {
          const listing = await marketplace.listings(prop.propertyId);
          if (!listing.active) continue;
          if (listing.owner.toLowerCase() !== address.toLowerCase()) continue;

          const outstanding = await marketplace.outstandingTokens(prop.propertyId);

          owned.push({
            property: prop,
            listing: {
              tokenId: prop.propertyId,
              shareToken: listing.propertyToken,
              pricePerToken: formatStable(listing.pricePerToken),
              outstandingTokens: formatShares(outstanding),
              buyBack: listing.buyBack,
              buyBackPrice: formatStable(listing.buyBackPrice),
              buyBackEscrow: formatStable(listing.buyBackEscrow),
              buyBackDeadline: listing.buyBackDeadline.toString(),
            },
          });
        } catch (err) {
          console.error(`Error reading listing ${prop.propertyId}:`, err);
        }
      }
      setRows(owned);
    } catch (err) {
      console.error('Error loading buyback listings:', err);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    load();
  }, [load]);

  const activateBuyBack = async (tokenId, priceInput) => {
    try {
      const buyBackPrice = parseStable(priceInput);
      const marketplace = await web3Service.getMarketplaceContract();

      // Ask the contract what it will pull rather than recomputing it here,
      // so the approval can never come up short of what activateBuyBack needs.
      const deposit = await marketplace.buyBackDepositRequired(tokenId, buyBackPrice);
      if (deposit.isZero()) {
        toast.error('There are no outstanding shares to buy back.');
        return;
      }

      const stableCoin = await web3Service.getStableCoinContract();
      const approveTx = await stableCoin.approve(contractsConfig.marketplace.address, deposit);
      await approveTx.wait();

      const activateTx = await marketplace.activateBuyBack(tokenId, buyBackPrice);
      await activateTx.wait();

      toast.success('Buyback activated. The escrow is now funded.');
      load();
    } catch (error) {
      console.error('Error activating buyback:', error);
      toast.error(getContractErrorMessage(error, 'Failed to activate buyback. Please try again.'));
    }
  };

  const withdrawDeposit = async (tokenId) => {
    try {
      const marketplace = await web3Service.getMarketplaceContract();
      const tx = await marketplace.withdrawBuyBackDeposit(tokenId);
      await tx.wait();

      toast.success('Unclaimed escrow withdrawn.');
      load();
    } catch (error) {
      console.error('Error withdrawing buyback deposit:', error);
      toast.error(getContractErrorMessage(error, 'Failed to withdraw the deposit. Please try again.'));
    }
  };

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Your assets"
        title="Buyback Program"
        description="Offer to repurchase shares from your investors. The full cost is escrowed up front, so every holder is guaranteed a payout."
        icon={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        }
      />

      {loading ? (
        <Spinner words={['listings', 'escrow', 'buybacks', 'listings']} />
      ) : !address ? (
        <EmptyState title="Wallet not connected">
          Connect your wallet to manage buyback programs for properties you have listed.
        </EmptyState>
      ) : rows.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ property, listing }) => (
            <PropertyCard key={listing.tokenId} property={property}>
              {listing.buyBack ? (
                <ActiveBuyBack
                  listing={listing}
                  onWithdraw={() => withdrawDeposit(listing.tokenId)}
                />
              ) : (
                <ActivateBuyBack
                  listing={listing}
                  onActivate={(price) => activateBuyBack(listing.tokenId, price)}
                />
              )}
            </PropertyCard>
          ))}
        </div>
      ) : (
        <EmptyState title="No active listings">
          You have no active marketplace listings. List a property first to offer a buyback on it.
        </EmptyState>
      )}
    </AppLayout>
  );
};

export default BuyBackPage;
