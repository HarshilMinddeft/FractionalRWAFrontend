import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AppLayout from '../../../components/layout/AppLayout';
import PageHeader from '../../../components/ui/PageHeader';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import StatCard from '../../../components/ui/StatCard';
import Badge from '../../../components/ui/Badge';
import Spinner from '../../../components/ui/Spinner';
import EmptyState from '../../../components/ui/EmptyState';
import web3Service from '../../../services/web3Service';
import propertyApi from '../api/propertyApi';
import useAuthorityRole from '../hooks/useAuthorityRole';
import useTweenedNumber from '../../../hooks/useTweenedNumber';
import { useWeb3 } from '../../../context/Web3Context';
import { getAppPropertyDetailsPath } from '../../../config/routes';
import { getContractErrorMessage } from '../../../utils/web3Errors';
import { cn } from '../../../lib/utils';
import { formatShares, formatStable, parseStable, PRICE_STEP } from '../../../utils/units';

// Any positive price with up to 2 decimals; − / + move in PRICE_STEP as a
// convenience. The contract only requires a non-zero price.
const JUMPS = [10, 50, 100];
const PRICE_RE = /^\d*\.?\d{0,2}$/;

const usdPrice = (n) =>
  `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(Number(n)) ? 0 : 2, maximumFractionDigits: 2 })}`;

