import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import AppLayout from '../components/layout/AppLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import web3Service from '../services/web3Service';
import propertyApi from '../api/propertyApi';
import contractsConfig from '../config/contracts.config';
import { ROUTES } from '../config/routes';
import { useWeb3 } from '../context/Web3Context';
import { getContractErrorMessage } from '../utils/web3Errors';
import {
  formatShares,
  formatStable,
  parseShares,
  parseStable,
  sharesTimesPrice,
} from '../utils/units';

/**
 * Upper bound used only when the FeeManager can't be read; the marketplace
 * transfers the real fee, so approving this much is safe, never binding.
 */
const FEE_FALLBACK_BPS = 500;

const SectionLabel = ({ children }) => (
  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-4">
    {children}
  </h3>
);

const FACT_ICONS = {
  id: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
  ),
  token: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
  ),
  price: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182.552-.44 1.278-.659 2.003-.659.725 0 1.45.22 2.003.659L14.5 8.5" />
  ),
  perToken: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-4.5v9m-3.75-3.375c0 1.036 1.679 1.875 3.75 1.875s3.75-.84 3.75-1.875-1.679-1.875-3.75-1.875-3.75-.84-3.75-1.875S10.179 7 12.25 7s3.75.84 3.75 1.875" />
  ),
  remaining: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  ),
  total: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5" />
  ),
  size: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
  ),
  features: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
  ),
  location: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
  ),
};

const FactCard = ({ icon, label, value, mono = false, wide = false }) => (
  <div
    className={`group relative flex h-full items-start gap-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900/60 p-4 transition-colors hover:border-indigo-300 dark:hover:border-indigo-800 ${
      wide ? 'sm:col-span-2' : ''
    }`}
  >
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
      <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        {FACT_ICONS[icon]}
      </svg>
    </div>
    <div className="min-w-0 flex-1 text-left">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold text-slate-900 dark:text-white ${mono ? 'break-all font-mono text-xs leading-relaxed' : 'truncate'}`}>
        {value}
      </p>
    </div>
  </div>
);

const AccordionSection = ({ title, icon, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
          <svg className="h-4 w-4 text-indigo-500 dark:text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {icon}
          </svg>
          {title}
        </span>
        <svg
          className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`grid transition-all duration-200 ease-in-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <p className="px-4 pb-4 text-left text-sm leading-relaxed text-slate-500 dark:text-slate-400">{children}</p>
        </div>
      </div>
    </div>
  );
};

