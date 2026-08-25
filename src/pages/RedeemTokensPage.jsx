import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import Sidebar from '../components/common/Sidebar';
import web3Service from '../services/web3Service';
import propertyApi from '../api/propertyApi';
import contractsConfig from '../config/contracts.config';
import ComplianceArti from '../artifacts/contracts/RwaERC-3643/compliance/modular/ModularCompliance.sol/ModularCompliance.json';

const RedeemTokensPage = () => {
  const [properties, setProperties] = useState([]);
  const [userAddress, setUserAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [fractionalEvents, setFractionalEvents] = useState({});

  const fetchProperties = async (address) => {
    try {
      const data = await propertyApi.getOwnerProperties(address);
      const allProps = data.properties || [];

      const propertyNftContract = web3Service.getReadOnlyPropertyNftContract();
      const marketplaceContract = web3Service.getReadOnlyMarketplaceContract();
      const filteredProps = [];
      for (const prop of allProps) {
        try {
          const checkListing = await marketplaceContract.listings(prop.propertyId);
          const isFrac = await propertyNftContract.isFractionalized(prop.propertyId);
          if (isFrac && !checkListing.active) {
            filteredProps.push(prop);
          }
        } catch (err) {
          console.error(`Error checking fractionalization for token ${prop.propertyId}:`, err);
        }
      }
      setProperties(filteredProps);
    } catch (err) {
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const redeemTokens = async (tokenId, complianceAddress) => {
    try {
      const signer = await web3Service.getSigner();
      const vaultContract = await web3Service.getVaultContract();

      const propertyToken = await vaultContract.fractionalData(tokenId);
      const propertyShareTokenAddr = propertyToken.tokenAddress;
      const totalTokens = propertyToken.totalShares;

      const propertyTokensTxn = new ethers.Contract(
        propertyShareTokenAddr,
        contractsConfig.vault.abi,
        signer
      );

      const approveTx = await propertyTokensTxn.approve(
        contractsConfig.vault.address,
        totalTokens
      );
      await approveTx.wait();

      const vaultTx = await vaultContract.redeemShares(tokenId);
      await vaultTx.wait();

      const unbindTokenContract = new ethers.Contract(
        complianceAddress,
        ComplianceArti.abi,
        signer
      );

      const unbindTx = await unbindTokenContract.unbindToken(propertyShareTokenAddr);
      await unbindTx.wait();

      const afterData = await vaultContract.fractionalData(tokenId);
      const fractionalData = {
        shareToken: afterData.tokenAddress,
        totalShares: afterData.totalShares.toString(),
        originalOwner: afterData.originalOwner,
        compAddress: afterData.complianceAddress,
      };

      setFractionalEvents((prev) => ({
        ...prev,
        [tokenId]: fractionalData,
      }));
    } catch (error) {
      console.error('Error redeeming property tokens:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      const address = await web3Service.getWalletAddress();
      if (address) {
        setUserAddress(address);
        fetchProperties(address);
      } else {
        setLoading(false);
      }
    };
    init();
  }, []);

  return (
    <div className="sm:pl-64">
      <Sidebar />
      <h2 className="text-xl font-bold mt-5 mb-4">Redeem Your Property Tokens</h2>
      {loading ? (
        <p>Loading properties...</p>
      ) : properties.length > 0 ? (
        <div className="mx-auto w-full max-w-[1360px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[30px] mt-5 ml-2 mr-2 mb-5">
            {properties.map((prop) => (
              <div key={prop.propertyId} className="bg-[#ffffff] text-black rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 hover:scale-[1.02] cursor-pointer overflow-hidden">
                {prop.propertyThumbImages && prop.propertyThumbImages.length > 0 && (
                  <img src={prop.propertyThumbImages[0]} alt="Thumbnail" className="w-full h-64 lg:h-72 object-cover rounded" />
                )}
                <h3 className="text-2xl mt-1 font-semibold">{prop.propertyName}</h3>
                <p className="mt-2"><strong>Property id : </strong> {prop.propertyId}</p>
                <p><strong>Price:</strong> {prop.propertyPrice}</p>
                <p><strong>Size:</strong> {prop.propertySize} sqft</p>
                <div className="mt-3">
                  {!fractionalEvents[prop.propertyId] ? (
                    <>
                      <button
                        className="rounded-lg border border-transparent px-5 py-2 text-base font-medium bg-[#0c162c] text-white cursor-pointer transition-colors duration-200 hover:border-[#646cff]"
                        onClick={() => redeemTokens(prop.propertyId, prop.complianceAddress)}
                      >
                        Redeem Property
                      </button>
                      <p className="mt-2 mb-5">You should have <strong>{Math.floor(Number(prop.propertyPrice) / 40)}</strong> Fractional Tokens</p>
                    </>
                  ) : (
                    <p className="text-green-300 font-semibold">All Tokens Redeemed</p>
                  )}
                </div>
                {fractionalEvents[prop.propertyId] && (
                  <div className="mt-2 text-sm text-white">
                    <p><strong>Share Token:</strong> {fractionalEvents[prop.propertyId].shareToken}</p>
                    <p><strong>Total Shares:</strong> {fractionalEvents[prop.propertyId].totalShares}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p>No properties found for this wallet.</p>
      )}
    </div>
  );
};

export default RedeemTokensPage;