const usd = (n, digits = 0) =>
  `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

const Icon = ({ d }) => (
  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const StepButton = ({ onClick, disabled, label, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-lg font-semibold text-slate-600 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-400/50 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
  >
    {children}
  </button>
);

/**
 * Current vs. new vs. the market's average price, as bars scaled to the
 * largest of the three — so it works at any price, with no fixed range.
 */
const PriceCompare = ({ current, next, average, valid }) => {
  const max = Math.max(current, valid ? next : 0, average, 1);
  const rows = [
    { label: 'Current', value: current, bar: 'bg-slate-300 dark:bg-slate-600', text: 'text-slate-600 dark:text-slate-300' },
    {
      label: 'New',
      value: valid ? next : null,
      bar: 'bg-gradient-to-r from-indigo-500 to-violet-500 shadow-[0_0_12px_-2px_rgba(99,102,241,0.6)]',
      text: 'font-semibold text-indigo-600 dark:text-indigo-400',
    },
    {
      label: 'Market avg',
      value: average,
      bar: 'bg-[repeating-linear-gradient(90deg,var(--color-slate-300)_0_6px,transparent_6px_10px)] dark:bg-[repeating-linear-gradient(90deg,var(--color-slate-600)_0_6px,transparent_6px_10px)]',
      text: 'text-slate-500 dark:text-slate-400',
    },
  ];
  const vsMarket = valid && average > 0 ? ((next - average) / average) * 100 : null;

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">
          Price comparison
        </span>
        {vsMarket !== null && Math.abs(vsMarket) >= 0.5 && (
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {Math.abs(vsMarket).toFixed(0)}% {vsMarket > 0 ? 'above' : 'below'} market
          </span>
        )}
        {vsMarket !== null && Math.abs(vsMarket) < 0.5 && (
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">At market average</span>
        )}
      </div>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.label} className="grid grid-cols-[72px_1fr_64px] items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400">{r.label}</span>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              {r.value !== null && (
                <div
                  className={cn('h-full rounded-full transition-[width] duration-500 ease-out', r.bar)}
                  style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }}
                />
              )}
            </div>
            <span className={cn('text-right tabular-nums', r.text)}>{r.value !== null ? usdPrice(r.value) : '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/** One listing: what it is, how it's selling, and a stepper to reprice it. */
const ListingRow = ({ property, listing, onUpdate, averagePrice }) => {
  const navigate = useNavigate();
  const current = Number(listing.pricePerToken);
  // Kept as the typed text so a half-typed value ("4") isn't rewritten.
  const [input, setInput] = useState(String(current));
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => setInput(String(current)), [current]);

  const typed = Number(input);
  const valid = input !== '' && Number.isFinite(typed) && typed > 0;
  const price = valid ? typed : current;
  const [shownPrice, moving] = useTweenedNumber(price, 260);

  const total = Number(listing.totalTokens);
  const remaining = Number(listing.remainingTokens);
  const sold = total - remaining;
  const soldPct = total > 0 ? (sold / total) * 100 : 0;
  const delta = price - current;
  const deltaPct = current > 0 ? (delta / current) * 100 : 0;
  const unchanged = !valid || delta === 0;
  const image = property.propertyThumbImages?.[0] || property.propertyImages?.[0];

  // Round to cents so repeated steps from e.g. $37.50 don't drift.
  const setPrice = (value) => setInput(String(Math.round(Math.max(0.01, value) * 100) / 100));
  const step = (amount) => setPrice(price + amount);

  const submit = async () => {
    setBusy(true);
    try {
      await onUpdate(price);
    } finally {
      setBusy(false);
    }
  };

  // Every tile has the same three lines (label / value / unit) so the values
  // line up across the grid.
  const Tile = ({ label, value, unit }) => (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900">
      <p className="truncate text-[10px] leading-4 font-semibold tracking-wide whitespace-nowrap text-slate-400 uppercase dark:text-slate-500">
        {label}
      </p>
      <p className="mt-1 truncate text-[15px] leading-5 font-semibold text-slate-900 tabular-nums dark:text-white">{value}</p>
      <p className="truncate text-[11px] leading-4 text-slate-500 dark:text-slate-400">{unit}</p>
    </div>
  );

  const chip =
    'cursor-pointer rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700';

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* ── The listing ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 p-5 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate(getAppPropertyDetailsPath(listing.tokenId))}
            className="group relative h-40 w-full shrink-0 cursor-pointer overflow-hidden rounded-xl bg-slate-100 sm:h-auto sm:w-40 dark:bg-slate-800"
            title="Open property"
          >
            {image && (
              <img
                src={image}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )}
            <span className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
            <span className="absolute top-2 left-2 rounded-md bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white">
              #{listing.tokenId}
            </span>
            <span className="absolute bottom-2 left-2 text-[11px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
              View property →
            </span>
          </button>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-3">
              <h3 className="truncate text-[15px] font-semibold text-slate-900 dark:text-white" title={property.propertyName}>
                {property.propertyName}
              </h3>
              {listing.buyBack ? (
                <Badge tone="warning" dot>
                  Buyback open
                </Badge>
              ) : (
                <Badge tone="success" dot>
                  Live
                </Badge>
              )}
            </div>

            <div className="mt-3">
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{sold.toLocaleString('en-US')}</span> of{' '}
                  {total.toLocaleString('en-US')} shares sold
                </span>
                <span className="font-semibold text-slate-600 tabular-nums dark:text-slate-300">{soldPct.toFixed(1)}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-[width] duration-700"
                  style={{ width: `${Math.max(soldPct, sold > 0 ? 1.5 : 0)}%` }}
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Tile label="Asset value" value={usd(property.propertyPrice)} unit="Property valuation" />
              <Tile label="Size" value={Number(property.propertySize).toLocaleString('en-US')} unit="sqft" />
              <Tile label="Listed" value={total.toLocaleString('en-US')} unit="shares on the marketplace" />
              <Tile label="Unsold" value={usd(remaining * current)} unit={`${remaining.toLocaleString('en-US')} shares at ${usdPrice(current)}`} />
            </div>
          </div>
        </div>

        {/* ── Repricing ───────────────────────────────────────────────── */}
        <div className="flex flex-col border-t border-slate-100 bg-slate-50 p-5 lg:border-t-0 lg:border-l dark:border-slate-800 dark:bg-slate-950/40">
          {listing.buyBack ? (
            <div className="flex h-full items-center gap-3 text-sm text-amber-700 dark:text-amber-300">
              <svg className="h-8 w-8 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                />
              </svg>
              <span>
                Price locked at <strong>{usdPrice(current)}</strong> — an open buyback was funded against it. It can be
                repriced once the buyback settles.
              </span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">
                    Price per share
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Current {usdPrice(current)} · type any amount or step ${PRICE_STEP}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <StepButton onClick={() => step(-PRICE_STEP)} disabled={busy || price <= PRICE_STEP} label="Lower price">
                    −
                  </StepButton>
                  <label
                    className={cn(
                      'flex h-10 w-28 items-center justify-center rounded-lg border bg-white px-2 transition-all dark:bg-slate-950',
                      !valid
                        ? 'border-red-400 ring-4 ring-red-500/10'
                        : editing
                          ? 'border-indigo-500 ring-4 ring-indigo-500/15'
                          : 'border-slate-200 dark:border-slate-700',
                    )}
                  >
                    <span
                      className={cn(
                        'text-xl font-bold',
                        unchanged ? 'text-slate-900 dark:text-white' : 'text-indigo-600 dark:text-indigo-400',
                      )}
                    >
                      $
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      aria-label="New price per share"
                      value={
                        editing || !valid
                          ? input
                          : (moving ? shownPrice : price).toLocaleString('en-US', {
                              useGrouping: false,
                              minimumFractionDigits: Number.isInteger(price) ? 0 : 2,
                              maximumFractionDigits: 2,
                            })
                      }
                      onFocus={() => setEditing(true)}
                      onBlur={() => setEditing(false)}
                      onChange={(e) => PRICE_RE.test(e.target.value) && setInput(e.target.value)}
                      disabled={busy}
                      className={cn(
                        'w-full min-w-0 bg-transparent text-center text-xl font-bold tabular-nums outline-none',
                        unchanged ? 'text-slate-900 dark:text-white' : 'text-indigo-600 dark:text-indigo-400',
                      )}
                    />
                  </label>
                  <StepButton onClick={() => step(PRICE_STEP)} disabled={busy} label="Raise price">
                    +
                  </StepButton>
                </div>
              </div>

              <PriceCompare current={current} next={price} average={averagePrice} valid={valid} />

              {/* Impact — always one line, so the card doesn't jump. */}
              <div className="mt-3 flex min-h-6 items-center gap-2 text-xs">
                {!valid ? (
                  <span className="font-medium text-red-500">Enter a price greater than $0.</span>
                ) : unchanged ? (
                  <span className="text-slate-500 dark:text-slate-400">
                    Unsold value <span className="font-semibold text-slate-700 dark:text-slate-200">{usd(remaining * current)}</span>
                  </span>
                ) : (
                  <>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold',
                        delta > 0
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
                      )}
                    >
                      {delta > 0 ? '▲' : '▼'} {usdPrice(Math.abs(delta))} ({deltaPct > 0 ? '+' : ''}
                      {deltaPct.toFixed(0)}%)
                    </span>
                    <span className="truncate text-slate-500 dark:text-slate-400">
                      Unsold {usd(remaining * current)} →{' '}
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{usd(remaining * price)}</span>
                    </span>
                  </>
                )}
              </div>

              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  {JUMPS.map((j) => (
                    <button
                      key={j}
                      type="button"
                      onClick={() => step(j)}
                      disabled={busy}
                      className={cn(chip, 'text-slate-600 hover:border-indigo-300 hover:text-indigo-600 dark:text-slate-300 dark:hover:border-indigo-400/50 dark:hover:text-indigo-300')}
                    >
                      +${j}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPrice(current)}
                    disabled={busy || unchanged}
                    className={cn(chip, 'text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200')}
                  >
                    Reset
                  </button>
                </div>
                <Button size="sm" onClick={submit} loading={busy} disabled={busy || unchanged}>
                  {busy ? 'Updating…' : unchanged ? 'No change' : `Set ${usdPrice(price)}`}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

const UpdatePricePage = () => {
  const { address } = useWeb3();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthority, checking } = useAuthorityRole(address);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await propertyApi.getAllMarketplaceProperties();
      const allProps = data.properties || [];
      const marketplace = web3Service.getReadOnlyMarketplaceContract();

      const active = [];
      for (const prop of allProps) {
        try {
          const listing = await marketplace.listings(prop.propertyId);
          if (!listing.active) continue;

          active.push({
            property: prop,
            listing: {
              tokenId: prop.propertyId,
              pricePerToken: formatStable(listing.pricePerToken),
              totalTokens: formatShares(listing.totalTokens),
              remainingTokens: formatShares(listing.remainingTokens),
              buyBack: listing.buyBack,
            },
          });
        } catch (err) {
          console.error(`Error reading listing ${prop.propertyId}:`, err);
        }
      }
      setRows(active);
    } catch (err) {
      console.error('Error loading listings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthority) load();
    else setLoading(false);
  }, [isAuthority, load]);

  const updatePrice = async (tokenId, price) => {
    if (!(Number(price) > 0)) {
      toast.error('Price per share must be greater than $0.');
      return;
    }

    try {
      const marketplace = await web3Service.getMarketplaceContract();
      const tx = await marketplace.updatePropertyPrice(tokenId, parseStable(price));
      toast.info('Transaction submitted — waiting for confirmation…');
      await tx.wait();

      toast.success(`Listing #${tokenId} repriced to $${price} per share.`);
      load();
    } catch (error) {
      console.error('Error updating property price:', error);
      toast.error(getContractErrorMessage(error, 'Failed to update the price. Please try again.'));
    }
  };

  const summary = useMemo(() => {
    const unsold = rows.reduce((a, r) => a + Number(r.listing.remainingTokens), 0);
    const value = rows.reduce((a, r) => a + Number(r.listing.remainingTokens) * Number(r.listing.pricePerToken), 0);
    const avg = rows.length ? rows.reduce((a, r) => a + Number(r.listing.pricePerToken), 0) / rows.length : 0;
    return { unsold, value, avg };
  }, [rows]);

  const body = () => {
    if (checking || loading) {
      return <Spinner words={['listings', 'prices', 'permissions', 'listings']} />;
    }

    if (!address) {
      return <EmptyState title="Wallet not connected">Connect the authority wallet to change listing prices.</EmptyState>;
    }

    if (!isAuthority) {
      return (
        <EmptyState title="Not authorized">
          This wallet does not hold the marketplace authority role, so it cannot change listing prices. Switch to an
          authorized wallet and try again.
        </EmptyState>
      );
    }

    if (rows.length === 0) {
      return <EmptyState title="No active listings">There are no active listings to reprice.</EmptyState>;
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Active listings"
            value={rows.length}
            sub={`${rows.filter((r) => r.listing.buyBack).length} locked by a buyback`}
            icon={<Icon d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5" />}
          />
          <StatCard
            label="Shares unsold"
            value={summary.unsold.toLocaleString('en-US')}
            sub="Across all live listings"
            tone="warning"
            icon={<Icon d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />}
          />
          <StatCard
            label="Unsold value"
            value={usd(summary.value)}
            sub="At current prices"
            tone="success"
            icon={<Icon d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />}
          />
          <StatCard
            label="Average price"
            value={usd(summary.avg)}
            sub="Per share, across live listings"
            icon={<Icon d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />}
          />
        </div>

        <div className="space-y-4">
          {rows.map(({ property, listing }) => (
            <ListingRow
              key={listing.tokenId}
              property={property}
              listing={listing}
              onUpdate={(price) => updatePrice(listing.tokenId, price)}
              averagePrice={summary.avg}
            />
          ))}
        </div>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          New prices apply only to shares still unsold on the marketplace — shares investors already bought keep their
          purchase price.
        </p>
      </div>
    );
  };

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Administration"
        title="Change Property Price"
        description="Reprice live marketplace listings share by share. Requires the marketplace authority role."
        icon={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
        }
      />
      {body()}
    </AppLayout>
  );
};

export default UpdatePricePage;
