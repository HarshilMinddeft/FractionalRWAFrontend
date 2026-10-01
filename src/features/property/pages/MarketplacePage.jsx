import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import PublicLayout from '../../../components/layout/PublicLayout';
import AppLayout from '../../../components/layout/AppLayout';
import MarketplaceCard from '../components/MarketplaceCard';
import InvestorDashboard from '../../rent/components/InvestorDashboard';
import { formatShares, formatStable } from '../../../utils/units';
import PageHeader from '../../../components/ui/PageHeader';
import StatCard from '../../../components/ui/StatCard';
import Skeleton from '../../../components/ui/Skeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { getPropertyDetailsPath, getAppPropertyDetailsPath } from '../../../config/routes';
import web3Service from '../../../services/web3Service';
import propertyApi from '../api/propertyApi';
import usePropertiesFilteredBy from '../hooks/usePropertiesFilteredBy';
import { cn, formatNumber } from '../../../lib/utils';

// cancelListing sets active = false in the same call that may open a
// buyback, so a listing with a live buyback (holders can still sell back)
// always has active == false too. Keep it visible here — it's still the
// only way holders reach PropertyDetailPage to call sellTokensBack — rather
// than filtering strictly on `active`, which would make it unreachable.
const isActivelyListed = async (property, marketplaceContract) => {
  const listing = await marketplaceContract.listings(property.propertyId);
  return listing.active || listing.buyBack;
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const GridSkeleton = () => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      >
        <Skeleton className="aspect-[16/10] rounded-none" />
        <div className="space-y-3 p-5">
          <Skeleton className="h-4 w-2/3" />
          <div className="grid grid-cols-3 gap-2 border-y border-slate-100 py-3 dark:border-slate-800">
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
          </div>
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
    ))}
  </div>
);