const ImageCarousel = ({ images = [] }) => {
  const [active, setActive] = useState(0);

  if (!images.length) {
    return (
      <Card className="flex h-96 items-center justify-center text-slate-400 dark:text-slate-600">
        No images available
      </Card>
    );
  }

  const goTo = (i) => setActive((i + images.length) % images.length);

  return (
    <Card className="p-3">
      <div className="relative overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-950">
        <img
          src={images[active]}
          alt={`Property view ${active + 1}`}
          className="h-96 w-full object-cover"
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(active - 1)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md hover:bg-white dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-900 cursor-pointer transition"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => goTo(active + 1)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md hover:bg-white dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-900 cursor-pointer transition"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
              {active + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((imageUrl, index) => (
            <button
              key={imageUrl + index}
              type="button"
              onClick={() => setActive(index)}
              className={`shrink-0 overflow-hidden rounded-md border-2 transition ${
                index === active
                  ? 'border-indigo-600 dark:border-indigo-400'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={imageUrl} alt={`Thumbnail ${index + 1}`} className="h-16 w-20 object-cover" />
            </button>
          ))}
        </div>
      )}
    </Card>
  );
};

const StatusBanner = ({ buyBack, buyBackPrice }) =>
  buyBack ? (
    <Card className="p-4 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
      <span className="text-sm">
        <strong>Buyback in progress.</strong> The owner has escrowed funds to repurchase shares at $
        {buyBackPrice} each. New purchases are paused — you can sell your shares back at that price.
      </span>
    </Card>
  ) : null;

const PropertyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { address: currentSigner } = useWeb3();

  const [property, setProperty] = useState(null);
  const [buyTokensAmount, setBuyTokensAmount] = useState('');
  const [orderSellAmount, setOrderSellAmount] = useState('');
  const [opricePerToken, setPricePerToken] = useState('');
  const [contractListingData, setContractListingData] = useState('');
  const [orders, setOrders] = useState([]);
  const [buyAmounts, setBuyAmounts] = useState({});
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
      toast.error('Please enter a reference ID (e.g., email)');
      return;
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
      const data = await propertyApi.getPropertyById(id);
      if (data && data.property) {
        setProperty(data.property);
      }

      const marketplaceContract = web3Service.getReadOnlyMarketplaceContract();
      const checkListing = await marketplaceContract.listings(id);
      const listingData = {
        shareToken: checkListing.propertyToken,
        totalShares: formatShares(checkListing.totalTokens),
        pricePerToken: formatStable(checkListing.pricePerToken),
        remainingTokens: formatShares(checkListing.remainingTokens),
        buyBackPrice: formatStable(checkListing.buyBackPrice),
        buyBack: checkListing.buyBack,
      };
      setContractListingData(listingData);
    } catch (err) {
      console.error('Error fetching property details:', err);
    }
  };

  /**
   * Sale fee the marketplace will pull from the buyer on top of the price.
   * Read from the FeeManager the marketplace points at; if that read fails
   * we fall back to the maximum plausible fee so the approval is never short
   * (an over-approval is harmless — the contract only transfers the real fee).
   */
  const estimateSaleFee = async (totalPrice) => {
    try {
      const provider = web3Service.getReadOnlyProvider();
      const marketplace = web3Service.getReadOnlyMarketplaceContract();
      const feeManager = new ethers.Contract(
        await marketplace.feeManager(),
        contractsConfig.feeManager.abi,
        provider
      );

      const version = await feeManager.currentFeeVersion();
      const [config, denominator] = await Promise.all([
        feeManager.getFeeConfig(version),
        feeManager.BPS_DENOMINATOR(),
      ]);
      return totalPrice.mul(config.saleFeeBps).div(denominator);
    } catch (err) {
      console.error('Could not read sale fee, approving a safe upper bound:', err);
      return totalPrice.mul(FEE_FALLBACK_BPS).div(10000);
    }
  };

  const buyPropertyTokens = async () => {
    try {
      const tokensToBuy = parseShares(buyTokensAmount);

      // The marketplace pulls the sale price *and* the sale fee from the
      // buyer, so the allowance has to cover both — approving only the
      // token amount leaves the fee transfer to revert.
      const marketplaceRead = web3Service.getReadOnlyMarketplaceContract();
      const listing = await marketplaceRead.listings(id);
      const totalPrice = sharesTimesPrice(tokensToBuy, listing.pricePerToken);
      const feeAllowance = await estimateSaleFee(totalPrice);

      const stableCoinContract = await web3Service.getStableCoinContract();
      const approveTx = await stableCoinContract.approve(
        contractsConfig.marketplace.address,
        totalPrice.add(feeAllowance)
      );
      await approveTx.wait();

      const marketplaceContract = await web3Service.getMarketplaceContract();
      const buyTx = await marketplaceContract.buyTokens(id, tokensToBuy);
      await buyTx.wait();
      toast.success('Tokens purchased successfully!');
      fetchDetails();
    } catch (error) {
      console.error('Error buying property tokens:', error);
      toast.error(getContractErrorMessage(error));
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
            amount: formatShares(order.amount),
            pricePerToken: formatStable(order.pricePerToken),
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
      const formBuyAmount = parseShares(buyAmount);

      // fillOrder takes a share count, but the allowance it spends is
      // stablecoin — approve the cost of those shares, not the share count.
      const orderBookRead = web3Service.getReadOnlyOrderBookContract();
      const order = await orderBookRead.orders(orderId);
      const cost = sharesTimesPrice(formBuyAmount, order.pricePerToken);

      const stableCoinContract = await web3Service.getStableCoinContract();
      const approveTx = await stableCoinContract.approve(
        contractsConfig.orderBook.address,
        cost
      );
      await approveTx.wait();

      const orderBookContract = await web3Service.getOrderBookContract();
      const fillTx = await orderBookContract.fillOrder(orderId, formBuyAmount);
      await fillTx.wait();

      toast.success('Order filled successfully!');
      fetchOrders();
    } catch (error) {
      console.error('Error buying from limit order:', error);
      toast.error(getContractErrorMessage(error));
    }
  };

  const createLimitOrder = async () => {
    try {
      const formBuyAmount = parseShares(orderSellAmount);
      const formOrderTokenAmount = parseStable(opricePerToken);

      const propertyTokenContract = await web3Service.getShareTokenContract(
        contractListingData.shareToken
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

      toast.success('Sell order created successfully!');
      fetchOrders();
    } catch (error) {
      console.error('Error creating limit order:', error);
      toast.error(getContractErrorMessage(error));
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
      toast.error(getContractErrorMessage(error, 'Failed to cancel order. Please try again.'));
    }
  };

  const sellBackTokensContract = async () => {
    try {
      const convertTokens = parseShares(sellingTokens);

      const propertyTokenContract = await web3Service.getShareTokenContract(
        contractListingData.shareToken
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
      toast.error(getContractErrorMessage(error, 'Failed to sell back tokens. Please try again.'));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!currentSigner) {
      setKycStatus(false);
      return;
    }
    const checkKyc = async () => {
      try {
        const provider = web3Service.getProvider();
        const identityRegistryCheck = new ethers.Contract(
          contractsConfig.identityRegistry.address,
          contractsConfig.identityRegistry.abi,
          provider
        );
        const kycCheck = await identityRegistryCheck.isVerified(currentSigner);
        setKycStatus(kycCheck);
      } catch (kycErr) {
        console.error('KYC check error:', kycErr);
      }
    };
    checkKyc();
  }, [currentSigner]);

  const isOwner = useMemo(
    () => property?.propertyOwnerWallet?.toLowerCase() === currentSigner.toLowerCase(),
    [property, currentSigner]
  );

  if (!property) {
    return (
      <AppLayout>
        <Spinner words={['details', 'images', 'pricing', 'details']} />
      </AppLayout>
    );
  }

  const KycGate = ({ onVerified }) =>
    kycStatus ? (
      onVerified
    ) : (
      <Button variant="secondary" fullWidth onClick={handleCompleteKYCClick}>
        Complete KYC
      </Button>
    );

  return (
    <AppLayout>
      <div className="flex items-start gap-4 mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight truncate">{property.propertyName}</h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                contractListingData.buyBack
                  ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${contractListingData.buyBack ? 'bg-red-500' : 'bg-emerald-500'}`} />
              {contractListingData.buyBack ? 'Buyback Active' : 'Active'}
            </span>
          </div>
          {property.locationDetailes && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
              <svg className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              {property.locationDetailes}
            </p>
          )}
        </div>
      </div>

      <div className="mb-6">
        <StatusBanner
          buyBack={contractListingData.buyBack}
          buyBackPrice={contractListingData.buyBackPrice}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT: carousel + details */}
        <div className="lg:col-span-2 space-y-6">
          <ImageCarousel images={property.propertyImages} />

          <Card className="p-6">
            <SectionLabel>Property Details</SectionLabel>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
              <FactCard icon="id" label="Property ID" value={property.propertyId} />
              <FactCard icon="size" label="Property Size" value={`${property.propertySize} sqft`} />
              <FactCard icon="price" label="Underlying Asset Price" value={`$${property.propertyPrice}`} />
              <FactCard icon="perToken" label="Price per Token" value={`$${contractListingData.pricePerToken}`} />
              {contractListingData.buyBack && (
                <FactCard icon="price" label="Buyback Price" value={`$${contractListingData.buyBackPrice}`} wide />
              )}
              <FactCard icon="remaining" label="Remaining Tokens" value={`${contractListingData.remainingTokens} / ${contractListingData.totalShares}`} wide />
              <FactCard icon="location" label="Location" value={property.locationDetailes} wide />
              <FactCard icon="features" label="Features" value={property.propertyFeatures} wide />
              <FactCard icon="token" label="Token Address" value={contractListingData.shareToken} mono wide />
            </div>

            <div className="mt-6 space-y-3">
              {property.offringDetailes && (
                <AccordionSection
                  title="Offering Details"
                  defaultOpen
                  icon={<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" />}
                >
                  {property.offringDetailes}
                </AccordionSection>
              )}
              {property.propertyDetailes && (
                <AccordionSection
                  title="Property Details"
                  icon={<path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />}
                >
                  {property.propertyDetailes}
                </AccordionSection>
              )}
              {property.propertyManagement && (
                <AccordionSection
                  title="Management Details"
                  icon={<path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />}
                >
                  {property.propertyManagement}
                </AccordionSection>
              )}
              {property.propertyDocuments && (
                <a
                  href={property.propertyDocuments}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-800 px-4 py-3.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                >
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                  </svg>
                  View property documents
                </a>
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT: trading rail */}
        <div className="space-y-6 lg:sticky lg:top-6">
          {contractListingData.buyBack ? (
            <Card className="p-5">
              <SectionLabel>Sell Tokens</SectionLabel>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-slate-500">Buyback Price</span>
                <span className="text-slate-700 dark:text-slate-200 font-medium">${contractListingData.buyBackPrice}</span>
              </div>
              <Input
                type="number"
                min="1"
                value={sellingTokens}
                onChange={(e) => setSellingTokens(e.target.value)}
                placeholder="Enter amount"
                className="mb-3"
              />
              <Button fullWidth onClick={sellBackTokensContract}>Sell</Button>
            </Card>
          ) : (
            <Card className="p-5">
              <SectionLabel>Buy Tokens</SectionLabel>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Price per Token</span>
                <span className="text-slate-700 dark:text-slate-200 font-medium">${contractListingData.pricePerToken}</span>
              </div>
              <div className="flex justify-between text-sm mb-4">
                <span className="text-slate-500">Remaining Tokens</span>
                <span className="text-slate-700 dark:text-slate-200 font-medium">{contractListingData.remainingTokens}</span>
              </div>
              <Input
                type="number"
                min="1"
                value={buyTokensAmount}
                onChange={(e) => setBuyTokensAmount(e.target.value)}
                placeholder="Enter amount"
                className="mb-3"
              />
              <KycGate>
                <Button fullWidth onClick={buyPropertyTokens}>Purchase</Button>
              </KycGate>
            </Card>
          )}

          <Card className="p-5">
            <SectionLabel>Limit Orders</SectionLabel>
            {orders.length === 0 ? (
              <p className="text-slate-500 text-sm">No active orders found.</p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {orders.map((order) => (
                  <div key={order.id} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm">
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <div className="min-w-0">
                        <p className="text-slate-400 dark:text-slate-500 text-xs truncate">{order.seller.slice(0, 6)}...{order.seller.slice(-4)}</p>
                        <p className="text-slate-700 dark:text-slate-200 font-medium">{order.amount} tokens @ ${order.pricePerToken}</p>
                      </div>
                    </div>

                    {order.seller.toLowerCase() !== currentSigner.toLowerCase() ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          className="p-1.5 w-full min-w-0 text-sm rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                          placeholder="Qty"
                          value={buyAmounts[order.id] || ''}
                          onChange={(e) => handleBuyAmountChange(order.id, e.target.value)}
                        />
                        {kycStatus && (
                          <Button className="px-3 py-1.5 shrink-0" onClick={() => buyFromLimit(order.id, buyAmounts[order.id])}>
                            Buy
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Button variant="danger" fullWidth className="px-3 py-1.5" onClick={() => cancelLimitOrder(order.id)}>
                        Cancel Order
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {!isOwner && !contractListingData.buyBack && (
            <Card className="p-5">
              <SectionLabel>Create Sell Order</SectionLabel>
              <p className="text-sm text-slate-500 -mt-2 mb-4">List your tokens for sale on the order book.</p>
              <Input
                label="Amount to Sell"
                type="number"
                min="1"
                value={orderSellAmount}
                onChange={(e) => setOrderSellAmount(e.target.value)}
                placeholder="Enter amount"
                className="mb-3"
              />
              <Input
                label="Price per Token"
                type="number"
                min="0"
                value={opricePerToken}
                onChange={(e) => setPricePerToken(e.target.value)}
                placeholder="Enter price"
                className="mb-4"
              />
              <KycGate>
                <Button fullWidth onClick={createLimitOrder}>Create Sell Order</Button>
              </KycGate>
            </Card>
          )}

          {isOwner && !contractListingData.buyBack && (
            <Card className="p-5 border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/10">
              <SectionLabel>Buyback Program</SectionLabel>
              <p className="text-sm text-slate-500 -mt-2 mb-4">
                Offer to repurchase shares from your investors. The full cost is escrowed up front.
              </p>
              <Button variant="secondary" fullWidth onClick={() => navigate(ROUTES.buyBack)}>
                Manage Buyback
              </Button>
            </Card>
          )}
        </div>
      </div>

      {showPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="p-6 w-96">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Enter Email for KYC</h2>
            <Input
              type="email"
              placeholder="you@example.com"
              value={refId}
              onChange={(e) => setRefId(e.target.value)}
              className="mb-4"
            />
            <Button id="blockpass-kyc-connect-button" fullWidth onClick={handleKycSubmit}>
              Start KYC
            </Button>
          </Card>
        </div>
      )}
    </AppLayout>
  );
};

export default PropertyDetailPage;
