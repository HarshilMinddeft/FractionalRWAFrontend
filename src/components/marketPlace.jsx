import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import PropTokensArti from '../artifacts/contracts/PropertyShareToken.sol/PropertyShareToken.json'
import MarketplaceArti from '../artifacts/contracts/rwaMarketPlace.sol/FractionalMarketplace.json'
import StableCoin from '../artifacts/contracts/StableCoin.sol/STABLEC.json'
import NAV from './nav';

const MarketPlace = () => {

      const navigate = useNavigate();

      const [properties, setProperties] = useState([]);
      const [loading, setLoading] = useState(true);
      const [userAddress, setUserAddress] = useState("");

    const marketplaceAddr = "0x8Cb8Ec81E45F33274E79609c9dca999e72964b09"
    const stableCoinAddr = "0x9AFBf6031B7563db62cD11dcE98D340E9b865E0C"

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

    const fetchProperties = async (address) => {
      try {
        const res = await fetch(
          `http://localhost:3001/api/Properties/marketPlace/getAllPropertiesSummary`
        );
        const data = await res.json();
        const allProps = data.properties || [];

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const MarketPlace = new ethers.Contract(marketplaceAddr, MarketplaceArti.abi, signer);
        const filteredProps = [];
        for (const prop of allProps) {
          try {
            const Checklisting = await MarketPlace.listings(prop.propertyId)
            const checkListing = Checklisting.active
            if (checkListing) {
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
    <div className=''>
      <NAV signer={userAddress}/>
      {loading ? (
        <p className="text-gray-300 text-center text-lg">Loading properties...</p>
      ) : properties.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-5 ml-2">
          {properties.map((prop) => (
            <div
              key={prop.propertyId}
              className="bg-gray-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 hover:scale-[1.02] cursor-pointer overflow-hidden"
              onClick={() => navigate(`/property/${prop.propertyId}`)}
            >
              {prop.propertyThumbImages?.length > 0 && (
                <img
                  src={prop.propertyThumbImages[0]}
                  alt="Thumbnail"
                  className="w-full h-56 md:h-72 lg:h-80 object-cover"
                />
              )}
            <div className="p-4 space-y-2">
                      <h3 className="text-2xl font-bold">{prop.propertyName}</h3>
                      <div className="text-sm text-gray-300 space-y-1">
                        <p><strong className="text-white"> ID:</strong> {prop.propertyId}</p>
                        <p><strong className="text-white"> Price:</strong> {prop.propertyPrice} USD</p>
                        <p><strong className="text-white"> Size:</strong> {prop.propertySize} sqft</p>
                      </div>
                    </div>
                  </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-300">No properties found.</p>
      )}
    </div>
  );
}

export default MarketPlace;