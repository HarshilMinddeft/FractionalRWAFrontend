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
import { cn, shortenAddress } from '../../../lib/utils';
import useTweenedNumber from '../../../hooks/useTweenedNumber';

const PRESETS = [0, 0.1, 0.25, 0.5, 1];
const SLIDER_MAX = 5; // %; the input below accepts up to 100%
const HIGH_FEE_BPS = 500; // warn above 5%
const MAX_BPS = 10_000; // FeeManager rejects anything above BPS_DENOMINATOR
const EXAMPLE_AMOUNTS = [100, 1_000, 10_000];
const HISTORY_LIMIT = 10;

// The six fields of IFeeManager.FeeConfig. Only saleFeeBps is edited here;
// the rest are carried over unchanged into the new version.
const FEE_FIELDS = [
  'saleFeeBps',
  'saleServicerFeeBps',
  'interestFeeBps',
  'interestServicerFeeBps',
  'foreclosureFeeBps',
  'preSaleProfitSharingBps',
];

const pctToBps = (value) => {
  const n = Number(value);
  return value !== '' && Number.isFinite(n) ? Math.round(n * 100) : null;
};

const pct = (bps) => `${(bps / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}%`;

// Mirrors _collectSaleFee in FractionalMarketplace and Orderbook:
//   fee = totalPrice * saleFeeBps / 10_000, paid by the buyer on top of the price
const saleFee = (amount, bps) => (amount * bps) / 10_000;

const usd = (n) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const toConfig = (raw) => Object.fromEntries(FEE_FIELDS.map((f) => [f, Number(raw[f])]));

