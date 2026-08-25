import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { ToastContainer, toast } from 'react-toastify';
import web3Service from '../services/web3Service';
import propertyApi from '../api/propertyApi';
import contractsConfig from '../config/contracts.config';
import envConfig from '../config/env.config';
import IdentityRegistryArti from '../artifacts/contracts/RwaERC-3643/registry/implementation/IdentityRegistry.sol/IdentityRegistry.json';

const PropertyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [buyTokensAmount, setBuyTokensAmount] = useState('');
  const [orderSellAmount, setOrderSellAmount] = useState('');
  const [opricePerToken, setPricePerToken] = useState('');
  const [contractListingData, setContractListingData] = useState('');
  const [orders, setOrders] = useState([]);
  const [buyAmounts, setBuyAmounts] = useState({});
  const [pAdmin, setPAdmin] = useState('');
  const [newPropAmount, setNewPropAmount] = useState('');
  const [currentSigner, setCurrentSigner] = useState('');
  const [bbPrice, setBBPrice] = useState('');
  const [sellingTokens, setSellingTokens] = useState('');
  const [refId, setRefId] = useState('');
  const [kycStatus, setKycStatus] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCompleteKYCClick = () => {
    setShowPopup(true);
  };

  const handleKycSubmit = async () => {
    if (!refId) {
      return alert('Please enter a reference ID (e.g., email)');
    }
    const payload = {
      refId,
      userWalletAddress: currentSigner,
      kycActive: true,
    };

    const blockpass = new window.BlockpassKYCConnect('truefraction_12597', {
      refId,
      elementId: 'blockpass-kyc-connect-button',
      mainColor: '800080',
    });

    blockpass.startKYCConnect();
    if (isSubmitting) {
      setShowPopup(false);
      return;
    }
    setIsSubmitting(true);

    await propertyApi.addNewUser(payload);
  };

  const fetchDetails = async () => {
    try {
      // 1. Fetch backend details
      const data = await propertyApi.getPropertyById(id);
      if (data && data.property) {
        setProperty(data.property);
      }

      // 2. Fetch read-only listing details from contract
      const marketplaceContract = web3Service.getReadOnlyMarketplaceContract();
      const checkListing = await marketplaceContract.listings(id);
      const listingData = {
        shareToken: checkListing.propertyToken,
        totalShares: Number(ethers.utils.formatUnits(checkListing.totalTokens, 18)).toString(),
        pricePerToken: Number(ethers.utils.formatUnits(checkListing.pricePerToken, 6)).toString(),
        remainingTokens: Number(ethers.utils.formatUnits(checkListing.remainingTokens, 18)).toString(),
        buyBackPrice: Number(ethers.utils.formatUnits(checkListing.buyBackPrice, 6)).toString(),
        buyBack: checkListing.buyBack,
      };
      setContractListingData(listingData);

      // 3. Optional user wallet state & KYC check
      const address = await web3Service.getWalletAddress();
      if (address) {
        setCurrentSigner(address);
        if (address === envConfig.adminWalletAddress) {
          setPAdmin(address);
        }

        try {
          const provider = web3Service.getProvider();
          const identityRegistryCheck = new ethers.Contract(
            contractsConfig.identityRegistry.address,
            IdentityRegistryArti.abi,
            provider
          );
          const kycCheck = await identityRegistryCheck.isVerified(address);
          setKycStatus(kycCheck);
        } catch (kycErr) {
          console.error('KYC check error:', kycErr);
        }
      }
    } catch (err) {
      console.error('Error fetching property details:', err);
    }
  };

  const buyPropertyTokens = async () => {
    try {
      const signer = await web3Service.getSigner();
      const tokensToBuy = ethers.utils.parseUnits(buyTokensAmount.toString(), 18);

      const stableCoinContract = await web3Service.getStableCoinContract();
      const approveTx = await stableCoinContract.approve(
        contractsConfig.marketplace.address,
        tokensToBuy
      );
      await approveTx.wait();

      const marketplaceContract = await web3Service.getMarketplaceContract();
      const buyTx = await marketplaceContract.buyTokens(id, tokensToBuy);
      await buyTx.wait();
      fetchDetails();
    } catch (error) {
      console.error('Error buying property tokens:', error);
      if (error instanceof Error) {
        if (error.message.includes('user rejected')) {
          toast.error('Transaction Rejected.');
        } else if (error.message.includes('Transfer not possible')) {
          toast.error('KYC Required');
        } else if (error.message.includes('cannot estimate gas')) {
          toast.error('Insufficient funds');
        } else {
          toast.error('Please try after some time');
        }
      }
    }
  };

  const fetchOrders = async () => {
    try {
      const marketplaceContract = web3Service.getReadOnlyMarketplaceContract();
      const checkListing = await marketplaceContract.listings(id);
      const addressCheck = checkListing.propertyToken;

      const orderBookContract = web3Service.getReadOnlyOrderBookContract();
      const nextOrderId = await orderBookContract.nextOrderId();
      const fetchedOrders = [];

      for (let i = 0; i < nextOrderId; i++) {
        const order = await orderBookContract.orders(i);
        if (order.active && order.token === addressCheck) {
          fetchedOrders.push({
            id: order.id.toString(),
            token: order.token,
            seller: order.seller,
            amount: Number(ethers.utils.formatUnits(order.amount, 18)).toString(),
            pricePerToken: Number(ethers.utils.formatUnits(order.pricePerToken, 6)).toString(),
          });
        }
      }
      setOrders(fetchedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const buyFromLimit = async (orderId, buyAmount) => {
    try {
      const formBuyAmount = ethers.utils.parseUnits(buyAmount.toString(), 18);

      const stableCoinContract = await web3Service.getStableCoinContract();
      const approveTx = await stableCoinContract.approve(
        contractsConfig.orderBook.address,
        formBuyAmount
      );
      await approveTx.wait();

      const orderBookContract = await web3Service.getOrderBookContract();
      const fillTx = await orderBookContract.fillOrder(orderId, formBuyAmount);
      await fillTx.wait();

      fetchOrders();
    } catch (error) {
      console.error('Error buying from limit order:', error);
      if (error instanceof Error) {
        if (error.message.includes('user rejected')) {
          toast.error('Transaction Rejected.');
        } else if (error.message.includes('Transfer not possible')) {
          toast.error('KYC Required');
        } else if (error.message.includes('cannot estimate gas')) {
          toast.error('Insufficient funds');
        } else {
          toast.error('Please try after some time');
        }
      }
    }
  };

  const createLimitOrder = async () => {
    try {
      const signer = await web3Service.getSigner();
      const formBuyAmount = ethers.utils.parseUnits(orderSellAmount.toString(), 18);
      const formOrderTokenAmount = ethers.utils.parseUnits(opricePerToken.toString(), 6);

      const propertyTokenContract = new ethers.Contract(
        contractListingData.shareToken,
        contractsConfig.vault.abi,
        signer
      );

      const approveTx = await propertyTokenContract.approve(
        contractsConfig.orderBook.address,
        formBuyAmount
      );
      await approveTx.wait();

      const orderBookContract = await web3Service.getOrderBookContract();
      const createTx = await orderBookContract.createOrder(
        contractListingData.shareToken,
        formBuyAmount,
        formOrderTokenAmount
      );
      await createTx.wait();

      fetchOrders();
    } catch (error) {
      console.error('Error creating limit order:', error);
      if (error instanceof Error) {
        if (error.message.includes('user rejected')) {
          toast.error('Transaction Rejected.');
        } else if (error.message.includes('Transfer not possible')) {
          toast.error('KYC Required');
        } else if (error.message.includes('cannot estimate gas')) {
          toast.error('Insufficient funds');
        } else {
          toast.error('Please try after some time');
        }
      }
    }
  };

  const changePropertyPriceAdm = async () => {
    try {
      const pTokenPrice = ethers.utils.parseUnits(newPropAmount.toString(), 6);
      const marketplaceContract = await web3Service.getMarketplaceContract();
      const updateTx = await marketplaceContract.updatePropertyPrice(id, pTokenPrice);
      await updateTx.wait();

      fetchDetails();
      toast.success('Property price updated successfully!');
    } catch (error) {
      console.error('Error updating property price:', error);
      if (error instanceof Error) {
        if (error.message.includes('user rejected')) {
          toast.error('Transaction Rejected.');
        } else if (error.message.includes('cannot estimate gas')) {
          toast.error('Insufficient funds');
        } else {
          toast.error('Failed to update property price. Please try again.');
        }
      }
    }
  };

  const cancelLimitOrder = async (orderId) => {
    try {
      const orderBookContract = await web3Service.getOrderBookContract();
      const cancelTx = await orderBookContract.cancelOrder(orderId);
      await cancelTx.wait();

      toast.success('Order cancelled successfully!');
      fetchOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      if (error instanceof Error) {
        if (error.message.includes('user rejected')) {
          toast.error('Transaction Rejected.');
        } else if (error.message.includes('cannot estimate gas')) {
          toast.error('Insufficient funds');
        } else {
          toast.error('Failed to cancel order. Please try again.');
        }
      }
    }
  };

  const ownerBuyBack = async () => {
    try {
      const stableCoinContract = await web3Service.getStableCoinContract();
      const marketplaceContract = await web3Service.getMarketplaceContract();

      const remainingTokens = ethers.utils.parseUnits(
        contractListingData.remainingTokens.toString(),
        18
      );
      const buyBackPrice = ethers.utils.parseUnits(bbPrice.toString(), 6);

      const requiredStablecoin = remainingTokens
        .mul(buyBackPrice)
        .div(ethers.constants.WeiPerEther);

      const approveTx = await stableCoinContract.approve(
        contractsConfig.marketplace.address,
        requiredStablecoin
      );
      await approveTx.wait();

      const activateTx = await marketplaceContract.activateBuyBack(id, buyBackPrice);
      await activateTx.wait();

      fetchDetails();
      toast.success('Buyback activated successfully!');
    } catch (error) {
      console.error('Error activating buyback:', error);
      if (error instanceof Error) {
        if (error.message.includes('user rejected')) {
          toast.error('Transaction Rejected.');
        } else if (error.message.includes('cannot estimate gas')) {
          toast.error('Insufficient funds');
        } else {
          toast.error('Failed to activate buyback. Please try again.');
        }
      }
    }
  };

  const sellBackTokensContract = async () => {
    try {
      const convertTokens = ethers.utils.parseUnits(sellingTokens.toString(), 18);
      const signer = await web3Service.getSigner();

      const propertyTokenContract = new ethers.Contract(
        contractListingData.shareToken,
        contractsConfig.vault.abi,
        signer
      );

      const approveTx = await propertyTokenContract.approve(
        contractsConfig.marketplace.address,
        convertTokens
      );
      await approveTx.wait();

      const marketplaceContract = await web3Service.getMarketplaceContract();
      const sellTx = await marketplaceContract.sellTokensBack(id, convertTokens);
      await sellTx.wait();

      fetchDetails();
      toast.success('Tokens sold back successfully!');
    } catch (error) {
      console.error('Error selling back tokens:', error);
      if (error instanceof Error) {
        if (error.message.includes('user rejected')) {
          toast.error('Transaction Rejected.');
        } else if (error.message.includes('Transfer not possible')) {
          toast.error('KYC Required');
        } else if (error.message.includes('cannot estimate gas')) {
          toast.error('Insufficient funds');
        } else {
          toast.error('Failed to sell back tokens. Please try again.');
        }
      }
    }
  };

  const handleBuyAmountChange = (orderId, value) => {
    setBuyAmounts((prev) => ({ ...prev, [orderId]: value }));
  };

  useEffect(() => {
    const scriptId = 'blockpass-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.src = 'https://cdn.blockpass.org/widget/scripts/release/3.0.2/blockpass-kyc-connect.prod.js';
      script.id = scriptId;
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    fetchDetails();
    fetchOrders();
  }, [id]);

  if (!property) return <p className="text-black p-6">Loading property details...</p>;

  return (
    <div className="text-black mt-8">
      <div className="mx-auto w-full max-w-[1360px]">
        <div>
          <ToastContainer position="top-center" autoClose={2000} />
        </div>
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute left-0 mt-9 mb-9">
            <button
              onClick={() => navigate(-1)}
              className="rounded-lg border border-transparent px-5 py-2 text-base font-medium bg-[#0c162c] text-white cursor-pointer transition-colors duration-200 hover:border-[#646cff]"
            >
              ⬅ Back to All Properties
            </button>
          </div>
          <h2 className="text-3xl font-bold text-center">{property.propertyName}</h2>
        </div>

        {property.propertyImages?.length > 0 && (
          <div className="flex overflow-x-auto space-x-4 mb-4">
            {property.propertyImages.map((imageUrl, index) => (
              <img
                key={index}
                src={imageUrl}
                alt={`Property ${index + 1}`}
                className="h-[350px] min-w-[600px] object-cover rounded-lg"
              />
            ))}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6 p-6 text-white">
          {/* Sell Tokens Box */}
          {contractListingData.buyBack && (
            <div className="w-full md:w-1/3 bg-[#ffffff] text-black p-5 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Sell Tokens</h3>
              <div className="flex justify-between items-center mb-2">
                <p>Estimated Price</p>
                <p>{contractListingData.buyBackPrice}</p>
              </div>

              <input
                type="number"
                min="1"
                value={sellingTokens}
                onChange={(e) => setSellingTokens(e.target.value)}
                className="p-2 border border-gray-300 rounded-md w-full mb-3"
                placeholder="Enter amount"
              />
              <button
                onClick={sellBackTokensContract}
                className="w-full rounded-lg border border-transparent px-5 py-2 text-base font-medium bg-[#0c162c] text-white cursor-pointer transition-colors duration-200 hover:border-[#646cff]"
              >
                Sell
              </button>
            </div>
          )}

          {/* Buy Tokens Box */}
          {!contractListingData.buyBack && (
            <div className="w-full md:w-1/3 bg-[#ffffff] text-black p-5 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Buy Tokens</h3>
              <div className="flex justify-between items-center mb-2">
                <p>Estimated Price</p>
                <p>{contractListingData.pricePerToken}</p>
              </div>
              <div className="flex justify-between items-center mb-2">
                <p>Projected Annual Return</p>
                <p>15%</p>
              </div>
              <div className="flex justify-between items-center mb-2">
                <p>Rental Yield</p>
                <p>15.88%</p>
              </div>
              <input
                type="number"
                min="1"
                value={buyTokensAmount}
                onChange={(e) => setBuyTokensAmount(e.target.value)}
                className="p-2 border border-gray-300 rounded-md w-full mb-3 text-black"
                placeholder="Enter amount"
              />
              {kycStatus ? (
                <button
                  onClick={buyPropertyTokens}
                  className="w-full rounded-lg border border-transparent px-5 py-2 text-base font-medium bg-[#0c162c] text-white cursor-pointer transition-colors duration-200 hover:border-[#646cff]"
                >
                  Purchase
                </button>
              ) : (
                <button
                  onClick={handleCompleteKYCClick}
                  className="w-full rounded-lg border border-blue-500 px-5 py-2 text-base font-medium bg-white text-blue-600 hover:bg-blue-100"
                >
                  Complete KYC
                </button>
              )}
            </div>
          )}

          {showPopup && (
            <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                <h2 className="text-xl text-black font-semibold mb-4">Enter Email for KYC</h2>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full border p-2 rounded mb-4 text-black"
                  value={refId}
                  onChange={(e) => setRefId(e.target.value)}
                />
                <button
                  id="blockpass-kyc-connect-button"
                  onClick={handleKycSubmit}
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                  Start KYC
                </button>
              </div>
            </div>
          )}

          {/* Limit orders */}
          <div className="w-full md:w-1/3 bg-[#ffffff] text-black p-5 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Limit Orders</h3>
            {orders.length === 0 ? (
              <p className="text-black mb-4">No active orders found.</p>
            ) : (
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {orders.map((order) => (
                  <div key={order.id} className="bg-[#f5f5f5e3] p-3 rounded text-sm flex justify-between items-center">
                    <div>
                      <p><strong>Seller:</strong> {order.seller.slice(0, 6)}...{order.seller.slice(-4)}</p>
                      <p><strong>Amount:</strong> {order.amount}</p>
                      <p><strong>Price:</strong> ${order.pricePerToken}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {order.seller.toLowerCase() !== currentSigner.toLowerCase() && (
                        <>
                          <input
                            type="number"
                            min="1"
                            className="p-1 w-20 text-sm rounded border border-gray-300 text-black"
                            placeholder="Qty"
                            value={buyAmounts[order.id] || ''}
                            onChange={(e) => handleBuyAmountChange(order.id, e.target.value)}
                          />
                          {kycStatus && (
                            <button
                              className="rounded-lg border border-transparent px-5 py-1 text-base font-medium bg-[#0c162c] text-white cursor-pointer transition-colors duration-200 hover:border-[#646cff]"
                              onClick={() => buyFromLimit(order.id, buyAmounts[order.id])}
                            >
                              Buy
                            </button>
                          )}
                        </>
                      )}

                      {order.seller.toLowerCase() === currentSigner.toLowerCase() && (
                        <button
                          className="rounded-lg border border-transparent px-5 py-2 text-base font-medium bg-red-800 text-white cursor-pointer transition-colors duration-200 hover:border-[#646cff]"
                          onClick={() => cancelLimitOrder(order.id)}
                        >
                          Cancel Your Order
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sell Orders creation */}
          {property.propertyOwnerWallet?.toLowerCase() !== currentSigner.toLowerCase() && !contractListingData.buyBack && (
            <div className="w-full md:w-1/3 bg-[#ffffff] text-black p-5 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-1">Create Sell Order</h3>
              <p className="text-sm mb-4">You can sell your tokens by creating sell order here</p>
              <div className="mb-3">
                <label className="block text-sm font-bold mb-1">Amount to Sell</label>
                <input
                  type="number"
                  min="1"
                  value={orderSellAmount}
                  onChange={(e) => setOrderSellAmount(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md w-full text-black"
                  placeholder="Enter amount"
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-bold mb-1">Price per Token</label>
                <input
                  type="number"
                  min="0"
                  value={opricePerToken}
                  onChange={(e) => setPricePerToken(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md w-full text-black"
                  placeholder="Enter price"
                />
              </div>
              {kycStatus ? (
                <button
                  onClick={createLimitOrder}
                  className="w-full rounded-lg border border-transparent px-5 py-2 text-base font-medium bg-[#0c162c] text-white cursor-pointer transition-colors duration-200 hover:border-[#646cff]"
                >
                  Create Sell Order
                </button>
              ) : (
                <button
                  onClick={handleCompleteKYCClick}
                  className="w-full rounded-lg border border-blue-500 px-5 py-2 text-base font-medium bg-white text-blue-600 hover:bg-blue-100"
                >
                  Complete KYC
                </button>
              )}
            </div>
          )}
        </div>

        {contractListingData.buyBack && (
          <div className="w-full md:w-1/1 bg-red-600 p-5 rounded-lg mb-2 shadow-lg text-[18px] text-white">
            <h3><strong>Property owner delisted this property</strong></h3>
          </div>
        )}

        <div className="w-full md:w-1/1 bg-[#ffffff] text-black p-5 rounded-lg shadow-lg text-[18px]">
          <h3><strong>Property ID: </strong> {property.propertyId}</h3>
          <h3><strong>Token Address: </strong> {contractListingData.shareToken}</h3>
          <h3><strong>Remaining Tokens: </strong> {contractListingData.remainingTokens} </h3>
          <h3><strong>Total Tokens: </strong> {contractListingData.totalShares}</h3>
        </div>

        {pAdmin && (
          <div className="flex justify-center mt-3">
            <div className="w-full md:w-1/2 bg-[#ffffff] p-5 rounded-lg shadow-2xl">
              <h3 className="text-xl font-semibold mb-4 text-black">Change Property Token Price</h3>
              <div className="flex justify-between items-center mb-2 text-black">
                <p>Current Price</p>
                <p><strong>{contractListingData.pricePerToken}</strong></p>
              </div>
              <input
                type="number"
                min="1"
                value={newPropAmount}
                onChange={(e) => setNewPropAmount(e.target.value)}
                className="p-2 border border-gray-300 rounded-md w-full mb-3 text-black"
                placeholder="Enter amount"
              />
              <button
                onClick={changePropertyPriceAdm}
                className="w-full rounded-lg border border-transparent px-5 py-2 text-base font-medium bg-[#0c162c] text-white cursor-pointer transition-colors duration-200 hover:border-[#646cff]"
              >
                Update
              </button>
            </div>
          </div>
        )}

        {property.propertyOwnerWallet?.toLowerCase() === currentSigner.toLowerCase() && !contractListingData.buyBack && (
          <div className="flex justify-center mt-3">
            <div className="w-full md:w-1/2 bg-[#ffffff] p-5 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-2 text-black">Initiate BuyBack Program</h3>
              <div className="flex justify-between items-center mb-2 text-black">
                <p>Current Price</p>
                <p><strong>{contractListingData.pricePerToken}</strong></p>
              </div>
              <input
                type="number"
                min="1"
                value={bbPrice}
                onChange={(e) => setBBPrice(e.target.value)}
                className="p-2 border border-gray-300 rounded-md w-full mb-3 text-black"
                placeholder="Enter new buy back amount"
              />
              <button
                onClick={ownerBuyBack}
                className="w-full rounded-lg border border-transparent px-5 py-2 text-base font-medium bg-[#0c162c] text-white cursor-pointer transition-colors duration-200 hover:border-[#ffffff]"
              >
                Initiate
              </button>
              <p className="mt-2 text-sm text-gray-600">New buy amount should be minimum 10% more than current price</p>
            </div>
          </div>
        )}

        <div className="text-left mt-8 ml-2 text-[17px] mr-2 bg-[#ffffff] text-black p-5 rounded-lg shadow-lg">
          <div className="mb-5">
            <h2><strong>Underlying asset price </strong> </h2>
            <p>{property.propertyPrice}</p>
          </div>
          {contractListingData.buyBack && (
            <div className="mb-5">
              <h2><strong>New BuyBack Price</strong> </h2>
              <p>{contractListingData.buyBackPrice}</p>
            </div>
          )}
          <div className="mb-5">
            <h2><strong>Price Per Token </strong> </h2>
            <p>{contractListingData.pricePerToken}</p>
          </div>
          <div className="mb-5">
            <h2><strong>Property Size </strong> </h2>
            <p>{property.propertySize} sqft</p>
          </div>
          <div className="mb-5">
            <h2><strong>Property Features </strong> </h2>
            <p>{property.propertyFeatures}</p>
          </div>
          <div className="mb-5">
            <h2><strong>Offering Details </strong> </h2>
            <p>{property.offringDetailes}</p>
          </div>
          <div className="mb-5">
            <h2><strong>Property Details </strong> </h2>
            <p>{property.propertyDetailes}</p>
          </div>
          <div className="mb-5">
            <h2><strong>Management Details </strong> </h2>
            <p>{property.propertyManagement}</p>
          </div>
          <div className="mb-5">
            <h2><strong>Location </strong> </h2>
            <p>{property.locationDetailes}</p>
          </div>
          <div className="mb-5">
            <h2><strong>Property Documents</strong></h2>
            <a
              href={property.propertyDocuments}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline break-all"
            >
              Click here to view property documents
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailPage;
