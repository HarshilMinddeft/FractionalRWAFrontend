import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import PropertyNFTArti from '../artifacts/contracts/RwaERC-3643/TrueFraction/propertyNFT.sol/PropertyNFT.json';
import VaultArti from '../artifacts/contracts/RwaERC-3643/TrueFraction/FractionalVault.sol/FractionalVault.json';
import SliderBar from './sliderBar'

const FractionalizeProperty = () => {
  const [properties, setProperties] = useState([]);
  const [userAddress, setUserAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [fractionalEvents, setFractionalEvents] = useState({});

  const vaultAddress = "0xF279cf626E1f929731194e6d3748810C2E223EB6";
  const PContractAddr = "0x00A0A54c2e1a41D41182Dcd255bfD06305361d21"; // On cello nft contract address

  // Get connected wallet
  const getWalletAddress = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        const lowercaseAddress = accounts[0].toLowerCase();
        setUserAddress(lowercaseAddress);
        return lowercaseAddress;
      } catch (err) {
        console.error('Error getting wallet:', err);
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  // Fetch properties for connected user
 const fetchProperties = async (address) => {
  try {
    const res = await fetch(
      `https://fractionalrwabackend-k5z9.onrender.com/api/Properties/getOwnerProperty?ownerAddress=${address}`
    );
    const data = await res.json();
    const allProps = data.properties || [];

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const PropertyNFT = new ethers.Contract(PContractAddr, PropertyNFTArti.abi, signer);
    const filteredProps = [];
    for (const prop of allProps) {
      try {
        const isFrac = await PropertyNFT.isFractionalized(prop.propertyId);
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

  const Fractionalize = async (tokenId ,ComplianceAddress)=>{

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      console.log("signerAddress",address)

      const PropertyNFT = new ethers.Contract(
          PContractAddr,
          PropertyNFTArti.abi,
          signer
        );

       const transaction = await PropertyNFT.approve(
            vaultAddress,
            tokenId
        );

        await transaction.wait();
        console.log("Approved tokenId:", tokenId , transaction.hash);

        const VaultFractionalize = new ethers.Contract(
          vaultAddress,
          VaultArti.abi,
          signer
        );

        const vaultTnx = await VaultFractionalize.fractionalizeProperty(
          tokenId,
          ComplianceAddress
        )
        await vaultTnx.wait();
        console.log( "Fractionalization done",vaultTnx.hash);

        const propertyToken = await VaultFractionalize.fractionalData(
          tokenId
        )
        const fractionalData = {
            shareToken: propertyToken.tokenAddress,
            totalShares: propertyToken.totalShares.toString(),
            originalOwner: propertyToken.originalOwner,
            complianceAddress :propertyToken.complianceAddress,
          };

          console.log("fractionalData",fractionalData)
          setFractionalEvents(prev => ({...prev,
            [tokenId]: fractionalData
          }));

       } catch (error) {
       console.error("Errorrororor", error);
     }
    }

  useEffect(() => {
    const init = async () => {
      const address = await getWalletAddress();
      if (address) {
        fetchProperties(address);
      }
    };
    init();
  }, []);

  return (
    <div className='sm:pl-64'>
      {/* <NAV  signer={userAddress}/> */}
        <SliderBar/>
      <h2 className="text-xl font-bold mb-4 mt-4">Your Tokenized Properties</h2>
      {loading ? (
        <p>Loading properties...</p>
      ) : properties.length > 0 ? (
      <div className='mx-auto w-full max-w-[1360px]'>
        <div className='grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-[30px] mt-5 ml-2 mr-2 mb-5'>
          {properties.map((prop) => (
            <div key={prop.propertyId} className="bg-[#ffffff] text-black rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 hover:scale-[1.02] cursor-pointer overflow-hidden">
              {prop.propertyThumbImages && prop.propertyThumbImages.length > 0 && (
                <img src={prop.propertyThumbImages[0]} alt="Thumbnail" className="w-full h-72 lg:h-72 object-cover rounded" />
              )}
              <h3 className="text-xl mt-1 font-semibold">{prop.propertyName}</h3>
              <p className='mt-2'><strong>Property id : </strong> {prop.propertyId}</p>
              <p><strong>Price:</strong> {prop.propertyPrice}</p>
              <p><strong>Size:</strong> {prop.propertySize} sqft</p>
              <div className="mt-3 mb-2">
                {!fractionalEvents[prop.propertyId] ? (
                <button className='rounded-lg border border-transparent px-5 py-2 text-base font-medium bg-[#0c162c] text-white cursor-pointer transition-colors duration-200 hover:border-[#646cff]'
                 onClick={() => Fractionalize(prop.propertyId, prop.complianceAddress)}>
                    Fractionalize Property
                </button>
                   ) : (
                  <p className="text-green-300 font-semibold">Fractionalized</p>
                   )}
                  </div>
              <p className='mb-1'>You will get <strong>{Math.floor(Number(prop.propertyPrice) / 40)}</strong> Fractional Tokens</p>
                  <p className='mb-4 text-sm'>{PContractAddr}</p>
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

export default FractionalizeProperty;