const UpdateSaleFeePage = () => {
  const { address } = useWeb3();
  const { isAuthority, checking } = useAuthorityRole(address);

  const [state, setState] = useState(null); // { feeManager, owner, treasury, version, config, history, orderbookMismatch }
  const [fee, setFee] = useState('');
  const [exampleAmount, setExampleAmount] = useState('1000');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const marketplace = web3Service.getReadOnlyMarketplaceContract();
      const orderbook = web3Service.getReadOnlyOrderBookContract();
      const [feeManagerAddress, orderbookFeeManager] = await Promise.all([
        marketplace.feeManager(),
        orderbook.feeManager(),
      ]);
      const feeManager = web3Service.getReadOnlyFeeManagerContract(feeManagerAddress);
      const [owner, treasury, versionRaw] = await Promise.all([
        feeManager.owner(),
        feeManager.treasury(),
        feeManager.currentFeeVersion(),
      ]);
      const version = Number(versionRaw);

      // Newest first. Version 0 means no config was ever created.
      const versions = Array.from({ length: Math.min(version, HISTORY_LIMIT) }, (_, i) => version - i);
      const configs = await Promise.all(versions.map((v) => feeManager.getFeeConfig(v)));
      const history = versions.map((v, i) => ({ version: v, saleFeeBps: Number(configs[i].saleFeeBps) }));
      const config = version > 0 ? toConfig(configs[0]) : Object.fromEntries(FEE_FIELDS.map((f) => [f, 0]));

      setState({
        feeManager: feeManagerAddress,
        owner,
        treasury,
        version,
        config,
        history,
        orderbookMismatch: orderbookFeeManager.toLowerCase() !== feeManagerAddress.toLowerCase(),
      });
      setFee((config.saleFeeBps / 100).toString());
    } catch (error) {
      console.error('Error loading fee settings:', error);
      toast.error('Failed to load the current trading fee.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthority) load();
    else setLoading(false);
  }, [isAuthority, load]);

  const currentBps = state?.config.saleFeeBps ?? null;
  const isOwner = Boolean(state && address && state.owner.toLowerCase() === address.toLowerCase());

  const newBps = pctToBps(fee);
  const validationError = (() => {
    if (newBps === null) return 'Enter a fee.';
    if (newBps < 0) return 'The fee cannot be negative.';
    if (newBps > MAX_BPS) return 'The fee can be at most 100%.';
    return null;
  })();
  const unchanged = currentBps !== null && newBps === currentBps;
  const delta = currentBps !== null && newBps !== null ? newBps - currentBps : 0;

  const [shownPct, pctMoving] = useTweenedNumber(newBps !== null && !validationError ? newBps / 100 : 0);
  const fmtTween = (n, moving) =>
    n.toLocaleString('en-US', { minimumFractionDigits: moving ? 2 : 0, maximumFractionDigits: 2 });

  const handleUpdate = async () => {
    if (validationError) return toast.error(validationError);
    if (unchanged) return toast.info('The trading fee is already set to this value.');

    setUpdating(true);
    try {
      const feeManager = await web3Service.getFeeManagerContract();
      // createFeeConfig replaces the whole schedule, so every other field is
      // copied from the current version — the rent fee etc. stay as they are.
      const tx = await feeManager.createFeeConfig({ ...state.config, saleFeeBps: newBps });
      toast.info('Transaction submitted. Waiting for confirmation...');
      await tx.wait();
      toast.success(`Trading fee updated to ${pct(newBps)} (${newBps} bps).`);
      await load();
    } catch (error) {
      console.error('Error updating trading fee:', error);
      toast.error(getContractErrorMessage(error, 'Failed to update the trading fee. Please try again.'));
    } finally {
      setUpdating(false);
    }
  };

  const body = () => {
    if (checking || loading) {
      return <Spinner words={['permissions', 'fee manager', 'fee schedule', 'treasury']} />;
    }

    if (!address) {
      return <EmptyState title="Wallet not connected">Connect the admin wallet to change the trading fee.</EmptyState>;
    }

    if (!isAuthority) {
      return (
        <EmptyState title="Not authorized">
          This wallet does not hold the required marketplace authority role, so it cannot change the trading fee. Switch
          to an authorized wallet and try again.
        </EmptyState>
      );
    }

    if (!state) {
      return (
        <EmptyState title="Could not load the fee settings" action={<Button onClick={load}>Try again</Button>}>
          The FeeManager could not be read. Check your connection and try again.
        </EmptyState>
      );
    }

    const sliderValue = Math.min(SLIDER_MAX, Math.max(0, Number(fee) || 0));
    const example = Number(exampleAmount) > 0 ? Number(exampleAmount) : 0;

    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* ── Setting ───────────────────────────────────────────────────── */}
        <div className="space-y-6 lg:col-span-3">
          <Card className="p-6">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">
                  Current trading fee
                </p>
                <p className="mt-1 text-4xl font-bold tracking-tight text-slate-900 tabular-nums dark:text-white">
                  {pct(currentBps)}
                </p>
                <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">
                  {currentBps} bps · fee version {state.version || '—'}
                </p>
              </div>

              {!validationError && !unchanged && (
                <div className="flex items-center gap-3">
                  <svg
                    className="h-5 w-5 text-slate-300 dark:text-slate-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                  <div className="text-right">
                    <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">
                      New
                    </p>
                    <p className="mt-1 text-4xl font-bold tracking-tight text-indigo-600 tabular-nums dark:text-indigo-400">
                      {fmtTween(shownPct, pctMoving)}%
                    </p>
                    <p
                      className={cn(
                        'mt-1 text-xs font-semibold',
                        delta > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400',
                      )}
                    >
                      {delta > 0 ? '▲' : '▼'} {Math.abs(delta)} bps
                    </p>
                  </div>
                </div>
              )}
            </div>

            {!isOwner && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">
                Only the FeeManager owner ({shortenAddress(state.owner)}) can change fees — the transaction would revert
                from this wallet. Switch to the owner wallet.
              </p>
            )}

            {state.orderbookMismatch && (
              <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                The Orderbook uses a different FeeManager than the Marketplace, so this change only affects Marketplace
                purchases.
              </p>
            )}

            <div className="my-6 h-px bg-slate-100 dark:bg-slate-800" />

            <label htmlFor="saleFee" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              New trading fee
            </label>
            <div className="mt-3 flex items-center gap-4">
              <input
                type="range"
                min="0"
                max={SLIDER_MAX}
                step="0.05"
                value={sliderValue}
                onChange={(e) => setFee(e.target.value)}
                disabled={updating}
                aria-label="Fee slider"
                className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-indigo-600 dark:bg-slate-700"
                style={{
                  backgroundImage: 'linear-gradient(to right, var(--color-indigo-500), var(--color-violet-500))',
                  backgroundSize: `${(sliderValue / SLIDER_MAX) * 100}% 100%`,
                  backgroundRepeat: 'no-repeat',
                }}
              />
              <div className="relative w-28 shrink-0">
                <input
                  id="saleFee"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  disabled={updating}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white pr-8 pl-3 text-right text-lg font-semibold text-slate-900 tabular-nums transition outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-slate-400">
                  %
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">Presets</span>
              {PRESETS.map((p) => {
                const bps = Math.round(p * 100);
                const active = newBps === bps;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFee(String(p))}
                    disabled={updating}
                    className={cn(
                      'cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition-all',
                      active
                        ? 'border-transparent bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-600/30'
                        : 'border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-400/50 dark:hover:text-indigo-300',
                    )}
                  >
                    {p === 0 ? 'No fee' : `${p}%`}
                    {currentBps === bps && !active && <span className="ml-1 text-[10px] opacity-70">current</span>}
                  </button>
                );
              })}
            </div>

            <p className="mt-3 min-h-5 text-xs">
              {validationError ? (
                <span className="font-medium text-red-500">{validationError}</span>
              ) : newBps > HIGH_FEE_BPS ? (
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  {pct(newBps)} is a high trading fee — buyers pay it on top of every purchase.
                </span>
              ) : (
                <span className="text-slate-500 dark:text-slate-400">
                  Stored on-chain as <span className="font-mono font-semibold">{newBps} bps</span> (1% = 100 bps).
                </span>
              )}
            </p>

            <div className="mt-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
              <svg
                className="mt-0.5 h-5 w-5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
              <span>
                Applies immediately to <strong>every</strong> purchase on all properties — Marketplace listings and
                Orderbook sell orders. Saving creates fee version {state.version + 1}; the other fee fields (including
                the rent fee) are kept as they are.
              </span>
            </div>

            <Button
              className="mt-6"
              size="lg"
              fullWidth
              onClick={handleUpdate}
              loading={updating}
              disabled={updating || Boolean(validationError) || unchanged || !isOwner}
            >
              {updating
                ? 'Updating…'
                : unchanged
                  ? `Already set to ${pct(currentBps)}`
                  : validationError
                    ? 'Enter a valid fee'
                    : `Set trading fee to ${pct(newBps)}`}
            </Button>
          </Card>

          <Card className="p-6">
            <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">Fee history</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Fees go to treasury{' '}
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-200" title={state.treasury}>
                {shortenAddress(state.treasury)}
              </span>
              .
            </p>
            {state.history.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No fee version has been created yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                {state.history.map((h, i) => (
                  <li key={h.version} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-slate-600 dark:text-slate-300">
                      Version {h.version}
                      {i === 0 && (
                        <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                          Live
                        </span>
                      )}
                    </span>
                    <span className="font-semibold text-slate-900 tabular-nums dark:text-white">
                      {pct(h.saleFeeBps)}
                      <span className="ml-1.5 font-mono text-xs font-normal text-slate-400">{h.saleFeeBps} bps</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* ── What it means ─────────────────────────────────────────────── */}
        <Card className="p-6 lg:col-span-2 lg:self-start">
          <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">What this controls</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            The fee charged on every purchase of property shares. The buyer pays it on top of the price; the seller
            receives the full price. It goes straight to the treasury.
          </p>

          <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-indigo-700 dark:bg-slate-800/60 dark:text-indigo-300">
            buyer pays = price + price × fee
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">
                Fee on a purchase
              </p>
              <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                Purchase
                <span className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    min="0"
                    value={exampleAmount}
                    onChange={(e) => setExampleAmount(e.target.value)}
                    className="h-8 w-24 rounded-md border border-slate-300 bg-white pr-2 pl-5 text-right text-xs font-semibold text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </span>
              </label>
            </div>

            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-3 bg-slate-50 px-4 py-2 text-[11px] font-semibold tracking-wide text-slate-400 uppercase dark:bg-slate-800/60 dark:text-slate-500">
                <span>Purchase</span>
                <span className="text-right">Current fee</span>
                <span className="text-right">New fee</span>
              </div>
              {[...new Set([example, ...EXAMPLE_AMOUNTS])]
                .filter((a) => a > 0)
                .map((amount, i) => (
                  <div
                    key={amount}
                    className={cn(
                      'grid grid-cols-3 border-t border-slate-100 px-4 py-2.5 text-sm tabular-nums dark:border-slate-800',
                      i === 0 && 'bg-indigo-50/60 dark:bg-indigo-500/5',
                    )}
                  >
                    <span className="font-medium text-slate-700 dark:text-slate-200">{usd(amount)}</span>
                    <span className="text-right text-slate-500 dark:text-slate-400">
                      {usd(saleFee(amount, currentBps))}
                    </span>
                    <span className="text-right font-semibold text-slate-900 dark:text-white">
                      {validationError ? '—' : usd(saleFee(amount, newBps))}
                    </span>
                  </div>
                ))}
            </div>
            {!validationError && example > 0 && (
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Buying {usd(example)} of shares, the buyer pays{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {usd(example + saleFee(example, newBps))}
                </span>{' '}
                — the seller gets {usd(example)} and the treasury {usd(saleFee(example, newBps))}.
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
        title="Trading Fee"
        description="The platform fee buyers pay on every purchase from a Marketplace listing or an Orderbook sell order. Requires the FeeManager owner wallet."
        icon={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185ZM9.75 9h.008v.008H9.75V9Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 4.5h.008v.008h-.008V13.5Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
          />
        }
      />

      {body()}
    </AppLayout>
  );
};

export default UpdateSaleFeePage;
