/**
 * Centralized Environment Configuration
 * Provides safe access to Vite environment variables with fallback defaults.
 */

export const envConfig = {
  // REST API
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://fractionalrwabackend-k5z9.onrender.com',

  // Network & RPC
  robinhoodRpcUrl: import.meta.env.VITE_ROBINHOOD_RPC_URL || 'https://robinhood-testnet.drpc.org',
  robinhoodChainIdHex: import.meta.env.VITE_ROBINHOOD_CHAIN_ID_HEX || '0xb626',
  robinhoodChainIdDec: Number(import.meta.env.VITE_ROBINHOOD_CHAIN_ID_DEC) || 46630,
  robinhoodExplorerUrl: import.meta.env.VITE_ROBINHOOD_EXPLORER_URL || '',

  // IPFS
  ipfsGateway: import.meta.env.VITE_IPFS_GATEWAY || 'https://brown-leading-scallop-142.mypinata.cloud/ipfs/',
  publicIpfsGateway: import.meta.env.VITE_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/',

  // Smart Contracts
  marketplaceAddress: import.meta.env.VITE_MARKETPLACE_CONTRACT_ADDRESS ,
  vaultAddress: import.meta.env.VITE_VAULT_CONTRACT_ADDRESS ,
  nftContractAddress: import.meta.env.VITE_NFT_CONTRACT_ADDRESS ,
  stableCoinAddress: import.meta.env.VITE_STABLECOIN_CONTRACT_ADDRESS ,
  orderBookAddress: import.meta.env.VITE_ORDERBOOK_CONTRACT_ADDRESS ,
  identityRegistryAddress: import.meta.env.VITE_IDENTITY_REGISTRY_CONTRACT_ADDRESS,

  // Admin Account
  adminWalletAddress: (import.meta.env.VITE_ADMIN_WALLET_ADDRESS).toLowerCase(),

  // WalletConnect
  walletConnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'f30db7f94e9f733eb88523c914bf485e',
};

export default envConfig;
