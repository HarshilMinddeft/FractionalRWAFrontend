/**
 * Centralized Environment Configuration
 * Provides safe access to Vite environment variables with fallback defaults.
 */

export const envConfig = {
  // REST API
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://fractionalrwabackend-k5z9.onrender.com',

  // Network & RPC
  sonicRpcUrl: import.meta.env.VITE_SONIC_RPC_URL || 'https://rpc.testnet.soniclabs.com',
  sonicChainIdHex: import.meta.env.VITE_SONIC_CHAIN_ID_HEX || '0x3909',
  sonicChainIdDec: Number(import.meta.env.VITE_SONIC_CHAIN_ID_DEC) || 14601,
  sonicExplorerUrl: import.meta.env.VITE_SONIC_EXPLORER_URL || 'https://testnet.sonicscan.org/',

  // IPFS
  ipfsGateway: import.meta.env.VITE_IPFS_GATEWAY || 'https://brown-leading-scallop-142.mypinata.cloud/ipfs/',
  publicIpfsGateway: import.meta.env.VITE_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/',

  // Smart Contracts
  marketplaceAddress: import.meta.env.VITE_MARKETPLACE_CONTRACT_ADDRESS || '0x014CBb0a7DaBcE1455D16Bf7796DEB5AA58313a6',
  vaultAddress: import.meta.env.VITE_VAULT_CONTRACT_ADDRESS || '0x93a886A8e6363C420Ce9fFC0aF07e58E585B16ff',
  nftContractAddress: import.meta.env.VITE_NFT_CONTRACT_ADDRESS || '0x5B017F7a7274E4E463ab0446f7878660756a509E',
  stableCoinAddress: import.meta.env.VITE_STABLECOIN_CONTRACT_ADDRESS || '0xD83334724f8106a638C89F6Cf59159da3f7b479C',
  orderBookAddress: import.meta.env.VITE_ORDERBOOK_CONTRACT_ADDRESS || '0x4740DeD2a806b340E9db0108b2Cb84379E8E9544',
  identityRegistryAddress: import.meta.env.VITE_IDENTITY_REGISTRY_CONTRACT_ADDRESS || '0x300b5C8F882b071A4858074ACD2Dd6ab8EEEE34D',

  // Admin Account
  adminWalletAddress: (import.meta.env.VITE_ADMIN_WALLET_ADDRESS || '0xe917e81c69bf15238c63abd45d1c335c2fc80bdd').toLowerCase(),

  // WalletConnect
  walletConnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'f30db7f94e9f733eb88523c914bf485e',
};

export default envConfig;
