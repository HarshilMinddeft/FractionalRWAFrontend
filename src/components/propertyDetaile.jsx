import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import PropTokensArti from '../artifacts/contracts/PropertyShareToken.sol/PropertyShareToken.json'
import MarketplaceArti from '../artifacts/contracts/rwaMarketPlace.sol/FractionalMarketplace.json'
import StableCoin from '../artifacts/contracts/StableCoin.sol/STABLEC.json'
import OrderBook from '../artifacts/contracts/orderBook.sol/Orderbook.json'

const PropertyDetail = () => {

  const marketplaceAddr = "0x632b1A46cb0bfe30b9064927463823e23B9DedF1"
  const stableCoinAddr = "0xC65446b023e2A9479c072ff977F550AE09e41297"
  const orderBookAddr = "0x10c0ac94515544eb8073Fac50d8e566B060Da57C"

  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [buyTokensAmount, setBuyTokensAmount] = useState('');
  const [orderSellAmount, setOrderSellAmount] = useState('');
  const [opricePerToken, setPricePerToken] = useState('');
  const [contractListingData,setContractListingData] = useState('');
  const [orders, setOrders] = useState([]);
  const [buyAmounts, setBuyAmounts] = useState({});
  const [pAdmin,setPAdmin] = useState('');
  const [newPropAmount,setNewPropAmount] = useState('');
  const [currentSigner,setCurrentSigner] = useState('')

     const fetchDetails = async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        const MarketPlace = new ethers.Contract(marketplaceAddr, MarketplaceArti.abi, signer);
        const Checklisting = await MarketPlace.listings(id)
        const listingData = {
            shareToken: Checklisting.propertyToken,
            totalShares: Number(ethers.utils.formatUnits(Checklisting.totalTokens, 18)).toString(),
            pricePerToken: Number(ethers.utils.formatUnits(Checklisting.pricePerToken, 6)).toString(),
            remainingTokens: Number(ethers.utils.formatUnits(Checklisting.remainingTokens, 18)).toString(),
          };
        setContractListingData(listingData)

        // console.log("Checklisting",Checklisting)
        const res = await fetch(`http://localhost:3001/api/Properties/marketPlace/getPropertyById/${id}`);
        const data = await res.json();
        setProperty(data.property);
          console.log("signerAddress",address)
          setCurrentSigner(address)
        if(address == '0xe917e81c69Bf15238c63abd45d1c335C2fc80bDD'){
          setPAdmin(address)
        }

      } catch (err) {
        console.error("Error fetching property details:", err);
      }
    };

    const buyPropertyTokens = async() =>{
      try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const tokenstobuy = ethers.utils.parseUnits(buyTokensAmount.toString(), 18);

      const stableCoinConc = new ethers.Contract(
          stableCoinAddr,
          StableCoin.abi,
          signer
      );

      const transaction = await stableCoinConc.approve(
            marketplaceAddr,
            tokenstobuy 
            );

      await transaction.wait();

      const MarketPlaceCon = new ethers.Contract(
          marketplaceAddr,
          MarketplaceArti.abi,
          signer
        );

         const tokensPurchased = await MarketPlaceCon.buyTokens(id, tokenstobuy)
         await tokensPurchased.wait();
          fetchDetails();
        
      } catch (error) {
         console.error("Error fetching property details:", error);
      }
    }

    const fetchOrders = async() =>{
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      console.log("signerAddress",address)

      const MarketPlace = new ethers.Contract(marketplaceAddr, MarketplaceArti.abi, signer);
      const ChecklistingCtr = await MarketPlace.listings(id)

      const addressCheck = ChecklistingCtr.propertyToken;

       const orderBookCont = new ethers.Contract(
          orderBookAddr,
          OrderBook.abi,
          signer
      );

       const nextOrderId = await orderBookCont.nextOrderId();
       const fetchedOrders = [];

    for (let i = 0; i < nextOrderId; i++) {
      const order = await orderBookCont.orders(i);
      if (order.active && order.token == addressCheck) {
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
    }

    const buyfromLimit = async(orderId, buyAmount) => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();

      const formBuyAmount = ethers.utils.parseUnits(buyAmount.toString(), 18);

        const stableCoinConcAp = new ethers.Contract(
          stableCoinAddr,
          StableCoin.abi,
          signer
      );

      const transaction = await stableCoinConcAp.approve(orderBookAddr, formBuyAmount);

      await transaction.wait();

      const orderBookCont = new ethers.Contract(orderBookAddr,OrderBook.abi,signer);

      console.log("formBuyAmount",formBuyAmount)
      const BuyfromOrder = await orderBookCont.fillOrder(orderId, formBuyAmount);

      await BuyfromOrder.wait();

      fetchOrders();

    }

    const createLimitOrder = async() =>{
      try {

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();

      const formBuyAmount = ethers.utils.parseUnits(orderSellAmount.toString(), 18);
      const formOrderTokenAmount = ethers.utils.parseUnits(opricePerToken.toString(), 6);
              console.log("contractListingData.shareToken",contractListingData.shareToken)
          const propertyCoinConcAp = new ethers.Contract(
          contractListingData.shareToken,
          PropTokensArti.abi,
          signer
      );

      const transaction = await propertyCoinConcAp.approve(orderBookAddr, formBuyAmount);
      await transaction.wait();

      const orderBookCont = new ethers.Contract(orderBookAddr,OrderBook.abi,signer);

      console.log("formBuyAmount,formOrderTokenAmount",formBuyAmount.toString(),formOrderTokenAmount.toString())

      const createOrder = await orderBookCont.createOrder(
        contractListingData.shareToken,
         formBuyAmount,
         formOrderTokenAmount,
        );
        await createOrder.wait();

        fetchOrders();
        
      } catch (error) {
         console.error("Error fetching property details:", error);
      }

    }

    //Admin Funcion
    const changePropertyPriceAdm = async()=>{
      try {

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();

      const pTokenPrice = ethers.utils.parseUnits(newPropAmount.toString(), 6);

      const MarketPlaceCon = new ethers.Contract(
          marketplaceAddr,
          MarketplaceArti.abi,
          signer
        );

      const adminUpdatePropertyPrice = await MarketPlaceCon.updatePropertyPrice(id, pTokenPrice)
        await adminUpdatePropertyPrice.wait();
        fetchDetails()
        } catch (error) {
          
        }
    }

    const cancelLimitOrder = async(orderId) =>{
      try {

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();

      const orderBookCont = new ethers.Contract(orderBookAddr,OrderBook.abi,signer);

        const cancelOrder = await orderBookCont.cancelOrder(
         orderId,
        );
        await cancelOrder.wait();

        console.log("Order cancelled successfully");

        fetchOrders();

      } catch (error) {
        
      }
    }

    const handleBuyAmountChange = (orderId, value) => {
      setBuyAmounts((prev) => ({ ...prev, [orderId]: value }));
       };

       
  useEffect(() => {
    fetchDetails();
    fetchOrders();
  }, [id]);

  if (!property) return <p className="text-white p-6">Loading property details...</p>;

  return (
    <div className="text-white mt-8">
      <div className='relative flex items-center justify-center mb-6'>
      <div className="absolute left-0 mt-9 mb-9">
      <button
        onClick={() => navigate(-1)}
        className=" px-4 py-2 bg-green-700 rounded hover:bg-green-800"
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
                alt={`Property Image ${index + 1}`}
                className="h-[350px] min-w-[500px] object-cover rounded-lg"
              />
            ))}
          </div>
       )}
          <div className="flex flex-col md:flex-row gap-6 p-6 text-white">
            {/* Buy Tokens Box */}
            <div className="w-full md:w-1/3 bg-gray-700 p-5 rounded-lg shadow-lg">
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
                className="p-2 border border-gray-300 rounded-md w-full text-black mb-3"
                placeholder="Enter amount"
              />
              <button
                onClick={buyPropertyTokens}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Purchase
              </button>
            </div>
       {/* Limit orders  */}
            <div className="w-full md:w-1/3 bg-gray-700 p-5 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Limit Orders</h3>
             {orders.length === 0 ? (
                <p className="text-gray-300 mb-4">No active orders found.</p>
                ) : (
                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {orders.map((order) => (
                <div key={order.id} className="bg-gray-600 p-3 rounded text-sm flex justify-between items-center">

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
                      className="p-1 w-20 text-black text-sm rounded border border-gray-300"
                      placeholder="Qty"
                      value={buyAmounts[order.id] || ''}
                      onChange={(e) => handleBuyAmountChange(order.id, e.target.value)}
                    />
                    <button
                      className="bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                      onClick={() => buyfromLimit(order.id, buyAmounts[order.id])}
                    >
                      Buy
                      </button>
                      </>
                    )}

                    {/* Cancel order Box */}

                    {order.seller.toLowerCase() === currentSigner.toLowerCase() && (
                      <button
                        className="bg-red-500 text-white text-sm rounded px-2 py-1 hover:bg-red-600"
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
          {/* Sell Tokens Box */}
            <div className="w-full md:w-1/3 bg-gray-700 p-5 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-1">Create Sell Order</h3>
              <p className='text-sm mb-4'>You can sell you tokens by creating sell order here</p>
              <div className="mb-3">
                <label className="block text-sm mb-1">Amount to Sell</label>
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
                <label className="block text-sm mb-1">Price per Token</label>
                <input
                  type="number"
                  min="0"
                  value={opricePerToken}
                  onChange={(e) => setPricePerToken(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md w-full text-black"
                  placeholder="Enter price"
                />
              </div>

              <button
                onClick={createLimitOrder}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Create Sell Order
              </button>
            </div>
          </div>

           <div className="w-full md:w-1/1 bg-gray-700 p-5 rounded-lg shadow-lg text-[18px]">
            <h3><strong>Property ID: </strong> {property.propertyId}</h3> 
              <h3><strong>Token Address: </strong> {contractListingData.shareToken}</h3>   
              <h3><strong>Remaining Tokens: </strong> {contractListingData.remainingTokens} </h3>
              <h3><strong>Total Tokens: </strong> {contractListingData.totalShares}</h3>
           </div>
          {/* Admin Function */}
          {pAdmin && (
            <div className="flex justify-center mt-3">
              <div className="w-full md:w-1/2 bg-gray-700 p-5 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-white">Change Property Token Price</h3>
                <div className="flex justify-between items-center mb-2 text-white">
                  <p>Current Price</p>
                  <p><strong>{contractListingData.pricePerToken}</strong></p>
                </div>
                <input
                  type="number"
                  min="1"
                  value={newPropAmount}
                  onChange={(e) => setNewPropAmount(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md w-full text-black mb-3"
                  placeholder="Enter amount"
                />
                <button
                  onClick={changePropertyPriceAdm}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Update
                </button>
              </div>
            </div>
          )}

      <div className="text-left mt-8 text-[17px]">
        <div className='mb-5'>
          <h2><strong>Underlying asset price </strong> </h2>
          <p>{property.propertyPrice}</p>
        </div>
        <div className='mb-5'>
          <h2><strong>Price Per Tokes </strong> </h2>
          <p>{contractListingData.pricePerToken}</p>
        </div>
        <div className='mb-5'>
          <h2><strong>Property Size </strong> </h2>
          <p>{property.propertySize} sqft</p>
        </div>
        <div className='mb-5'>
          <h2><strong>Property Features </strong> </h2>
          <p>{property.propertyFeatures}</p>
        </div>
        <div className='mb-5'>
          <h2><strong>Offering Details </strong> </h2>
          <p>{property.offringDetailes}</p>
        </div>
        <div className='mb-5'>
          <h2><strong>Property Details </strong> </h2>
          <p>{property.propertyDetailes}</p>
        </div>
        <div className='mb-5'>
          <h2><strong>Management Details </strong> </h2>
          <p>{property.propertyManagement}</p>
        </div>
        <div className='mb-5'>
          <h2><strong>Location </strong> </h2>
          <p>{property.locationDetailes}</p>
        </div>  
        <div className='mb-5'>
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
  );
};

export default PropertyDetail;
