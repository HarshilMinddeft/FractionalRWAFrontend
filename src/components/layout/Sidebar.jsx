import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import envConfig from '../../config/env.config';
import { ROUTES } from '../../config/routes';
import { useWeb3 } from '../../context/Web3Context';
import useAuthorityRole from '../../hooks/useAuthorityRole';

const NAV_ITEMS = [
  { path: ROUTES.fractionalizeProperty, label: 'Fractionalize', icon: 'M6.143 0H1.857A1.857 1.857 0 0 0 0 1.857v4.286C0 7.169.831 8 1.857 8h4.286A1.857 1.857 0 0 0 8 6.143V1.857A1.857 1.857 0 0 0 6.143 0Zm10 0h-4.286A1.857 1.857 0 0 0 10 1.857v4.286C10 7.169 10.831 8 11.857 8h4.286A1.857 1.857 0 0 0 18 6.143V1.857A1.857 1.857 0 0 0 16.143 0Zm-10 10H1.857A1.857 1.857 0 0 0 0 11.857v4.286C0 17.169.831 18 1.857 18h4.286A1.857 1.857 0 0 0 8 16.143v-4.286A1.857 1.857 0 0 0 6.143 10Zm10 0h-4.286A1.857 1.857 0 0 0 10 11.857v4.286c0 1.026.831 1.857 1.857 1.857h4.286A1.857 1.857 0 0 0 18 16.143v-4.286A1.857 1.857 0 0 0 16.143 10Z' },
  { path: ROUTES.listProperty, label: 'List to Marketplace', icon: 'M14 2a3.963 3.963 0 0 0-1.4.267 6.439 6.439 0 0 1-1.331 6.638A4 4 0 1 0 14 2Zm1 9h-1.264A6.957 6.957 0 0 1 15 15v2a2.97 2.97 0 0 1-.184 1H19a1 1 0 0 0 1-1v-1a5.006 5.006 0 0 0-5-5ZM6.5 9a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM8 10H5a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-2a5.006 5.006 0 0 0-5-5Z' },
  { path: ROUTES.redeemProperty, label: 'Redeem Property', icon: 'm17.418 3.623-.018-.008a6.713 6.713 0 0 0-2.4-.569V2h1a1 1 0 1 0 0-2h-2a1 1 0 0 0-1 1v2H9.89A6.977 6.977 0 0 1 12 8v5h-2V8A5 5 0 1 0 0 8v6a1 1 0 0 0 1 1h8v4a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-4h6a1 1 0 0 0 1-1V8a5 5 0 0 0-2.582-4.377ZM6 12H4a1 1 0 0 1 0-2h2a1 1 0 0 1 0 2Z' },
  { path: ROUTES.buyBack, label: 'Buyback Program', icon: 'M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm.5 5a1 1 0 0 1 1 1v1.1a3 3 0 0 1 2 2.822 1 1 0 1 1-2 .078 1 1 0 0 0-1-1h-1a1 1 0 1 0 0 2h1a3 3 0 0 1 .5 5.958V18a1 1 0 1 1-2 0v-1.1a3 3 0 0 1-2-2.822 1 1 0 1 1 2-.078 1 1 0 0 0 1 1h1a1 1 0 1 0 0-2h-1a3 3 0 0 1-.5-5.958V6a1 1 0 0 1 1-1Z' },
  { path: ROUTES.cancelListing, label: 'Cancel Listing', icon: 'M17 5.923A1 1 0 0 0 16 5h-3V4a4 4 0 1 0-8 0v1H2a1 1 0 0 0-1 .923L.086 17.846A2 2 0 0 0 2.08 20h13.84a2 2 0 0 0 1.994-2.153L17 5.923ZM7 9a1 1 0 0 1-2 0V7h2v2Zm0-5a2 2 0 1 1 4 0v1H7V4Zm6 5a1 1 0 1 1-2 0V7h2v2Z' },
  { path: ROUTES.marketplace, label: 'Marketplace', icon: 'M16.975 11H10V4.025a1 1 0 0 0-1.066-.998 8.5 8.5 0 1 0 9.039 9.039.999.999 0 0 0-1-1.066h.002ZM12.5 0c-.157 0-.311.01-.565.027A1 1 0 0 0 11 1.02V10h8.975a1 1 0 0 0 1-.935c.013-.188.028-.374.028-.565A8.51 8.51 0 0 0 12.5 0Z' },
];

// Marketplace is deliberately last here — this whole array is appended after
// ADMIN_NAV_ITEMS (Tokenize, then Change Price), so the on-screen order ends
// up: Tokenize -> Change Price -> Fractionalize -> List to Marketplace ->
// Redeem -> Buyback -> Cancel Listing -> Marketplace.

