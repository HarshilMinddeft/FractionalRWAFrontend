import envConfig from './env.config';

import MarketplaceArtifact from '../artifacts/contracts/RwaERC-3643/TrueFraction/DemoMarketplace.sol/FractionalMarketplace.json';
import PropertyNFTArtifact from '../artifacts/contracts/RwaERC-3643/TrueFraction/propertyNFT.sol/PropertyNFT.json';
import TokenArtifact from '../artifacts/contracts/RwaERC-3643/token/Token.sol/Token.json';
import OrderbookArtifact from '../artifacts/contracts/RwaERC-3643/TrueFraction/orderBook.sol/Orderbook.json';

export const contractsConfig = {
  marketplace: {
    address: envConfig.marketplaceAddress,
    abi: MarketplaceArtifact.abi,
  },
  vault: {
    address: envConfig.vaultAddress,
    abi: TokenArtifact.abi,
  },
  propertyNft: {
    address: envConfig.nftContractAddress,
    abi: PropertyNFTArtifact.abi,
  },
  stableCoin: {
    address: envConfig.stableCoinAddress,
    abi: TokenArtifact.abi,
  },
  orderBook: {
    address: envConfig.orderBookAddress,
    abi: OrderbookArtifact.abi,
  },
  identityRegistry: {
    address: envConfig.identityRegistryAddress,
  },
};

export default contractsConfig;
