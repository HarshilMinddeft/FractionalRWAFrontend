import { useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import ThemeToggle from '../ui/ThemeToggle';
import { useWeb3 } from '../../context/Web3Context';
import { getPageMeta } from '../../config/navigation';
import { shortenAddress } from '../../lib/utils';

const WalletIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3"
    />
  </svg>
);

const ChevronDown = () => (
  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path
      fillRule="evenodd"
      d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
      clipRule="evenodd"
    />
  </svg>
);

const ConnectPill = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 text-[13px] font-semibold text-white shadow-sm shadow-indigo-600/30 transition-all duration-150 hover:shadow-md hover:shadow-indigo-600/40 hover:brightness-110 active:scale-[0.98]"
  >
    <WalletIcon />
    <span className="hidden sm:inline">Connect wallet</span>
  </button>
);

const ConnectedPill = ({ address, onClick }) => (
  <motion.button
    type="button"
    initial={{ opacity: 0, y: -4 }}
    animate={{ opacity: 1, y: 0 }}
    onClick={onClick}
    className="group inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white py-0 pr-2 pl-1.5 shadow-sm transition-all duration-150 hover:border-slate-300 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
    title="Manage wallet"
  >
    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-bold text-white">
      {address.slice(2, 4).toUpperCase()}
    </span>
    <span className="hidden items-center gap-1.5 text-[13px] font-semibold text-slate-700 sm:flex dark:text-slate-200">
      {shortenAddress(address, 5, 4)}
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </span>
    </span>
    <span className="text-slate-300 transition-colors group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-400">
      <ChevronDown />
    </span>
  </motion.button>
);

const TopBar = ({ onMenuOpen }) => {
  const location = useLocation();
  const { address, isConnected, connectWallet, disconnectWallet } = useWeb3();
  const meta = getPageMeta(location.pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/70">
      <div className="mx-auto flex h-16 w-full max-w-[1180px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenuOpen}
          aria-label="Open navigation"
          className="-ml-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          <svg className="h-5.5 w-5.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 10.5a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <div className="hidden items-center gap-1.5 text-sm lg:flex">
          <span className="text-slate-400 dark:text-slate-500">TrueFraction</span>
          <svg className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-semibold text-slate-700 dark:text-slate-200">{meta.title}</span>
        </div>

        <div className="ml-auto flex items-center gap-2.5">
          {isConnected && address ? (
            <ConnectedPill address={address} onClick={disconnectWallet} />
          ) : (
            <ConnectPill onClick={connectWallet} />
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default TopBar;
