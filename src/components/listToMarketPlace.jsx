import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import PropertyNFTArti from '../artifacts/contracts/propertyNFT.sol/PropertyNFT.json';
import VaultArti from '../artifacts/contracts/FractionalVault.sol/FractionalVault.json';
import PropTokensArti from '../artifacts/contracts/PropertyShareToken.sol/PropertyShareToken.json';
import MarketplaceArti from '../artifacts/contracts/rwaMarketPlace.sol/FractionalMarketplace.json'
import NAV from './nav';

const ListToMarketPlace = () => {

  const [properties, setProperties] = useState([]);
  const [Status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [fractionalEvents, setFractionalEvents] = useState({});
  const [tokensInputs,setTokenInputs] = useState({})
  const [userTokenBalaces,setUserTokenBalances]= useState([])

  const vaultAddress = "0x2B17094233a747D581734256cA064B6384ac810d";
  const nftContractAddr = "0x4bC392af2F448eC402b9bc52cBbEbd90692EB136";
  const marketplaceAddr = "0x632b1A46cb0bfe30b9064927463823e23B9DedF1"

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
      `http://localhost:3001/api/Properties/getOwnerProperty?ownerAddress=${address}`
    );
    const data = await res.json();
    const allProps = data.properties || [];

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const PropertyNFT = new ethers.Contract(nftContractAddr, PropertyNFTArti.abi, signer);
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

// const fetchUserTokenBalance = async () => {
//   try {
//     const provider = new ethers.providers.Web3Provider(window.ethereum);
//     const signer = provider.getSigner();
//     const userAddress = await signer.getAddress();

//     const VaultFractionalize = new ethers.Contract(
//       vaultAddress, 
//       VaultArti.abi,
//       signer
//     );

//     const balances = [];
//     console.log("properties",properties)
//     for (const prop of properties) {
//       try {
//         const fractionalData = await VaultFractionalize.fractionalData(prop.propertyId);
//         const tokenAddress = fractionalData.tokenAddress;

//         if (tokenAddress && tokenAddress !== ethers.constants.AddressZero) {
//           const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

//           const [balance, symbol, decimals] = await Promise.all([
//             tokenContract.balanceOf(userAddress),
//             tokenContract.symbol(),
//             tokenContract.decimals()
//           ]);

//           balances.push({
//             propertyId: prop.propertyId,
//             tokenAddress,
//             symbol,
//             balance: ethers.utils.formatUnits(balance, decimals)
//           });
//         }
      
//       } catch (err) {
//         console.error(`Failed for property ID ${prop.propertyId}:`, err);
//       }
//     }
//       setUserTokenBalances(balances)
//     // console.log("User token balances:", balances);
//     // Optionally store in state
//     // setUserTokenBalances(balances);

//   } catch (err) {
//     console.error("Error fetching token balances:", err);
//   }
// };


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
    <div className='mt-4 overflow-x-hidden'>
      <NAV/>
      <h2 className="text-2xl font-bold mt-5 mb-4">List tokens to marketplace</h2>
       <h3 className='mt-5'>{Status}</h3>
      {loading ? (
        <p>Loading properties...</p>
      ) : properties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {properties.map((prop) => (
            <div key={prop.propertyId} className="border p-2 rounded-lg bg-gray-700 shadow">
              {prop.propertyThumbImages && prop.propertyThumbImages.length > 0 && (
                <img src={prop.propertyThumbImages[0]} 
                alt="Thumbnail" 
                className="w-full h-56 md:h-64 lg:h-64 object-cover rounded" 
                />
              )}
              <h3 className="text-2xl mt-2 font-semibold">{prop.propertyName}</h3>
              <p><strong>Property id : </strong> {prop.propertyId}</p>
              <p><strong>Price:</strong> {prop.propertyPrice}</p>
              <p><strong>Size:</strong> {prop.propertySize} sqft</p>
              <div className="mt-3 mb-2">

            {!fractionalEvents[prop.propertyId] ? (
                <div className="mt-3 mb-2">
              <input
                type="number"
                placeholder="Enter number of tokens"
                className="p-3 w-40 mr-4 text-white text-sm rounded border border-gray-300"
                onChange={(e) =>
                  setTokenInputs((prev) => ({
                    ...prev,
                    [prop.propertyId]: e.target.value
                  }))
                }
              />
              <button
                className="py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                onClick={() =>
                  listToMarketplace(prop.propertyId)
                }
              >
                List Tokens
              </button>
            </div>
                   ) : (
                  <p className="text-green-300 font-semibold">Tokens added to marketplace</p>
                   )}
                  </div>
                {fractionalEvents[prop.propertyId] && (
              <div className="mt-2 text-sm text-white">
                <p><strong>Share Token:</strong> {fractionalEvents[prop.propertyId].propertyTokenAddress}</p>
                <p><strong>Total Shares:</strong> {fractionalEvents[prop.propertyId].totalShares}</p>
                <p><strong>Per Token Price: </strong> {fractionalEvents[prop.propertyId].pricePerToken}</p>
                <p><strong>Unbought Tokens:</strong> {fractionalEvents[prop.propertyId].remainingTokens}</p>
             </div>
           )}
            </div>
          ))}
        </div>
      ) : (
        <p>No properties found for this wallet.</p>
      )}
    </div>
  );
}

export default ListToMarketPlace