const MarketplacePage = ({ isPublic = false }) => {
  const Layout = isPublic ? PublicLayout : AppLayout;
  const detailPath = isPublic ? getPropertyDetailsPath : getAppPropertyDetailsPath;

  const navigate = useNavigate();
  // Tab lives in the URL (?tab=dashboard) so it survives reloads and can be linked to
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'dashboard' ? 'dashboard' : 'properties';
  const setTab = (next) => setSearchParams(next === 'dashboard' ? { tab: 'dashboard' } : {}, { replace: true });

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');

  const { properties, loading } = usePropertiesFilteredBy(
    propertyApi.getAllMarketplaceProperties,
    isActivelyListed,
    web3Service.getReadOnlyMarketplaceContract,
  );

  // On-chain listing per property: price, supply sold, and buyback state. A
  // property can show up here either as a normal buyable listing or as a
  // cancelled listing with a still-open buyback (isActivelyListed keeps
  // both) — the card uses this to show the latter as "sell back", not "buy".
  const [listings, setListings] = useState({});

  useEffect(() => {
    if (properties.length === 0) return;
    let cancelled = false;

    (async () => {
      const marketplace = web3Service.getReadOnlyMarketplaceContract();
      const next = {};
      await Promise.all(
        properties.map(async (prop) => {
          try {
            const listing = await marketplace.listings(prop.propertyId);
            next[prop.propertyId] = {
              pricePerToken: Number(formatStable(listing.pricePerToken)),
              buyBackPrice: Number(formatStable(listing.buyBackPrice)),
              total: Number(formatShares(listing.totalTokens)),
              remaining: Number(formatShares(listing.remainingTokens)),
              active: listing.active,
              buyBack: listing.buyBack,
            };
          } catch (err) {
            console.error(`Error reading listing for property ${prop.propertyId}:`, err);
          }
        }),
      );
      if (!cancelled) setListings(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [properties]);

  const filtered = useMemo(() => {
    if (!query.trim()) return properties;
    const q = query.trim().toLowerCase();
    return properties.filter(
      (p) =>
        String(p.propertyName || '')
          .toLowerCase()
          .includes(q) ||
        String(p.locationDetailes || '')
          .toLowerCase()
          .includes(q) ||
        String(p.propertyId).includes(q),
    );
  }, [properties, query]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sort === 'price-high') list.sort((a, b) => Number(b.propertyPrice) - Number(a.propertyPrice));
    if (sort === 'price-low') list.sort((a, b) => Number(a.propertyPrice) - Number(b.propertyPrice));
    if (sort === 'size-high') list.sort((a, b) => Number(b.propertySize) - Number(a.propertySize));
    return list;
  }, [filtered, sort]);

  const totals = useMemo(() => {
    const totalValue = properties.reduce((sum, p) => sum + (Number(p.propertyPrice) || 0), 0);
    const totalSize = properties.reduce((sum, p) => sum + (Number(p.propertySize) || 0), 0);
    return { totalValue, totalSize };
  }, [properties]);

  return (
    <Layout>
      <PageHeader
        eyebrow="Explore"
        title={tab === 'dashboard' ? 'My Portfolio' : 'Marketplace'}
        description={
          tab === 'dashboard'
            ? 'Track the property shares you hold, the rent they earn and every trade you make.'
            : 'Browse tokenized real-world assets that are actively listed. Every property is fractionalized, on-chain and verified before it reaches the floor.'
        }
        icon={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"
          />
        }
      />

      <div className="flex justify-center">
        <MarketTabs tab={tab} onChange={setTab} propertyCount={loading ? null : properties.length} />
      </div>

      {tab === 'dashboard' ? (
        <InvestorDashboard detailPath={detailPath} onBrowse={() => setTab('properties')} />
      ) : (
        <>
          {/* Market stats */}
          <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard
              label="Live listings"
              value={loading ? '…' : formatNumber(properties.length, 0)}
              tone="brand"
              icon={<BuildingIcon />}
            />
            <StatCard
              label="Assets on-chain"
              value={loading ? '…' : `$${formatNumber(totals.totalValue, 0)}`}
              sub="combined asset value"
              tone="success"
              icon={<DollarIcon />}
            />
            <StatCard
              label="Total floor area"
              value={loading ? '…' : `${formatNumber(totals.totalSize, 0)} sqft`}
              sub="across active listings"
              tone="neutral"
              icon={<AreaIcon />}
            />
            <StatCard
              label="Avg asset value"
              value={loading || !properties.length ? '—' : `$${formatNumber(totals.totalValue / properties.length, 0)}`}
              sub="per listing"
              tone="warning"
              icon={<TrendIcon />}
            />
          </div>

          {/* Toolbar */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, location or ID…"
                aria-label="Search properties"
                leadingIcon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                    />
                  </svg>
                }
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden text-xs font-medium text-slate-400 sm:block dark:text-slate-500">
                {loading ? 'Syncing…' : `${sorted.length} of ${properties.length} properties`}
              </span>
              <SortPills sort={sort} onChange={setSort} />
            </div>
          </div>

          {loading ? (
            <GridSkeleton />
          ) : sorted.length > 0 ? (
            <motion.div
              key={`${sort}-${filtered.length}`}
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
            >
              {sorted.map((prop) => (
                <motion.div key={prop.propertyId} variants={item} className="h-full">
                  <MarketplaceCard
                    property={prop}
                    listing={listings[prop.propertyId] ?? null}
                    onClick={() => navigate(detailPath(prop.propertyId))}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : query ? (
            <EmptyState
              title="No matching properties"
              icon={<SearchIcon />}
              action={
                <Button variant="secondary" size="sm" onClick={() => setQuery('')}>
                  Clear search
                </Button>
              }
            >
              Nothing matched “{query}”. Try a different name, location or property ID.
            </EmptyState>
          ) : (
            <EmptyState
              title="No properties are currently listed"
              action={
                <Button variant="soft" size="sm" onClick={() => navigate('/fractionalize-property')}>
                  Go to your assets
                </Button>
              }
            >
              When a property owner lists shares on the marketplace they will appear here. Check back soon.
            </EmptyState>
          )}
        </>
      )}
    </Layout>
  );
};

const TABS = [
  {
    value: 'properties',
    label: 'Explore',
    icon: 'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21',
  },
  {
    value: 'dashboard',
    label: 'My Portfolio',
    icon: 'M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z',
  },
];

const MarketTabs = ({ tab, onChange, propertyCount }) => (
  <div
    role="tablist"
    aria-label="Marketplace view"
    className="mb-6 inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900"
  >
    {TABS.map((t) => {
      const active = tab === t.value;
      return (
        <button
          key={t.value}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onChange(t.value)}
          className={cn(
            'relative flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
            active ? 'text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
          )}
        >
          {active && (
            <motion.span
              layoutId="market-tab"
              className="absolute inset-0 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 shadow-md shadow-indigo-600/25"
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            />
          )}
          <svg className="relative h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
          </svg>
          <span className="relative">{t.label}</span>
          {t.value === 'properties' && propertyCount !== null && (
            <span
              className={cn(
                'relative rounded-full px-1.5 py-px text-[11px] font-bold tabular-nums',
                active
                  ? 'bg-white text-indigo-700'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
              )}
            >
              {propertyCount}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

const SortPills = ({ sort, onChange }) => {
  const options = [
    { value: 'newest', label: 'Newest' },
    { value: 'price-high', label: 'Price ↑' },
    { value: 'price-low', label: 'Price ↓' },
  ];
  return (
    <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors',
            sort === opt.value
              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

const BuildingIcon = () => (
  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21"
    />
  </svg>
);

const DollarIcon = () => (
  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182.552-.44 1.278-.659 2.003-.659.725 0 1.45.22 2.003.659L14.5 8.5"
    />
  </svg>
);

const AreaIcon = () => (
  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
    />
  </svg>
);

const TrendIcon = () => (
  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941"
    />
  </svg>
);

const SearchIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
    />
  </svg>
);

export default MarketplacePage;
