import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import AppLayout from '../../../components/layout/AppLayout';
import PageHeader from '../../../components/ui/PageHeader';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Spinner from '../../../components/ui/Spinner';
import EmptyState from '../../../components/ui/EmptyState';
import web3Service from '../../../services/web3Service';
import useAuthorityRole from '../hooks/useAuthorityRole';
import { useWeb3 } from '../../../context/Web3Context';
import { getContractErrorMessage } from '../../../utils/web3Errors';
import { cn } from '../../../lib/utils';
import useTweenedNumber from '../../../hooks/useTweenedNumber';

const PRESETS = [5, 10, 15, 20, 25];
const SLIDER_MAX = 50; // %; the input below accepts more, up to the uint16 limit
const MAX_BPS = 65535; // setMinBuyBackPremiumBps takes a uint16
const EXAMPLE_PRICES = [10, 40, 100];

// 1% = 100 bps. The contract stores a uint16.
const premiumToBps = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
};

const pct = (bps) => `${(bps / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}%`;

// Mirrors FractionalMarketplace._activateBuyBack:
//   minimumBuyBackPrice = pricePerToken * (10_000 + bps) / 10_000
const minBuyBack = (price, bps) => (price * (10_000 + bps)) / 10_000;

const usd = (n) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const SetBuybackPremiumPage = () => {
  const { address } = useWeb3();

  const [currentPremiumBps, setCurrentPremiumBps] = useState(null);
  const [premium, setPremium] = useState('');
  const [examplePrice, setExamplePrice] = useState('40');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  // setMinBuyBackPremiumBps is onlyRole(DEFAULT_ADMIN_ROLE) — stricter than the
  // AUTHORITY_ROLE that lets a wallet onto this page.
  const [isMarketplaceAdmin, setIsMarketplaceAdmin] = useState(true);

  const { isAuthority, checking } = useAuthorityRole(address);

  const loadPremium = useCallback(async () => {
    setLoading(true);
    try {
      const marketplace = web3Service.getReadOnlyMarketplaceContract();
      const [bpsRaw, adminRole] = await Promise.all([
        marketplace.minBuyBackPremiumBps(),
        marketplace.DEFAULT_ADMIN_ROLE(),
      ]);
      const bps = Number(bpsRaw);
      setCurrentPremiumBps(bps);
      setPremium((bps / 100).toString());
      if (address) setIsMarketplaceAdmin(await marketplace.hasRole(adminRole, address));
    } catch (error) {
      console.error('Error loading buyback premium:', error);
      toast.error('Failed to load the current buyback premium.');
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (isAuthority) loadPremium();
    else setLoading(false);
  }, [isAuthority, loadPremium]);

  const newBps = premiumToBps(premium);
  const validationError = (() => {
    if (premium === '' || newBps === null) return 'Enter a premium.';
    if (newBps <= 0) return 'The premium must be greater than 0% — 0 would let a buyback undercut the listing price.';
    if (newBps > MAX_BPS) return `The premium can be at most ${pct(MAX_BPS)}.`;
    return null;
  })();
  const unchanged = currentPremiumBps !== null && newBps === currentPremiumBps;
  const delta = currentPremiumBps !== null && newBps !== null ? newBps - currentPremiumBps : 0;
  // 0 on-chain means "never configured": cancelListing reverts with
  // MinBuyBackPremiumNotSet until an admin sets it.
  const notConfigured = currentPremiumBps === 0;

  // The "New" figure glides to each value while the slider moves; one decimal
  // while in motion so the digits don't flicker, exact once it settles.
  const [shownPct, pctMoving] = useTweenedNumber(newBps !== null && !validationError ? newBps / 100 : 0);
  const [shownDelta, deltaMoving] = useTweenedNumber(delta / 100);
  const fmtTween = (n, moving) =>
    n.toLocaleString('en-US', { minimumFractionDigits: moving ? 1 : 0, maximumFractionDigits: moving ? 1 : 2 });

  const handleUpdate = async () => {
    if (validationError) return toast.error(validationError);
    if (unchanged) return toast.info('Buyback premium is already set to this value.');

    setUpdating(true);
    try {
      const marketplace = await web3Service.getMarketplaceContract();
      const tx = await marketplace.setMinBuyBackPremiumBps(newBps);
      toast.info('Transaction submitted. Waiting for confirmation...');
      await tx.wait();

      const updated = Number(await marketplace.minBuyBackPremiumBps());
      setCurrentPremiumBps(updated);
      setPremium((updated / 100).toString());
      toast.success(`Buyback premium updated to ${pct(updated)} (${updated} bps).`);
    } catch (error) {
      console.error('Error updating buyback premium:', error);
      toast.error(getContractErrorMessage(error, 'Failed to update the buyback premium. Please try again.'));
    } finally {
      setUpdating(false);
    }
  };

  const body = () => {
    if (checking || loading) {
      return <Spinner words={['permissions', 'buyback premium', 'marketplace', 'settings']} />;
    }

    if (!address) {
      return (
        <EmptyState title="Wallet not connected">Connect the admin wallet to change the buyback premium.</EmptyState>
      );
    }

    if (!isAuthority) {
      return (
        <EmptyState title="Not authorized">
          This wallet does not hold the required marketplace authority role, so it cannot change the buyback premium.
          Switch to an authorized wallet and try again.
        </EmptyState>
      );
    }

    const sliderValue = Math.min(SLIDER_MAX, Math.max(0, Number(premium) || 0));
    const example = Number(examplePrice) > 0 ? Number(examplePrice) : 0;

    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* ── Setting ───────────────────────────────────────────────────── */}
        <Card className="p-6 lg:col-span-3">
          {/* Current → new */}
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">
                Current minimum
              </p>
              <p className="mt-1 text-4xl font-bold tracking-tight text-slate-900 tabular-nums dark:text-white">
                {notConfigured ? 'Not set' : pct(currentPremiumBps)}
              </p>
              <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">
                {currentPremiumBps} bps on-chain
              </p>
            </div>

            {!validationError && !unchanged && (
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
                <div className="text-right">
                  <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">New</p>
                  <p className="mt-1 text-4xl font-bold tracking-tight text-indigo-600 tabular-nums dark:text-indigo-400">
                    {fmtTween(shownPct, pctMoving)}%
                  </p>
                  {!notConfigured && (
                    <p
                      className={cn(
                        'mt-1 text-xs font-semibold',
                        delta > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
                      )}
                    >
                      {delta > 0 ? '▲' : '▼'} {fmtTween(Math.abs(shownDelta), deltaMoving)} pts
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {!isMarketplaceAdmin && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">
              This wallet has the marketplace authority role but not DEFAULT_ADMIN_ROLE, which changing the premium
              requires — the transaction would revert. Switch to the marketplace admin wallet.
            </p>
          )}

          {notConfigured && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">
              No premium is configured yet, so owners can’t cancel listings that have outstanding shares. Set one to
              enable buybacks.
            </p>
          )}

          <div className="my-6 h-px bg-slate-100 dark:bg-slate-800" />

          {/* Slider + input */}
          <label htmlFor="buybackPremium" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            New minimum buyback premium
          </label>
          <div className="mt-3 flex items-center gap-4">
            <input
              type="range"
              min="0"
              max={SLIDER_MAX}
              step="0.5"
              value={sliderValue}
              onChange={(e) => setPremium(e.target.value)}
              disabled={updating}
              aria-label="Premium slider"
              className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-indigo-600 dark:bg-slate-700"
              // Filled part of the track; the unfilled part is the bg-* class.
              style={{
                backgroundImage: 'linear-gradient(to right, var(--color-indigo-500), var(--color-violet-500))',
                backgroundSize: `${(sliderValue / SLIDER_MAX) * 100}% 100%`,
                backgroundRepeat: 'no-repeat',
              }}
            />
            <div className="relative w-28 shrink-0">
              <input
                id="buybackPremium"
                type="number"
                min="0.01"
                step="0.01"
                value={premium}
                onChange={(e) => setPremium(e.target.value)}
                disabled={updating}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white pr-8 pl-3 text-right text-lg font-semibold text-slate-900 tabular-nums outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-slate-400">%</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Presets</span>
            {PRESETS.map((p) => {
              const active = newBps === p * 100;
              const isCurrent = currentPremiumBps === p * 100;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPremium(String(p))}
                  disabled={updating}
                  className={cn(
                    'cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition-all',
                    active
                      ? 'border-transparent bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-400/50 dark:hover:text-indigo-300',
                  )}
                >
                  {p}%{isCurrent && !active && <span className="ml-1 text-[10px] opacity-70">current</span>}
                </button>
              );
            })}
          </div>

          <p className="mt-3 min-h-5 text-xs">
            {validationError ? (
              <span className="font-medium text-red-500">{validationError}</span>
            ) : (
              <span className="text-slate-500 dark:text-slate-400">
                Stored on-chain as <span className="font-mono font-semibold">{newBps} bps</span> (1% = 100 bps).
              </span>
            )}
          </p>

          <div className="mt-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
            <svg className="mt-0.5 h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
            <span>
              Applies to every buyback opened <strong>after</strong> this change, on all properties. Buybacks already
              open keep the price they were opened at.
            </span>
          </div>

          <Button
            className="mt-6"
            size="lg"
            fullWidth
            onClick={handleUpdate}
            loading={updating}
            disabled={updating || Boolean(validationError) || unchanged || !isMarketplaceAdmin}
          >
            {updating
              ? 'Updating…'
              : unchanged
                ? `Already set to ${pct(currentPremiumBps)}`
                : validationError
                  ? 'Enter a valid premium'
                  : `Set minimum premium to ${pct(newBps)}`}
          </Button>
        </Card>

        {/* ── What it means ─────────────────────────────────────────────── */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">What this controls</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            When an owner cancels a listing while investors still hold shares, they must offer to buy those shares
            back. The buyback price can’t be lower than the listing price plus this premium — so investors who want
            out always exit at a profit.
          </p>

          <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-indigo-700 dark:bg-slate-800/60 dark:text-indigo-300">
            min buyback = listing price × (1 + premium)
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">
                Minimum buyback price
              </p>
              <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                Listing
                <span className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    min="0"
                    value={examplePrice}
                    onChange={(e) => setExamplePrice(e.target.value)}
                    className="h-8 w-20 rounded-md border border-slate-300 bg-white pr-2 pl-5 text-right text-xs font-semibold text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </span>
              </label>
            </div>

            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-3 bg-slate-50 px-4 py-2 text-[11px] font-semibold tracking-wide text-slate-400 uppercase dark:bg-slate-800/60 dark:text-slate-500">
                <span>Listing price</span>
                <span className="text-right">Current</span>
                <span className="text-right">New</span>
              </div>
              {[...new Set([example, ...EXAMPLE_PRICES])]
                .filter((p) => p > 0)
                .map((price, i) => (
                  <div
                    key={price}
                    className={cn(
                      'grid grid-cols-3 border-t border-slate-100 px-4 py-2.5 text-sm tabular-nums dark:border-slate-800',
                      i === 0 && 'bg-indigo-50/60 dark:bg-indigo-500/5',
                    )}
                  >
                    <span className="font-medium text-slate-700 dark:text-slate-200">{usd(price)}</span>
                    <span className="text-right text-slate-500 dark:text-slate-400">
                      {notConfigured ? '—' : usd(minBuyBack(price, currentPremiumBps))}
                    </span>
                    <span className="text-right font-semibold text-slate-900 dark:text-white">
                      {validationError ? '—' : usd(minBuyBack(price, newBps))}
                    </span>
                  </div>
                ))}
            </div>
            {!validationError && example > 0 && (
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                A share listed at {usd(example)} must be bought back for at least{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-200">{usd(minBuyBack(example, newBps))}</span>{' '}
                — {usd(minBuyBack(example, newBps) - example)} more per share for the holder.
              </p>
            )}
          </div>
        </Card>
      </div>
    );
  };

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Administration"
        title="Buyback Premium"
        description="The minimum mark-up an owner must pay to buy shares back from investors when cancelling a listing. Requires the marketplace admin role (DEFAULT_ADMIN_ROLE)."
        icon={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v12m-3-3 3 3 3-3M6.75 4.5h10.5A2.25 2.25 0 0 1 19.5 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H6.75a2.25 2.25 0 0 1-2.25-2.25V6.75A2.25 2.25 0 0 1 6.75 4.5Z"
          />
        }
      />

      {body()}
    </AppLayout>
  );
};

export default SetBuybackPremiumPage;
