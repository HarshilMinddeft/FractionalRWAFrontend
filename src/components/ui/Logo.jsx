// Same mark as the landing page's nav bar (src/features/landing/TrueFraction.jsx)
// — a 2x2 grid of colored squares — reproduced here with the landing page's
// own color values (landing.css's --p1/--p2/--p3/--cyan) since that CSS is
// scoped under .tf-landing and isn't available outside the landing route.
const LogoMark = ({ size = 26 }) => (
  <span
    className="grid shrink-0"
    style={{ width: size, height: size, gridTemplateColumns: '1fr 1fr', gap: Math.round(size * 0.11) }}
  >
    <i className="rounded-[3px]" style={{ background: '#a855f7' }} />
    <i className="rounded-[3px]" style={{ background: '#e9d5ff' }} />
    <i className="rounded-[3px]" style={{ background: '#0bb4ff' }} />
    <i className="rounded-[3px] border-[1.5px]" style={{ background: 'transparent', borderColor: '#c084fc' }} />
  </span>
);

/**
 * Shared brand mark for the app shell (Sidebar, PublicTopBar) — matches the
 * landing page's nav bar logo for consistency across the site.
 */
const Logo = () => (
  <div className="flex items-center gap-2.5">
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 p-1 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
      <LogoMark size={22} />
    </span>
    <span className="text-[17px] font-bold tracking-tight text-slate-900 dark:text-white">
      True<span className="text-gradient">Fraction</span>
    </span>
  </div>
);

export default Logo;
