import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { ToastContainer, toast } from 'react-toastify';
import Sidebar from '../components/common/Sidebar';
import web3Service from '../services/web3Service';
import propertyApi from '../api/propertyApi';
import contractsConfig from '../config/contracts.config';

const CancelListingPage = () => {
  const [properties, setProperties] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [fractionalEvents, setFractionalEvents] = useState({});
  const [userTokenBalances, setUserTokenBalances] = useState([]);
  const [currentSigner, setCurrentSigner] = useState('');
  const [propertyShares, setPropertyShares] = useState({});
  const [listingOwners, setListingOwners] = useState({});

  const fetchProperties = async () => {
    try {
      const data = await propertyApi.getAllMarketplaceProperties();
      const allProps = data.properties || [];

      const marketplaceContract = web3Service.getReadOnlyMarketplaceContract();
      const filteredProps = [];
      for (const prop of allProps) {
        try {
          const checkListing = await marketplaceContract.listings(prop.propertyId);
          const buyBack = checkListing.buyBack;
          const shares = Number(ethers.utils.formatUnits(checkListing.totalTokens, 18)).toString();
          const owner = checkListing.owner;

          if (buyBack) {
            filteredProps.push(prop);
            setPropertyShares((prev) => ({ ...prev, [prop.propertyId]: shares }));
            setListingOwners((prev) => ({ ...prev, [prop.propertyId]: owner }));
          }
        } catch (err) {
          console.error(`Error checking marketplace listing for token ${prop.propertyId}:`, err);
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

      const provider = web3Service.getProvider();
      const vaultContract = web3Service.getReadOnlyVaultContract();
      const balances = [];

      for (const prop of properties) {
        try {
          const fractionalData = await vaultContract.fractionalData(prop.propertyId);
          const tokenAddress = fractionalData.tokenAddress;

          if (tokenAddress && tokenAddress !== ethers.constants.AddressZero) {
            const tokenContract = new ethers.Contract(tokenAddress, contractsConfig.vault.abi, provider);

            const [balance, symbol, decimals] = await Promise.all([
              tokenContract.balanceOf(address),
              tokenContract.symbol(),
              tokenContract.decimals(),
            ]);

            balances.push({
              propertyId: prop.propertyId,
              tokenAddress,
              symbol,
              balance: ethers.utils.formatUnits(balance, decimals),
            });
          }
        } catch (err) {
          console.error(`Failed for property ID ${prop.propertyId}:`, err);
        }
      }
      setUserTokenBalances(balances);
    } catch (err) {
      console.error('Error fetching token balances:', err);
    }
  };

  const cancelListing = async (tokenId) => {
    try {
      const listTokensContract = await web3Service.getMarketplaceContract();
      const cancelTx = await listTokensContract.cancelListing(tokenId);
      await cancelTx.wait();

      const listing = await listTokensContract.listings(tokenId);
      const listingData = {
        propertyTokenAddress: listing.propertyToken,
        remainingTokens: listing.remainingTokens.toString(),
      };

      setFractionalEvents((prev) => ({
        ...prev,
        [tokenId]: listingData,
      }));
    } catch (error) {
      let errorMessage = 'Please try again later.';

      if (error && typeof error === 'object') {
        if (error.message?.toLowerCase().includes('user rejected')) {
          errorMessage = 'Transaction Rejected.';
          toast.error(errorMessage);
        } else if (error.reason) {
          toast.error('Insufficient tokens in marketplace');
          toast.error('Total tokens and remaining tokens should be equal');
        } else if (error.error?.data?.message) {
          errorMessage = error.error.data.message;
        } else if (error.data?.message) {
          errorMessage = error.data.message;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
      }
      console.error('Transaction error:', error);
    }
  };

  useEffect(() => {
    if (properties.length > 0) {
      fetchUserTokenBalance();
    }
  }, [properties]);

  useEffect(() => {
    const init = async () => {
      const address = await web3Service.getWalletAddress();
      if (address) {
        setCurrentSigner(address);
      }
      fetchProperties();
    };
    init();
  }, []);

  return (
    <div className="sm:pl-64">
      <Sidebar />
      <h2 className="text-xl font-bold mt-5 mb-4">Cancel Listing</h2>
      <h3 className="mt-5">{status}</h3>

      <div>
        <ToastContainer position="top-center" autoClose={2000} />
      </div>

      {loading ? (
        <p>Loading properties...</p>
      ) : properties.length > 0 ? (
        <div className="mx-auto w-full max-w-[1360px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[30px] mt-5 ml-2 mr-2 mb-5">
            {properties.map((prop) => {
              const tokenInfo = userTokenBalances.find(
                (tkn) => tkn.propertyId === prop.propertyId
              );
              return (
                <div key={prop.propertyId}>
                  <div className="bg-[#ffffff] text-black rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 hover:scale-[1.02] cursor-pointer overflow-hidden">
                    {prop.propertyThumbImages?.length > 0 && (
                      <img
                        src={prop.propertyThumbImages[0]}
                        alt="Thumbnail"
                        className="w-full h-56 md:h-64 lg:h-64 object-cover rounded"
                      />
                    )}

                    {tokenInfo && listingOwners[prop.propertyId]?.toLowerCase() === currentSigner?.toLowerCase() ? (
                      <div className="text-black">
                        <h3 className="text-2xl mt-1 font-semibold">{prop.propertyName}</h3>
                        <p className="mt-3"><strong>Property id:</strong> {prop.propertyId}</p>
                        <p><strong>Valuation :</strong> {prop.propertyPrice} USD</p>
                        <p><strong>Your Token Balance:</strong> {tokenInfo.balance}</p>
                        <p><strong> You should have</strong> {Math.floor(Number(prop.propertyPrice) / 40)}</p>
                        <p><strong>Total listed tokens:</strong> {propertyShares[prop.propertyId] || 'N/A'}</p>
                        <p className="text-sm mt-4">{tokenInfo.tokenAddress}</p>
                      </div>
                    ) : (
                      <p className="mt-2">Delisted</p>
                    )}

                    {tokenInfo && listingOwners[prop.propertyId]?.toLowerCase() === currentSigner?.toLowerCase() && (
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
                    )}

                    {fractionalEvents[prop.propertyId] && (
                      <div className="mt-2 text-sm text-white">
                        <p><strong>Share Token Address:</strong> {fractionalEvents[prop.propertyId].propertyTokenAddress}</p>
                        <p><strong>Marketplace contract tokens:</strong> {fractionalEvents[prop.propertyId].remainingTokens}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p>No properties found.</p>
      )}
    </div>
  );
};

export default CancelListingPage;
