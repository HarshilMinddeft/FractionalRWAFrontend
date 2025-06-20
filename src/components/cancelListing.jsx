import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import VaultArti from '../artifacts/contracts/RwaERC-3643/TrueFraction/FractionalVault.sol/FractionalVault.json';
import PropTokensArti from '../artifacts/contracts/RwaERC-3643/token/Token.sol/Token.json';
import MarketplaceArti from '../artifacts/contracts/RwaERC-3643/TrueFraction/DemoMarketplace.sol/FractionalMarketplace.json'
import NAV from './nav';
import { ToastContainer, toast } from 'react-toastify';
import SliderBar from './sliderBar'

const CancelListing = () => {

  const [properties, setProperties] = useState([]);
  const [Status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [fractionalEvents, setFractionalEvents] = useState({});
  const [userTokenBalaces,setUserTokenBalances]= useState([])
  const [currentSigner, setCurrentSigner] = useState();
  const [propertyShares, setPropertyShares] = useState({});
  const [listingOwners, setListingOwners] = useState({});

  const vaultAddress = "0x72A6c7E3Ce1BB637687Ad6c612986e3EAF81a653";
  const marketplaceAddr = "0xaAB86f0C7dE87089c3D9722e0F79f15D2C2008a1"

  // Get connected wallet
  const getWalletAddress = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        const lowercaseAddress = accounts[0].toLowerCase();
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
            const checkListing = Checklisting.buyBack
            const shares = Number(ethers.utils.formatUnits(Checklisting.totalTokens, 18)).toString();
            const owner = Checklisting.owner;

            if (checkListing) {
              filteredProps.push(prop);
               setPropertyShares(prev => ({ ...prev, [prop.propertyId]: shares }));
               setListingOwners(prev => ({ ...prev, [prop.propertyId]: owner }));
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

const fetchUserTokenBalance = async () => {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const userAddress = await signer.getAddress();

    const VaultFractionalize = new ethers.Contract(
      vaultAddress, 
      VaultArti.abi,
      signer
    );

    const balances = [];
    console.log("properties",properties)
    for (const prop of properties) {
      try {
        const fractionalData = await VaultFractionalize.fractionalData(prop.propertyId);
        const tokenAddress = fractionalData.tokenAddress;

        if (tokenAddress && tokenAddress !== ethers.constants.AddressZero) {
          const tokenContract = new ethers.Contract(tokenAddress, PropTokensArti.abi, provider);

          const [balance, symbol, decimals] = await Promise.all([
            tokenContract.balanceOf(userAddress),
            tokenContract.symbol(),
            tokenContract.decimals()
          ]);

          balances.push({
            propertyId: prop.propertyId,
            tokenAddress,
            symbol,
            balance: ethers.utils.formatUnits(balance, decimals)
          });
        }
      
      } catch (err) {
        console.error(`Failed for property ID ${prop.propertyId}:`, err);
      }
    }
      setUserTokenBalances(balances)
      console.log("User token balances:", balances);

  } catch (err) {
    console.error("Error fetching token balances:", err);
  }
};


  const cancelListing = async (tokenId)=>{

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      console.log("signerAddress",tokenId)

        const ListTokens = new ethers.Contract(
          marketplaceAddr,
          MarketplaceArti.abi,
          signer
        );

        const Checklisting = await ListTokens.listings(
          tokenId
        )

        const checkListing = Checklisting.active

          console.log("Already Listed",checkListing)
            const addTokensToExisting = await ListTokens.cancelListing(
              tokenId,
         )

        await addTokensToExisting.wait();
        
        const listing = await ListTokens.listings(
          tokenId
        )

        const listingData = {
            propertyTokenAddress: listing.propertyToken,
            remainingTokens :listing.remainingTokens.toString(),
          };

          console.log("fractionalData",listingData)
          setFractionalEvents(prev => ({...prev,
            [tokenId]: listingData
          }));

       } catch (error) {
          let errorMessage = 'Please try again later.';

          // ethers.js error format handling
          if (error && typeof error === 'object') {
            // User rejected the transaction
            if (error.message?.toLowerCase().includes('user rejected')) {
              errorMessage = 'Transaction Rejected.';
              toast.error(errorMessage);
            }
            else if (error.reason) {
              errorMessage = error.reason;
              toast.error("Insufficient tokens in marketplace")
              toast.error("Total tokens and remaining tokens should be equal")
            }
            else if (error.error?.data?.message) {
              errorMessage = error.error.data.message;
            }
            else if (error.data?.message) {
              errorMessage = error.data.message;
            }
            else if (error.error?.message) {
              errorMessage = error.error.message;
            }
          }

          console.error('Transaction error:', error);
    }
    }

    useEffect(() => {
    if (properties.length > 0) {
      console.log("HI")
      fetchUserTokenBalance();
    }
  }, [properties]);

  useEffect(() => {
    const init = async () => {
      const address = await getWalletAddress();
      if (address) {
        setCurrentSigner(address)
        fetchProperties(address);
      }
    };
    init();
  }, []);


return (
  <div className='sm:pl-64'>
    {/* <NAV signer={currentSigner}/> */}
       <SliderBar/>
    <h2 className="text-xl font-bold mt-5 mb-4">Cancel Listing</h2>
    <h3 className='mt-5'>{Status}</h3>

      <div>
        <ToastContainer position="top-center" autoClose={2000} />
      </div>

    {loading ? (
      <p>Loading properties...</p>
    ) : properties.length > 0 ? (
      <div className="mx-auto w-full max-w-[1360px]">
         <div className='grid grid-cols-1  sm:grid-cols-2 lg:grid-cols-3 gap-[30px] mt-5 ml-2 mr-2 mb-5'>
        {properties.map((prop) => {
          const tokenInfo = userTokenBalaces.find(
            (tkn) => tkn.propertyId === prop.propertyId
          );
          return (
            <div key={prop.propertyId} >
              <div className="bg-[#ffffff] text-black rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 hover:scale-[1.02] cursor-pointer overflow-hidden">
              {prop.propertyThumbImages?.length > 0  && (
                <img
                  src={prop.propertyThumbImages[0]}
                  alt="Thumbnail"
                  className="w-full h-56 md:h-64 lg:h-64 object-cover rounded"
                />
              )}

              {tokenInfo && listingOwners[prop.propertyId]?.toLowerCase() === currentSigner?.toLowerCase() ?( 
                <div className="text-black ">
                  <h3 className="text-2xl mt-1 font-semibold">{prop.propertyName}</h3>
                  <p className='mt-3'><strong>Property id:</strong> {prop.propertyId}</p>
                  <p className=''><strong>Valuation :</strong> {prop.propertyPrice} USD</p>
                  <p><strong>Your Token Balance:</strong> {tokenInfo.balance}</p>
                  <p><strong> You should have</strong> {Math.floor(Number(prop.propertyPrice) / 40)}</p>
                  <p><strong>Total listed tokens:</strong> {propertyShares[prop.propertyId] || 'N/A'}</p>

                  <p className='text-sm mt-4'>{tokenInfo.tokenAddress}</p>
                </div>
              ):(<p className='mt-2'>Delisted</p>)}

             {tokenInfo && listingOwners[prop.propertyId]?.toLowerCase() === currentSigner?.toLowerCase() &&(
              <div className="mt-3 mb-2">
                {!fractionalEvents[prop.propertyId] ? (
                  <div className="mt-3 mb-2">
                    <button
                      className="rounded-lg border border-transparent px-5 py-2 text-base font-medium bg-[#0c162c] text-white cursor-pointer transition-colors duration-200 hover:border-[#646cff]"
                      onClick={() => cancelListing(prop.propertyId)}
                    >
                      Delist
                    </button>
                   
                  </div>
                  
                ) : (
                  <p className="text-green-300 font-semibold">Delisting Successful</p>
                )}
              </div>
              )
              }

              {fractionalEvents[prop.propertyId] && (
                <div className="mt-2 text-sm text-white">
                  <p><strong>Share Token Address:</strong> {fractionalEvents[prop.propertyId].propertyTokenAddress}</p>
                  <p><strong>Marketpalce contract tokens:</strong> {fractionalEvents[prop.propertyId].remainingTokens}</p>
                </div>
              )}
            </div>
            </div>
          );
        })}
         </div>
      </div>
    ) : (
      <p>No properties found for this wallet.</p>
    )}
  </div>
);
}
export default CancelListing