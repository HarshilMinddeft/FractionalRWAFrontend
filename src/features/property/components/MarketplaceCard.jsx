import { formatNumber } from '../../../lib/utils';
import Card from '../../../components/ui/Card';

const Arrow = ({ className = 'h-4 w-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
  </svg>
);

const Figure = ({ label, value }) => (
  <div className="min-w-0">
    <p className="text-[10px] font-semibold tracking-wide whitespace-nowrap text-slate-400 uppercase dark:text-slate-500">
      {label}
    </p>
    <p className="mt-0.5 truncate text-[13px] font-semibold text-slate-800 tabular-nums dark:text-slate-100">{value}</p>
  </div>
);

const usd = (n) => `$${formatNumber(n, 0)}`;
const usd2 = (n) => `$${formatNumber(n, 2)}`;

/**
 * Marketplace listing card: photo with status and token price, key figures,
 * sales progress, and the minimum investment. `listing` is the on-chain
 * listing read on the marketplace page (may be null while loading).
 *
 * @param {{ pricePerToken: number, total: number, remaining: number, active: boolean, buyBack: boolean, buyBackPrice: number } | null} listing
 */
const MarketplaceCard = ({ property, listing, onClick }) => {
  const image = property.propertyThumbImages?.[0] || property.propertyImages?.[0];
  const buyBackOnly = Boolean(listing && !listing.active && listing.buyBack);
  const total = listing?.total ?? 0;
  const remaining = listing?.remaining ?? 0;
  const soldPct = total > 0 ? ((total - remaining) / total) * 100 : 0;

  return (
    <Card
      hover
      onClick={onClick}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
      className="group flex h-full cursor-pointer flex-col overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      {/* Photo */}
      <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800">
        {image && (
          <img
            src={image}
            alt={property.propertyName || 'Property'}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/25" />

        <div className="absolute top-3 right-3 left-3 flex items-center justify-between">
          {buyBackOnly ? (
            <span className="flex items-center gap-1.5 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-slate-950 shadow">
              Buyback open
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-slate-950 px-2.5 py-1 text-[11px] font-bold text-white shadow">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              Live
            </span>
          )}
          <span className="rounded-md bg-slate-950 px-2 py-1 font-mono text-[11px] font-semibold text-white shadow">
            #{property.propertyId}
          </span>
        </div>

        <div className="absolute right-3 bottom-3 left-3 flex items-end justify-between gap-3">
          <div className="text-white">
            <p className="text-[10px] font-semibold tracking-wider uppercase opacity-80">
              {buyBackOnly ? 'Buyback price' : 'Token price'}
            </p>
            <p className="text-2xl leading-tight font-bold tracking-tight drop-shadow">
              {listing ? usd2(buyBackOnly ? listing.buyBackPrice : listing.pricePerToken) : '—'}
              <span className="ml-1 text-sm font-medium opacity-80">/ token</span>
            </p>
          </div>
          <span className="flex translate-y-2 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            View details <Arrow className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <h3
          className="truncate text-[16px] font-bold tracking-tight text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-300"
          title={property.propertyName}
        >
          {property.propertyName}
        </h3>

        <div className="mt-3 grid grid-cols-3 gap-3">
          <Figure label="Asset value" value={usd(property.propertyPrice)} />
          <Figure label="Size" value={property.propertySize ? `${formatNumber(property.propertySize, 0)} sqft` : '—'} />
          <Figure label="Tokens" value={total ? formatNumber(total, 0) : '—'} />
        </div>

        {/* Sales progress */}
        <div className="mt-4">
          <div className="flex items-baseline justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-200">{soldPct.toFixed(0)}% sold</span>
            <span className="text-slate-500 dark:text-slate-400">
              {listing ? `${formatNumber(remaining, 0)} of ${formatNumber(total, 0)} left` : '—'}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-[width] duration-700"
              style={{ width: `${Math.max(soldPct, soldPct > 0 ? 2 : 0)}%` }}
            />
          </div>
        </div>

        {buyBackOnly && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            Delisted — holders can sell back at {usd2(listing.buyBackPrice)} per token.
          </p>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
          <div>
            <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">
              {buyBackOnly ? 'Sell back from' : 'Min. investment'}
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {listing ? usd2(buyBackOnly ? listing.buyBackPrice : listing.pricePerToken) : '—'}
            </p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-all duration-300 group-hover:border-transparent group-hover:bg-gradient-to-br group-hover:from-indigo-600 group-hover:to-violet-600 group-hover:text-white group-hover:shadow-md group-hover:shadow-indigo-600/30 dark:border-slate-700 dark:text-slate-400">
            <Arrow className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Card>
  );
};

export default MarketplaceCard;
