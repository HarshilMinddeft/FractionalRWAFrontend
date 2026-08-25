import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { ToastContainer, toast } from 'react-toastify';
import Sidebar from '../components/common/Sidebar';
import web3Service from '../services/web3Service';
import propertyApi from '../api/propertyApi';
import contractsConfig from '../config/contracts.config';

const ListMarketplacePage = () => {
  const [properties, setProperties] = useState([]);
  const [status, setStatus] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [fractionalEvents, setFractionalEvents] = useState({});
  const [tokensInputs, setTokenInputs] = useState({});
  const [userTokenBalances, setUserTokenBalances] = useState([]);

  const fetchProperties = async (address) => {
    try {
      const data = await propertyApi.getOwnerProperties(address);
      const allProps = data.properties || [];

      const propertyNftContract = web3Service.getReadOnlyPropertyNftContract();
      const filteredProps = [];
      for (const prop of allProps) {
        try {
          const isFrac = await propertyNftContract.isFractionalized(prop.propertyId);
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
      const address = await web3Service.getWalletAddress();
      if (!address) return;

      const vaultContract = web3Service.getReadOnlyVaultContract();
      const balances = [];

      for (const prop of properties) {
        try {
          const propertyTokenData = await vaultContract.fractionalData(prop.propertyId);
          const propertyShareTokenAddr = propertyTokenData.tokenAddress;

          if (propertyShareTokenAddr && propertyShareTokenAddr !== ethers.constants.AddressZero) {
            const provider = web3Service.getProvider();
            const tokenContract = new ethers.Contract(
              propertyShareTokenAddr,
              ['function balanceOf(address) view returns (uint256)'],
              provider
            );

            const balance = await tokenContract.balanceOf(address);

            balances.push({
              propertyId: prop.propertyId,
              propertyName: prop.propertyName,
              tokenAddress: propertyShareTokenAddr,
              balance: ethers.utils.formatUnits(balance, 18),
            });
          }
        } catch (err) {
          console.error(`Error fetching balance for property ${prop.propertyId}:`, err);
        }
      }

      setUserTokenBalances(balances);
    } catch (err) {
      console.error('Error fetching token balances:', err);
    }
  };

  const listToMarketplace = async (tokenId) => {
    const inputValue = tokensInputs[tokenId];
    if (!inputValue) {
      toast.error('Please enter the number of tokens to list.');
      return;
    }

    try {
      const signer = await web3Service.getSigner();
      const tokensToListForProp = ethers.utils.parseUnits(inputValue.toString(), 18);

      const vaultContract = await web3Service.getVaultContract();
      const propertyToken = await vaultContract.fractionalData(tokenId);
      const propertyShareTokenAddr = propertyToken.tokenAddress;

      const propertyTokensTxn = new ethers.Contract(
        propertyShareTokenAddr,
        contractsConfig.vault.abi,
        signer
      );

      const marketplaceContract = await web3Service.getMarketplaceContract();
      const checkListingData = await marketplaceContract.listings(tokenId);
      const checkListing = checkListingData.active;

      const approveTx = await propertyTokensTxn.approve(
        contractsConfig.marketplace.address,
        tokensToListForProp
      );
      await approveTx.wait();

      if (!checkListing) {
        const listTx = await marketplaceContract.listProperty(
          tokenId,
          propertyShareTokenAddr,
          tokensToListForProp
        );
        await listTx.wait();
      } else {
        const addTokensTx = await marketplaceContract.addMoreTokensToListing(
          tokenId,
          tokensToListForProp
        );
        await addTokensTx.wait();
      }

      const afterListingData = await marketplaceContract.listings(tokenId);
      const listingInfo = {
        shareToken: afterListingData.propertyToken,
        totalShares: Number(
          ethers.utils.formatUnits(afterListingData.totalTokens, 18)
        ).toString(),
        pricePerToken: Number(
          ethers.utils.formatUnits(afterListingData.pricePerToken, 6)
        ).toString(),
        remainingTokens: Number(
          ethers.utils.formatUnits(afterListingData.remainingTokens, 18)
        ).toString(),
      };

      setFractionalEvents((prev) => ({
        ...prev,
        [tokenId]: listingInfo,
      }));

      toast.success('Successfully listed to marketplace!');
      fetchUserTokenBalance();
    } catch (error) {
      console.error('Error listing tokens:', error);
      toast.error('Transaction Failed.');
    }
  };

  const handleInputChange = (tokenId, value) => {
    setTokenInputs((prev) => ({
      ...prev,
      [tokenId]: value,
    }));
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

  useEffect(() => {
    if (properties.length > 0 && userAddress) {
      fetchUserTokenBalance();
    }
  }, [properties, userAddress]);

  return (
    <div className="sm:pl-64">
      <Sidebar />
      <div>
        <ToastContainer position="top-center" autoClose={2000} />
      </div>
      <h2 className="text-xl font-bold mb-4 mt-5">List Fractional Properties To Marketplace</h2>
      {loading ? (
        <p>Loading properties...</p>
      ) : properties.length > 0 ? (
        <div className="mx-auto w-full max-w-[1360px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[30px] mt-5 ml-2 mr-2 mb-5">
            {properties.map((prop) => {
              const tokenBalanceObj = userTokenBalances.find(
                (b) => b.propertyId === prop.propertyId
              );
              const availableBalance = tokenBalanceObj ? tokenBalanceObj.balance : '0';

              return (
                <div
                  key={prop.propertyId}
                  className="bg-[#ffffff] text-black rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 hover:scale-[1.02] cursor-pointer overflow-hidden"
                >
                  {prop.propertyThumbImages && prop.propertyThumbImages.length > 0 && (
                    <img
                      src={prop.propertyThumbImages[0]}
                      alt="Thumbnail"
                      className="w-full h-64 lg:h-72 object-cover rounded"
                    />
                  )}
                  <h3 className="text-xl mt-1 font-semibold">{prop.propertyName}</h3>
                  <p className="mt-2"><strong>Property id : </strong> {prop.propertyId}</p>
                  <p><strong>Price:</strong> {prop.propertyPrice}</p>
                  <p><strong>Size:</strong> {prop.propertySize} sqft</p>

                  <div className="mt-2 text-sm text-[#000000] font-semibold">
                    <p>Your Token Balance: {availableBalance}</p>
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm font-medium mb-1">Enter Tokens to List:</label>
                    <input
                      type="number"
                      placeholder="e.g. 500"
                      className="border border-gray-300 rounded px-3 py-1 w-full max-w-[200px] mb-2 text-black"
                      value={tokensInputs[prop.propertyId] || ''}
                      onChange={(e) => handleInputChange(prop.propertyId, e.target.value)}
                    />
                  </div>

                  <div className="mt-2">
                    <button
                      className="rounded-lg border border-transparent px-5 py-2 text-base font-medium bg-[#0c162c] text-white cursor-pointer transition-colors duration-200 hover:border-[#646cff]"
                      onClick={() => listToMarketplace(prop.propertyId)}
                    >
                      List Property
                    </button>
                    <p className="mt-2 text-sm">
                      Default token listing price is <strong>$40</strong> per share.
                    </p>
                  </div>

                  {fractionalEvents[prop.propertyId] && (
                    <div className="mt-3 text-sm text-white bg-green-700 p-2 rounded">
                      <p><strong>Share Token:</strong> {fractionalEvents[prop.propertyId].shareToken}</p>
                      <p><strong>Total Listed Tokens:</strong> {fractionalEvents[prop.propertyId].totalShares}</p>
                      <p><strong>Price Per Token:</strong> ${fractionalEvents[prop.propertyId].pricePerToken}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p>No fractionalized properties found for this wallet.</p>
      )}
    </div>
  );
};

export default ListMarketplacePage;