const ADMIN_NAV_ITEMS = [
  { path: ROUTES.tokenizeProperty, label: 'Tokenize Property', icon: 'M10 2a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2h-6v6a1 1 0 1 1-2 0v-6H3a1 1 0 1 1 0-2h6V3a1 1 0 0 1 1-1Z' },
  { path: ROUTES.updatePrice, label: 'Change Property Price', icon: 'M11.074 4 8.442.408A.95.95 0 0 0 7.014.254L2.926 4h8.148ZM9 13v-1a4 4 0 0 1 4-4h6V6a1 1 0 0 0-1-1H1a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h17a1 1 0 0 0 1-1v-2h-6a4 4 0 0 1-4-4Zm7.5-4a3.5 3.5 0 1 0 0 7H20a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1h-3.5Zm0 4.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2ZM12.62 4h2.78L12.539.41a1.086 1.086 0 0 0-.7-.397 1.1 1.1 0 0 0-.783.226L12.62 4Z' },
];

const NavLink = ({ item, isActive, onClick }) => (
  <li>
    <button
      onClick={onClick}
      className={`group flex items-center gap-3 w-full rounded-xl px-2.5 py-2.5 text-base font-medium transition-all cursor-pointer ${
        isActive
          ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-950/40 dark:shadow-indigo-300/40'
          : 'text-slate-300 hover:bg-white/5 hover:text-white dark:text-slate-600 dark:hover:bg-slate-300/60 dark:hover:text-slate-900'
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
          isActive ? 'bg-white/15' : 'bg-white/5 group-hover:bg-indigo-500/15 dark:bg-slate-950/5 dark:group-hover:bg-indigo-500/10'
        }`}
      >
        <svg
          className={`h-5 w-5 shrink-0 transition-colors ${
            isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400 dark:text-slate-500 dark:group-hover:text-indigo-500'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d={item.icon} />
        </svg>
      </span>
      <span className="text-left">{item.label}</span>
      {isActive && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-white" />}
    </button>
  </li>
);

const formatAddress = (address) => `${address.slice(0, 6)}...${address.slice(-4)}`;

const WalletButton = ({ address, isConnected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-left transition-colors hover:bg-white/10 dark:border-slate-300 dark:bg-slate-300/40 dark:hover:bg-slate-300/60 cursor-pointer"
  >
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      {isConnected && address && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
      )}
      <span
        className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
          isConnected && address ? 'bg-emerald-400' : 'bg-slate-500 dark:bg-slate-400'
        }`}
      />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-base font-semibold text-white dark:text-slate-900">
        {isConnected && address ? 'Wallet Connected' : 'Connect Wallet'}
      </span>
      <span className="block truncate text-sm text-slate-300 dark:text-slate-500">
        {isConnected && address ? formatAddress(address) : 'Robinhood Testnet'}
      </span>
    </span>
    <svg className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 0 1 0-1.06L8.94 10 5.22 6.28a.75.75 0 0 1 1.06-1.06l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0Z" clipRule="evenodd" />
    </svg>
  </button>
);

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { address, isConnected, connectWallet, disconnectWallet } = useWeb3();
  const [isOpen, setIsOpen] = useState(false);

  // Admin nav appears for the configured admin wallet or any wallet holding
  // the marketplace's on-chain authority role — the same rule the pages enforce.
  const { isAuthority } = useAuthorityRole(address);
  const isAdmin = address?.toLowerCase() === envConfig.adminWalletAddress || isAuthority;
  const items = isAdmin
    ? [...ADMIN_NAV_ITEMS, ...NAV_ITEMS]
    : NAV_ITEMS;
  const handleWalletClick = () => {
    setIsOpen(false);
    if (isConnected) {
      disconnectWallet();
    } else {
      connectWallet();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className="fixed top-3 left-3 z-50 inline-flex items-center p-2 rounded-lg bg-slate-900 text-slate-300 hover:bg-slate-800 dark:bg-transparent dark:text-slate-600 dark:hover:bg-slate-300/60 sm:hidden"
      >
        <span className="sr-only">Toggle sidebar</span>
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path clipRule="evenodd" fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" />
        </svg>
      </button>

      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-72 bg-slate-950 border-r border-white/10 dark:bg-slate-200 dark:border-slate-300 transition-transform sm:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col px-3 py-5">
          <a href="/" className="flex items-center gap-3 px-2 mb-8">
            <img src="/logoD.webp" className="h-7" alt="Logo" />
            <span className="text-lg font-semibold text-white dark:text-slate-900">
              True<span className="text-indigo-400 dark:text-indigo-500">Fraction</span>
            </span>
          </a>

          <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Navigation</p>
          <ul className="space-y-2 flex-1">
            {items.map((item) => (
              <NavLink
                key={item.path}
                item={item}
                isActive={location.pathname === item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsOpen(false);
                }}
              />
            ))}
          </ul>

          <div className="pt-4 border-t border-white/10 dark:border-slate-300">
            <WalletButton
              address={address}
              isConnected={isConnected}
              onClick={handleWalletClick}
            />
          </div>
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
