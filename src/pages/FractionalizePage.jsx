import React, { useEffect, useState } from 'react';
import Sidebar from '../components/common/Sidebar';
import web3Service from '../services/web3Service';
import propertyApi from '../api/propertyApi';
import contractsConfig from '../config/contracts.config';

const FractionalizePage = () => {
  const [properties, setProperties] = useState([]);
  const [userAddress, setUserAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [fractionalEvents, setFractionalEvents] = useState({});

  const fetchProperties = async (address) => {
    try {
      const data = await propertyApi.getOwnerProperties(address);
      const allProps = data.properties || [];

      const propertyNftContract = web3Service.getReadOnlyPropertyNftContract();
      const filteredProps = [];
      for (const prop of allProps) {
        try {
          const isFrac = await propertyNftContract.isFractionalized(prop.propertyId);
          if (!isFrac) {
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

  const fractionalize = async (tokenId, complianceAddress) => {
    try {
      const propertyNftContract = await web3Service.getPropertyNftContract();
      const approveTx = await propertyNftContract.approve(
        contractsConfig.vault.address,
        tokenId
      );
      await approveTx.wait();

      const vaultContract = await web3Service.getVaultContract();
      try {
        const vaultTx = await vaultContract.fractionalizeProperty(
          tokenId,
          complianceAddress
        );
        await vaultTx.wait();

        const propertyToken = await vaultContract.fractionalData(tokenId);
        const fractionalData = {
          shareToken: propertyToken.tokenAddress,
          totalShares: propertyToken.totalShares.toString(),
          originalOwner: propertyToken.originalOwner,
          complianceAddress: propertyToken.complianceAddress,
        };

        setFractionalEvents((prev) => ({
          ...prev,
          [tokenId]: fractionalData,
        }));
      } catch (fractionalizeError) {
        if (
          fractionalizeError.reason?.includes('Identity is not verified') ||
          fractionalizeError.message?.includes('Identity is not verified') ||
          fractionalizeError.data?.message?.includes('Identity is not verified')
        ) {
          alert('❌ Identity Verification Required\n\nYour identity needs to be verified before you can fractionalize this property. Please complete the KYC verification process first.');
        } else {
          alert('❌ Fractionalization Failed\n\n' + (fractionalizeError.reason || fractionalizeError.message || 'An unknown error occurred'));
        }
        throw fractionalizeError;
      }
    } catch (error) {
      console.error('Error in Fractionalize:', error);
      if (
        !error.reason?.includes('Identity is not verified') &&
        !error.message?.includes('Identity is not verified')
      ) {
        alert('❌ Transaction Failed\n\n' + (error.message || 'An unexpected error occurred'));
      }
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
      <h2 className="text-xl font-bold mb-4 mt-4">Your Tokenized Properties</h2>
      {loading ? (
        <p>Loading properties...</p>
      ) : properties.length > 0 ? (
        <div className="mx-auto w-full max-w-[1360px]">
          <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-[30px] mt-5 ml-2 mr-2 mb-5">
            {properties.map((prop) => (
              <div key={prop.propertyId} className="bg-[#ffffff] text-black rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 hover:scale-[1.02] cursor-pointer overflow-hidden">
                {prop.propertyThumbImages && prop.propertyThumbImages.length > 0 && (
                  <img src={prop.propertyThumbImages[0]} alt="Thumbnail" className="w-full h-72 lg:h-72 object-cover rounded" />
                )}
                <h3 className="text-xl mt-1 font-semibold">{prop.propertyName}</h3>
                <p className="mt-2"><strong>Property id : </strong> {prop.propertyId}</p>
                <p><strong>Price:</strong> {prop.propertyPrice}</p>
                <p><strong>Size:</strong> {prop.propertySize} sqft</p>
                <div className="mt-3 mb-2">
                  {!fractionalEvents[prop.propertyId] ? (
                    <button
                      className="rounded-lg border border-transparent px-5 py-2 text-base font-medium bg-[#0c162c] text-white cursor-pointer transition-colors duration-200 hover:border-[#646cff]"
                      onClick={() => fractionalize(prop.propertyId, prop.complianceAddress)}
                    >
                      Fractionalize Property
                    </button>
                  ) : (
                    <p className="text-green-300 font-semibold">Fractionalized</p>
                  )}
                </div>
                <p className="mb-1">You will get <strong>{Math.floor(Number(prop.propertyPrice) / 40)}</strong> Fractional Tokens</p>
                <p className="mb-4 text-sm">{contractsConfig.propertyNft.address}</p>
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

export default FractionalizePage;
