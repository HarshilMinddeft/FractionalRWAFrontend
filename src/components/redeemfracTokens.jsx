import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import PropertyNFTArti from '../artifacts/contracts/propertyNFT.sol/PropertyNFT.json';
import VaultArti from '../artifacts/contracts/FractionalVault.sol/FractionalVault.json';
import PropTokensArti from '../artifacts/contracts/PropertyShareToken.sol/PropertyShareToken.json'
import MarketplaceArti from '../artifacts/contracts/rwaMarketPlace.sol/FractionalMarketplace.json'
import NAV from './nav';
import SliderBar from './sliderBar'

const RedeemfracTokens = () => {

  const [properties, setProperties] = useState([]);
  const [userAddress, setUserAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [fractionalEvents, setFractionalEvents] = useState({});

  const vaultAddress = "0x54B0ECd3C8a66C42cE93c112639aeDBfD8eDa124";
  const PContractAddr = "0xd474267e496eE634f53FF4C55d37556849546B45"; // On cello nft contract address
  const marketplaceAddr = "0x6b771145BB9C12E8FB20a7B2650Ca101D6Cc811a"

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
      `https://fractionalrwabackend.onrender.com/api/Properties/getOwnerProperty?ownerAddress=${address}`
    );
    const data = await res.json();
    const allProps = data.properties || [];

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const PropertyNFT = new ethers.Contract(PContractAddr, PropertyNFTArti.abi, signer);
    const MarketPlace = new ethers.Contract(marketplaceAddr, MarketplaceArti.abi, signer);
    const filteredProps = [];
    for (const prop of allProps) {
      try {
         const Checklisting = await MarketPlace.listings(prop.propertyId)
        const checkListing = Checklisting.active
        const isFrac = await PropertyNFT.isFractionalized(prop.propertyId);
        if (isFrac && !checkListing) {
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

  const redeemTokens = async (tokenId)=>{

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      console.log("signerAddress",address)

      const VaultFractionalize = new ethers.Contract(
          vaultAddress,
          VaultArti.abi,
          signer
        );

        const propertyToken = await VaultFractionalize.fractionalData(
          tokenId
        )

        let propertyShareTokenAddr = propertyToken.tokenAddress;
        let totalTokens = propertyToken.totalShares;
        
      const propertyTokensTxn = new ethers.Contract(
          propertyShareTokenAddr,
          PropTokensArti.abi,
          signer
        );

       const transaction = await propertyTokensTxn.approve(
            vaultAddress,
            totalTokens
        );

        await transaction.wait();
        console.log("Approved tokens:", tokenId , transaction.hash);
        
        const vaultTnx = await VaultFractionalize.redeemShares(
          tokenId
        )

        await vaultTnx.wait();
        console.log( "Fractionalization done",vaultTnx.hash);

        const AfterData = await VaultFractionalize.fractionalData(
          tokenId
        )

        const fractionalData = {
            shareToken: AfterData.tokenAddress,
            totalShares: AfterData.totalShares.toString(),
            originalOwner: AfterData.originalOwner,
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
      <h2 className="text-xl font-bold mt-5 mb-4">Redeem Your Property Tokens</h2>
      {loading ? (
        <p>Loading properties...</p>
      ) : properties.length > 0 ? (
      <div className='mx-auto w-full max-w-[1360px]'>
        <div className='grid grid-cols-1  sm:grid-cols-2 lg:grid-cols-3 gap-[30px] mt-5 ml-2 mr-2 mb-5'>
          {properties.map((prop) => (
            <div key={prop.propertyId} className="bg-[#ffffff] text-black rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 hover:scale-[1.02] cursor-pointer overflow-hidden">
              {prop.propertyThumbImages && prop.propertyThumbImages.length > 0 && (
                <img src={prop.propertyThumbImages[0]} alt="Thumbnail" className="w-full h-64 lg:h-72 object-cover rounded" />
              )}
               <h3 className="text-2xl mt-1 font-semibold">{prop.propertyName}</h3>
              <p className='mt-2'><strong >Property id : </strong> {prop.propertyId}</p>
              <p><strong>Price:</strong> {prop.propertyPrice}</p>
              <p><strong>Size:</strong> {prop.propertySize} sqft</p>
              <div className="mt-3">
                {!fractionalEvents[prop.propertyId] ? (
                  <>
                <button 
                className='rounded-lg border border-transparent px-5 py-2 text-base font-medium bg-[#0c162c] text-white cursor-pointer transition-colors duration-200 hover:border-[#646cff]'
                onClick={() => redeemTokens(prop.propertyId)}>
                    Redeem Property
                </button>
                <p className='mt-2 mb-5'>You should have <strong>{Math.floor(Number(prop.propertyPrice) / 40)}</strong> Fractional Tokens</p>
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
}

export default RedeemfracTokens