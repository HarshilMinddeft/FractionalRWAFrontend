import { ethers } from 'ethers';
import envConfig from '../config/env.config';
import contractsConfig from '../config/contracts.config';

let activeWalletProvider = null;

export const setModalProvider = (provider) => {
  activeWalletProvider = provider;
};

export const web3Service = {
  /**
   * Guaranteed Read-Only Sonic Testnet RPC Provider
   * Bypasses window.ethereum network mismatch issues for instant reads.
   */
  getReadOnlyProvider: () => {
    return new ethers.providers.JsonRpcProvider(envConfig.sonicRpcUrl);
  },

  /**
   * Get Ethers provider from active wallet modal provider or window.ethereum,
   * falling back to the Sonic testnet JSON-RPC endpoint.
   */
  getProvider: () => {
    if (activeWalletProvider) {
      return new ethers.providers.Web3Provider(activeWalletProvider);
    }
    if (window.ethereum) {
      return new ethers.providers.Web3Provider(window.ethereum);
    }
    return web3Service.getReadOnlyProvider();
  },

  /**
   * Request connected wallet address
   */
  getWalletAddress: async () => {
    try {
      const targetEthereum = activeWalletProvider || window.ethereum;
      if (targetEthereum) {
        const provider = new ethers.providers.Web3Provider(targetEthereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        return accounts[0]?.toLowerCase() || null;
      }
      return null;
    } catch (err) {
      console.error('Error connecting wallet:', err);
      return null;
    }
  },

  /**
   * Get current wallet signer (requires connected wallet)
   */
  getSigner: async () => {
    const targetEthereum = activeWalletProvider || window.ethereum;
    if (!targetEthereum) {
      throw new Error('No wallet connected');
    }
    const provider = new ethers.providers.Web3Provider(targetEthereum);
    return provider.getSigner();
  },

  /**
   * Switch/Add Sonic testnet network in MetaMask or WalletConnect provider
   */
  ensureSonicNetwork: async () => {
    const targetEthereum = activeWalletProvider || window.ethereum;
    if (!targetEthereum) return true;

    try {
      const provider = new ethers.providers.Web3Provider(targetEthereum);
      const network = await provider.getNetwork();

      if (network.chainId !== envConfig.sonicChainIdDec) {
        try {
          await targetEthereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: envConfig.sonicChainIdHex }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await targetEthereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: envConfig.sonicChainIdHex,
                  chainName: 'Sonic Testnet',
                  rpcUrls: [envConfig.sonicRpcUrl],
                  nativeCurrency: {
                    name: 'SONIC',
                    symbol: 'S',
                    decimals: 18,
                  },
                  blockExplorerUrls: [envConfig.sonicExplorerUrl],
                },
              ],
            });
          } else {
            throw switchError;
          }
        }
      }
      return true;
    } catch (error) {
      console.error('Failed to switch to Sonic network:', error);
      return false;
    }
  },

  /**
   * Read-Only Contract Helpers (Uses Sonic RPC directly, independent of MetaMask network)
   */
  getReadOnlyMarketplaceContract: () => {
    const provider = web3Service.getReadOnlyProvider();
    return new ethers.Contract(contractsConfig.marketplace.address, contractsConfig.marketplace.abi, provider);
  },

  getReadOnlyVaultContract: () => {
    const provider = web3Service.getReadOnlyProvider();
    return new ethers.Contract(contractsConfig.vault.address, contractsConfig.vault.abi, provider);
  },

  getReadOnlyPropertyNftContract: () => {
    const provider = web3Service.getReadOnlyProvider();
    return new ethers.Contract(contractsConfig.propertyNft.address, contractsConfig.propertyNft.abi, provider);
  },

  getReadOnlyStableCoinContract: () => {
    const provider = web3Service.getReadOnlyProvider();
    return new ethers.Contract(contractsConfig.stableCoin.address, contractsConfig.stableCoin.abi, provider);
  },

  getReadOnlyOrderBookContract: () => {
    const provider = web3Service.getReadOnlyProvider();
    return new ethers.Contract(contractsConfig.orderBook.address, contractsConfig.orderBook.abi, provider);
  },

  /**
   * Write Contract Helpers (Requires signer)
   */
  getMarketplaceContract: async () => {
    const signer = await web3Service.getSigner();
    return new ethers.Contract(contractsConfig.marketplace.address, contractsConfig.marketplace.abi, signer);
  },

  getVaultContract: async () => {
    const signer = await web3Service.getSigner();
    return new ethers.Contract(contractsConfig.vault.address, contractsConfig.vault.abi, signer);
  },

  getPropertyNftContract: async () => {
    const signer = await web3Service.getSigner();
    return new ethers.Contract(contractsConfig.propertyNft.address, contractsConfig.propertyNft.abi, signer);
  },

  getStableCoinContract: async () => {
    const signer = await web3Service.getSigner();
    return new ethers.Contract(contractsConfig.stableCoin.address, contractsConfig.stableCoin.abi, signer);
  },

  getOrderBookContract: async () => {
    const signer = await web3Service.getSigner();
    return new ethers.Contract(contractsConfig.orderBook.address, contractsConfig.orderBook.abi, signer);
  },
};

export default web3Service;
