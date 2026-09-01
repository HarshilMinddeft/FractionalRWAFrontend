import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { ethers } from 'ethers';
import {
  createWeb3Modal,
  defaultConfig,
  useWeb3Modal,
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from '@web3modal/ethers5/react';
import envConfig from '../config/env.config';
import { setModalProvider } from '../services/web3Service';

const projectId = envConfig.walletConnectProjectId;

const sonicTestnet = {
  chainId: envConfig.sonicChainIdDec,
  name: 'Sonic Testnet',
  currency: 'S',
  explorerUrl: envConfig.sonicExplorerUrl,
  rpcUrl: envConfig.sonicRpcUrl,
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
    defaultChainId: envConfig.sonicChainIdDec,
    enableEIP6963: true,
    enableInjected: true,
    enableCoinbase: true,
  }),
  chains: [sonicTestnet],
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
  const { address, isConnected, chainId } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();

  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  useEffect(() => {
    const initProvider = async () => {
      if (isConnected && walletProvider) {
        const web3Provider = new ethers.providers.Web3Provider(walletProvider);
        const web3Signer = web3Provider.getSigner();
        setProvider(web3Provider);
        setSigner(web3Signer);
        setModalProvider(walletProvider);
      } else if (window.ethereum) {
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(web3Provider);
        setSigner(null);
        setModalProvider(null);
      } else {
        setProvider(null);
        setSigner(null);
        setModalProvider(null);
      }
    };
    initProvider();
  }, [isConnected, walletProvider]);

  const value = useMemo(
    () => ({
      address: address?.toLowerCase() || '',
      isConnected,
      chainId,
      provider,
      signer,
      connectWallet: () => open(),
      disconnectWallet: () => open({ view: 'Account' }),
    }),
    [address, isConnected, chainId, provider, signer, open],
  );

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

export const useWeb3 = () => useContext(Web3Context);

export default Web3Context;
