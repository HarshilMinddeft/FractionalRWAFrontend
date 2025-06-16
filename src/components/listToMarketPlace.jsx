import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import PropertyNFTArti from '../artifacts/contracts/propertyNFT.sol/PropertyNFT.json';
import VaultArti from '../artifacts/contracts/FractionalVault.sol/FractionalVault.json';
import PropTokensArti from '../artifacts/contracts/PropertyShareToken.sol/PropertyShareToken.json';
import MarketplaceArti from '../artifacts/contracts/rwaMarketPlace.sol/FractionalMarketplace.json'
import NAV from './nav';
import { ToastContainer, toast } from 'react-toastify';
import SliderBar from './sliderBar'

const ListToMarketPlace = () => {

  const [properties, setProperties] = useState([]);
  const [Status, setStatus] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [fractionalEvents, setFractionalEvents] = useState({});
  const [tokensInputs,setTokenInputs] = useState({})
  const [userTokenBalaces,setUserTokenBalances]= useState([])

  const vaultAddress = "0x54B0ECd3C8a66C42cE93c112639aeDBfD8eDa124";
  const nftContractAddr = "0xd474267e496eE634f53FF4C55d37556849546B45";
  const marketplaceAddr = "0x6b771145BB9C12E8FB20a7B2650Ca101D6Cc811a"

  // Get connected wallet
  const getWalletAddress = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        const lowercaseAddress = accounts[0].toLowerCase();
        setUserAddress(lowercaseAddress)
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
    const PropertyNFT = new ethers.Contract(nftContractAddr, PropertyNFTArti.abi, signer);
    // const MarketPlaceData = new ethers.Contract(vaultAddress,MarketplaceArti.abi,signer);
    const filteredProps = [];
    for (const prop of allProps) {
      try {
        const isFrac = await PropertyNFT.isFractionalized(prop.propertyId);
        if (isFrac) {
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


  const listToMarketplace = async (tokenId)=>{
    const inputValue = tokensInputs[tokenId];

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      console.log("signerAddress",address)

      const tokensToListForProp = ethers.utils.parseUnits(inputValue.toString(), 18);

      const VaultFractionalize = new ethers.Contract(
          vaultAddress,
          VaultArti.abi,
          signer
        );

        const propertyToken = await VaultFractionalize.fractionalData(
          tokenId
        )

        let propertyShareTokenAddr = propertyToken.tokenAddress;

        const propertyTokensTxn = new ethers.Contract(
          propertyShareTokenAddr,
          PropTokensArti.abi,
          signer
        );

        const ListTokens = new ethers.Contract(
          marketplaceAddr,
          MarketplaceArti.abi,
          signer
        );

        const Checklisting = await ListTokens.listings(
          tokenId
        )
        const checkListing = Checklisting.active

        const transaction = await propertyTokensTxn.approve(
            marketplaceAddr,
            tokensToListForProp 
            );

          await transaction.wait();
          console.log("Approved tokens:", tokenId , transaction.hash);

        if (!checkListing) {
            setStatus("Listing New Tokens")
            console.log("Listing not done",checkListing)
            const tokensToList = await ListTokens.listProperty(
            propertyShareTokenAddr,
            tokensToListForProp
        )

        await tokensToList.wait();
        } else {
            setStatus("Adding More Tokens")
            console.log("Already Listed",checkListing)
              const addTokensToExisting = await ListTokens.addTokensToListing(
              tokenId,
              tokensToListForProp
         )
          await addTokensToExisting.wait();
        }

        const listing = await ListTokens.listings(
          tokenId
        )

        const listingData = {
            propertyTokenAddress: listing.propertyToken,
            totalShares: listing.totalTokens.toString(),
            pricePerToken: listing.pricePerToken.toString(),
            remainingTokens :listing.remainingTokens.toString(),
          };

          console.log("fractionalData",listingData)
          setFractionalEvents(prev => ({...prev,
            [tokenId]: listingData
          }));

       } catch (error) {
            if (error instanceof Error) {
        if (error.message.includes('user rejected')) {
          toast.error('Transection Rejected.')
          console.error('Transection Rejected:', error.message)
        } else {
          toast.error('Please Try after some time')
        }
      }
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
        fetchProperties(address);
      }
    };
    init();
  }, []);

return (
  <div className='sm:pl-64'>
  {/* <NAV  signer={userAddress}/> */}
  <SliderBar/>

    <h2 className="text-xl font-bold mt-4 mb-4">List tokens to marketplace</h2>
    <h3 className='mt-5'>{Status}</h3>

      <div>
        <ToastContainer position="top-center" autoClose={2000} />
      </div>

    {loading ? (
      <p>Loading properties...</p>
    ) : properties.length > 0 ? (
          <div className='mx-auto w-full max-w-[1360px] mb-6'>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[30px] mt-5 ml-2 mr-2'>
          
            {properties.map((prop) => {
              const tokenInfo = userTokenBalaces.find(
                (tkn) => tkn.propertyId === prop.propertyId
              );
              return (
                <div key={prop.propertyId} className="bg-[#ffffff] text-black rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 hover:scale-[1.02] cursor-pointer overflow-hidden">
                  {prop.propertyThumbImages?.length > 0 && (
                    <img
                      src={prop.propertyThumbImages[0]}
                      alt="Thumbnail"
                      className="w-full h-56 md:h-64 lg:h-64 object-cover rounded"
                    />
                  )}
                  <h3 className="mt-1 font-semibold">{prop.propertyName}</h3>
                  <p className='mt-3'><strong>Property id:</strong> {prop.propertyId}</p>
                  <p className=''><strong>Valuation :</strong> {prop.propertyPrice} USD</p>
                  {tokenInfo && (
                    <div className="">
                      <p><strong>Your Token Balance:</strong> {tokenInfo.balance}</p>
                      <p className='text-sm mt-4'>{tokenInfo.tokenAddress}</p>
                    </div>
                  )}
                {tokenInfo && parseFloat(tokenInfo.balance) > 0 ?(
                  <div className="mt-3 mb-2">
                    {!fractionalEvents[prop.propertyId] ? (
                      <div className="mt-3 mb-2 text-black">
                        <input
                          type="number"
                          placeholder="Enter number of tokens"
                          className="p-3 w-40 mr-4 text-sm rounded border border-gray-300"
                          onChange={(e) =>
                            setTokenInputs((prev) => ({
                              ...prev,
                              [prop.propertyId]: e.target.value
                            }))
                          }
                        />
                        <button
                          className="py-2 rounded-lg border border-transparent px-5 text-base font-medium bg-[#0c162c] text-white cursor-pointer transition-colors duration-200 hover:border-[#646cff] focus:outline-4 focus:outline-auto focus:outline-blue-500"
                          onClick={() => listToMarketplace(prop.propertyId)}
                        >
                          List Tokens
                        </button>
                      </div>
                    ) : (
                      <p className="text-green-300 font-semibold">Tokens added to marketplace</p>
                    )}
                  </div>
                  ):(
                  <p className='mt-2'><strong>All Tokens Are Listed</strong> </p>
                  )}
                  {fractionalEvents[prop.propertyId] && (
                    <div className="mt-2 text-sm text-white">
                      <p><strong>Share Token:</strong> {fractionalEvents[prop.propertyId].propertyTokenAddress}</p>
                      <p><strong>Total Shares:</strong> {fractionalEvents[prop.propertyId].totalShares}</p>
                      <p><strong>Per Token Price:</strong> {fractionalEvents[prop.propertyId].pricePerToken}</p>
                      <p><strong>Unbought Tokens:</strong> {fractionalEvents[prop.propertyId].remainingTokens}</p>
                    </div>
                  )}
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
export default ListToMarketPlace