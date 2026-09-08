import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { ethers } from 'ethers';
import {
  createWeb3Modal,
  defaultConfig,
  useDisconnect,
  useWeb3Modal,
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from '@web3modal/ethers5/react';
import envConfig from '../config/env.config';
import { setModalProvider } from '../services/web3Service';

const projectId = envConfig.walletConnectProjectId;

const robinhoodTestnet = {
  chainId: envConfig.robinhoodChainIdDec,
  name: 'Robinhood Testnet',
  currency: 'RH',
  explorerUrl: envConfig.robinhoodExplorerUrl,
  rpcUrl: envConfig.robinhoodRpcUrl,
};

const metadata = {
  name: 'TrueFraction RWA',
  description: 'Fractional Real World Asset Tokenization Platform',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://truefraction.io',
  icons: ['/logoD.webp'],
};

createWeb3Modal({
  ethersConfig: defaultConfig({
    metadata,
    defaultChainId: envConfig.robinhoodChainIdDec,
    enableEIP6963: true,
    enableInjected: true,
    enableCoinbase: true,
  }),
  chains: [robinhoodTestnet],
  projectId,
  themeMode: 'light',
});

const Web3Context = createContext({
  address: '',
  isConnected: false,
  chainId: null,
  provider: null,
  signer: null,
  connectWallet: () => {},
  disconnectWallet: () => {},
});

export const Web3Provider = ({ children }) => {
  const { open } = useWeb3Modal();
  const { disconnect } = useDisconnect();
  const { address, isConnected, chainId } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();

  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  useEffect(() => {
    // Only ever wire up the provider Web3Modal actually connected — never a
    // raw window.ethereum. With more than one wallet extension installed,
    // that global can belong to a different extension than the one the user
    // picked in the modal, silently misrouting reads/writes to it.
    //
    // Re-runs on `address` too: switching accounts in the wallet fires
    // Web3Modal's own `accountsChanged` listener, which updates `address`
    // without swapping the `walletProvider` object reference. Without
    // `address` in the deps here, `getSigner()` would stay pinned to
    // whichever account was selected when the wallet first connected —
    // the UI would show the new address while every write transaction
    // kept signing as the old one.
    if (isConnected && walletProvider) {
      const web3Provider = new ethers.providers.Web3Provider(walletProvider);
      const web3Signer = web3Provider.getSigner();
      setProvider(web3Provider);
      setSigner(web3Signer);
      setModalProvider(walletProvider);
    } else {
      setProvider(null);
      setSigner(null);
      setModalProvider(null);
    }
  }, [isConnected, walletProvider, address]);

  const value = useMemo(
    () => ({
      address: address?.toLowerCase() || '',
      isConnected,
      chainId,
      provider,
      signer,
      connectWallet: () => open(),
      disconnectWallet: () => disconnect(),
    }),
    [address, isConnected, chainId, provider, signer, open, disconnect],
  );

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

export const useWeb3 = () => useContext(Web3Context);

export default Web3Context;
