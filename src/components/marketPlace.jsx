import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import PropTokensArti from '../artifacts/contracts/PropertyShareToken.sol/PropertyShareToken.json'
import MarketplaceArti from '../artifacts/contracts/rwaMarketPlace.sol/FractionalMarketplace.json'
import StableCoin from '../artifacts/contracts/StableCoin.sol/STABLEC.json'
// import NAV from './nav';
import Header from './landingPage/comps/Header/Index'

const MarketPlace = () => {

      const navigate = useNavigate();

      const [properties, setProperties] = useState([]);
      const [loading, setLoading] = useState(false);
      const [userAddress, setUserAddress] = useState("");

    const marketplaceAddr = "0x6b771145BB9C12E8FB20a7B2650Ca101D6Cc811a"
    const stableCoinAddr = "0x96db19f0205660B4a6D1eBe60f5A818dD1709f06"

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
      setLoading(true);
      try {
        const res = await fetch(
          `https://fractionalrwabackend.onrender.com/api/Properties/marketPlace/getAllPropertiesSummary`
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

    const init = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();

      // Check if connected to Alfajores Testnet
      if (network.chainId !== 44787) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaef3' }],
          });
        } catch (switchError) {
          // If the chain is not added to MetaMask, request to add it
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0xaef3',
                  chainName: 'Celo Alfajores Testnet',
                  rpcUrls: ['https://alfajores-forno.celo-testnet.org'],
                  nativeCurrency: {
                    name: 'CELO',
                    symbol: 'CELO',
                    decimals: 18,
                  },
                  blockExplorerUrls: ['https://alfajores.celoscan.io/'],
                }],
              });
            } catch (addError) {
              console.error('Failed to add Alfajores network:', addError);
            }
          } else {
            console.error('Failed to switch network:', switchError);
            alert('Please switch to the Celo Alfajores Testnet in MetaMask.');
            return;
          }
        }
      }

      const address = await getWalletAddress();
      if (address) {
        fetchProperties(address);
      }

    } catch (error) {
      console.error('Error during initialization:', error);
    }
  };


  useEffect(() => {
    init();
  }, []);

  return (
    <div className=''>
      {/* <NAV signer={userAddress}/> */}
      <Header/>
      {loading ? (
        <p className="text-gray-300 text-center text-lg">Loading properties...</p>
      ) : properties?.length > 0 ? (
        <div className='mx-auto w-full max-w-[1360px]'>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[30px] mb-5 mt-10 ml-2 mr-2">
          {properties?.map((prop) => (
            <div
              key={prop.propertyId}
              className="bg-[#ffffff] text-white rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 hover:scale-[1.02] cursor-pointer overflow-hidden"
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
                      <h3 className="text-2xl text-[#000000] font-bold">{prop.propertyName}</h3>
                      <div className="text-sm text-[#000000] space-y-1">
                        <p><strong className="text-[#000000]"> ID:</strong> {prop.propertyId}</p>
                        <p><strong className="text-[#000000]"> Price:</strong> {prop.propertyPrice} USD</p>
                        <p><strong className="text-[#000000]"> Size:</strong> {prop.propertySize} sqft</p>
                      </div>
                    </div>
                  </div>
          ))}
        </div>
        </div>
      ) : (
        <p className="text-gray-300">No properties found.</p>
      )}
    </div>
  );
}

export default MarketPlace;