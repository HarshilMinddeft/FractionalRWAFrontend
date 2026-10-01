import Card from '../../../components/ui/Card';
import CopyButton from '../../../components/ui/CopyButton';
import envConfig from '../../../config/env.config';
import { cn, formatNumber, formatUsd, shortenAddress, toPercent } from '../../../lib/utils';

const Icon = ({ d, className = 'h-4 w-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const ICON = {
  bed: 'M2.25 18V9.75m0 4.5h19.5m0 3.75v-6a2.25 2.25 0 0 0-2.25-2.25H9.75v6M2.25 9.75h4.5a1.5 1.5 0 0 1 1.5 1.5v3',
  bath: 'M4.5 12V6a2.25 2.25 0 0 1 4.28-.97M3 12h18v2.25a4.5 4.5 0 0 1-4.5 4.5h-9A4.5 4.5 0 0 1 3 14.25V12Zm4.5 6.75-.75 1.5m10.5-1.5.75 1.5',
  area: 'M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15',
  spark: 'M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z',
  pin: 'M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z',
  token: 'M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5',
  external: 'M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25',
};

/** Pick an icon for a feature like "3 Beds" / "2 Baths" / "972 Sqft". */
const featureIcon = (text) => {
  const t = text.toLowerCase();
  if (/bed|br\b|room/.test(t)) return ICON.bed;
  if (/bath/.test(t)) return ICON.bath;
  if (/sq|ft|m2|area/.test(t)) return ICON.area;
  return ICON.spark;
};

/**
 * "3 Beds 2 Baths 972 Sqft" → ["3 Beds", "2 Baths", "972 Sqft"]. Falls back
 * to comma/pipe separated parts, or the whole string.
 */
const splitFeatures = (raw = '') => {
  const pairs = raw.match(/\d[\d,.]*\s*[A-Za-z+]+/g);
  if (pairs && pairs.length > 1) return pairs.map((p) => p.trim());
  const parts = raw.split(/[,|•·\n]+/).map((p) => p.trim()).filter(Boolean);
  return parts.length ? parts : [raw];
};

const Headline = ({ label, value, hint, accent = false }) => (
  <div className="min-w-0 px-4 py-3 first:pl-0 sm:py-0">
    <p className="text-[10.5px] font-semibold tracking-wide whitespace-nowrap text-slate-400 uppercase dark:text-slate-500">
      {label}
    </p>
    <p
      className={cn(
        'mt-1 truncate text-xl font-bold tracking-tight tabular-nums sm:text-2xl',
        accent ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white',
      )}
    >
      {value}
    </p>
    {hint && <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
  </div>
);

const Row = ({ icon, label, children, action }) => (
  <div className="flex items-center gap-3 py-3.5">
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
      <Icon d={icon} />
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-[10.5px] font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">{label}</p>
      <div className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-100">{children}</div>
    </div>
    {action}
  </div>
);

/** Property facts laid out as a fact sheet: headline figures, token availability, features, location, token. */
const PropertyOverview = ({ property, listing }) => {
  const assetValue = Number(property.propertyPrice) || 0;
  const size = Number(property.propertySize) || 0;
  const total = Number(listing.totalShares) || 0;
  const available = listing.remainingTokens !== undefined ? Number(listing.remainingTokens) : null;
  const owned = available !== null ? Math.max(0, total - available) : null;
  const availablePct = available !== null ? toPercent(available, total) : 0;
  const features = property.propertyFeatures ? splitFeatures(property.propertyFeatures) : [];
  const explorer = (envConfig.robinhoodExplorerUrl || '').replace(/\/$/, '');

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-[11px] font-bold tracking-[0.12em] uppercase">
          <span className="h-4 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500" />
          <span className="text-slate-400 dark:text-slate-500">Property overview</span>
        </h3>
        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          #{property.propertyId}
        </span>
      </div>

      {/* Headline figures */}
      <div className="grid grid-cols-2 divide-slate-200 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 sm:grid-cols-4 sm:divide-x dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950/50">
        <Headline label="Asset value" value={formatUsd(assetValue, 0)} hint="Underlying property" />
        <Headline
          label={listing.buyBack ? 'Buyback price' : 'Price per token'}
          value={
            listing.buyBack
              ? formatUsd(listing.buyBackPrice)
              : listing.pricePerToken
                ? formatUsd(listing.pricePerToken)
                : '—'
          }
          hint={listing.buyBack ? `Listed at ${formatUsd(listing.pricePerToken)}` : 'On the marketplace'}
          accent
        />
        <Headline label="Size" value={size ? `${formatNumber(size)} sqft` : '—'} hint="Floor area" />
        <Headline
          label="Price / sqft"
          value={size ? formatUsd(assetValue / size, 0) : '—'}
          hint="Asset value ÷ size"
        />
      </div>

      {/* Token availability */}
      {total > 0 && (
        <div className="mt-5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {formatNumber(total)} <span className="font-normal text-slate-500 dark:text-slate-400">tokens in total</span>
            </p>
            {available !== null && (
              <p className="text-xs text-slate-500 dark:text-slate-400">{availablePct.toFixed(1)}% still available</p>
            )}
          </div>
          {available !== null && (
            <>
              <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-[width] duration-700"
                  style={{ width: `${availablePct}%` }}
                />
                <div className="h-full flex-1 bg-emerald-400/80 dark:bg-emerald-500/70" />
              </div>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  <span className="font-semibold">{formatNumber(available)}</span> available on marketplace
                </span>
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold">{formatNumber(owned)}</span> already owned
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Features */}
      {features.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {features.map((f) => (
            <span
              key={f}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <span className="text-indigo-500 dark:text-indigo-400">
                <Icon d={featureIcon(f)} className="h-3.5 w-3.5" />
              </span>
              {f}
            </span>
          ))}
        </div>
      )}

      {/* Location + token */}
      <div className="mt-5 divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800">
        <Row
          icon={ICON.pin}
          label="Location"
          action={
            property.locationDetailes && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.locationDetailes)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex shrink-0 items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Open in Maps <Icon d={ICON.external} className="h-3.5 w-3.5" />
              </a>
            )
          }
        >
          {property.locationDetailes || '—'}
        </Row>

        {listing.shareToken && (
          <Row
            icon={ICON.token}
            label="Share token (ERC-3643)"
            action={
              <div className="flex shrink-0 items-center gap-1">
                <CopyButton value={listing.shareToken} label="Copy address" copiedLabel="Copied" />
                {explorer && (
                  <a
                    href={`${explorer}/address/${listing.shareToken}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
                  >
                    Explorer <Icon d={ICON.external} className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            }
          >
            <span className="font-mono text-xs" title={listing.shareToken}>
              <span className="hidden sm:inline">{listing.shareToken}</span>
              <span className="sm:hidden">{shortenAddress(listing.shareToken)}</span>
            </span>
          </Row>
        )}
      </div>
    </Card>
  );
};

export default PropertyOverview;
