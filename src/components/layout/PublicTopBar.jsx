import { useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from '../ui/ThemeToggle';
import Logo from '../ui/Logo';
import { useWeb3 } from '../../context/Web3Context';
import { ROUTES } from '../../config/routes';
import { ConnectedPill } from './TopBar';

const WalletIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3"
    />
  </svg>
);

/**
 * Minimal top bar for public pages (Marketplace, Property details) — no
 * sidebar, no hamburger menu. Visitors can browse without a wallet; a
 * connected wallet gets the same menu as the app shell (copy, explorer,
 * disconnect), but never switches these pages over to the sidebar app-shell.
 */
const PublicTopBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { address, isConnected, connectWallet, disconnectWallet } = useWeb3();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <span key={location.pathname} className="header-beam" aria-hidden="true" />
      <div className="mx-auto flex h-16 w-full max-w-[1180px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button type="button" onClick={() => navigate(ROUTES.marketplace)} className="cursor-pointer">
          <Logo />
        </button>

        <div className="ml-auto flex items-center gap-2.5">
          {isConnected && address ? (
            <ConnectedPill address={address} onDisconnect={disconnectWallet} />
          ) : (
            <button
              type="button"
              onClick={connectWallet}
              className="btn-sheen inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 text-[13px] font-semibold text-white shadow-sm shadow-indigo-600/30 transition-all duration-150 hover:shadow-md hover:shadow-indigo-600/40 hover:brightness-110 active:scale-[0.98]"
            >
              <WalletIcon />
              <span className="hidden sm:inline">Connect wallet</span>
            </button>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default PublicTopBar;
