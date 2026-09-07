import { useState } from 'react';
import { toast } from 'react-toastify';
import AppLayout from '../components/layout/AppLayout';
import PropertyCard from '../components/property/PropertyCard';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import web3Service from '../services/web3Service';
import propertyApi from '../api/propertyApi';
import contractsConfig from '../config/contracts.config';
import usePropertiesFilteredBy from '../hooks/usePropertiesFilteredBy';
import { useWeb3 } from '../context/Web3Context';
import { getContractErrorMessage } from '../utils/web3Errors';
import { evenlyDividingTiers, isValidPriceTier, PRICE_STEP } from '../utils/units';

/** Suggested price per share, in whole dollars, when the owner hasn't chosen one. */
const DEFAULT_BASE_PRICE = 40;

const isNotFractionalized = async (property, propertyNftContract) => {
  const isFrac = await propertyNftContract.isFractionalized(property.propertyId);
  return !isFrac;
};

const FractionalizePage = () => {
  const { address: userAddress } = useWeb3();
  const [fractionalEvents, setFractionalEvents] = useState({});
  const [basePrices, setBasePrices] = useState({});

  const { properties, loading } = usePropertiesFilteredBy(
    () => (userAddress ? propertyApi.getOwnerProperties(userAddress) : Promise.resolve({ properties: [] })),
    isNotFractionalized,
    web3Service.getReadOnlyPropertyNftContract,
    [userAddress]
  );

  const fractionalize = async (tokenId, complianceAddress, basePrice) => {
    if (!isValidPriceTier(basePrice)) {
      toast.error(`Price per share must be a multiple of $${PRICE_STEP}.`);
      return;
    }

    try {
      const propertyNftContract = await web3Service.getPropertyNftContract();
      const approveTx = await propertyNftContract.approve(
        contractsConfig.vault.address,
        tokenId
      );
      await approveTx.wait();

      const vaultContract = await web3Service.getVaultContract();
      // _basePrice divides the NFT's propertyPrice, which is stored as a
      // whole-dollar figure — so it is passed unscaled, not in stablecoin units.
      const vaultTx = await vaultContract.fractionalizeProperty(
        tokenId,
        complianceAddress,
        Math.floor(Number(basePrice))
      );
      await vaultTx.wait();

      const propertyToken = await vaultContract.fractionalData(tokenId);
      setFractionalEvents((prev) => ({
        ...prev,
        [tokenId]: {
          shareToken: propertyToken.tokenAddress,
          totalShares: propertyToken.totalShares.toString(),
          originalOwner: propertyToken.originalOwner,
          complianceAddress: propertyToken.complianceAddress,
        },
      }));
      toast.success('Property fractionalized successfully.');
    } catch (error) {
      console.error('Error in Fractionalize:', error);
      toast.error(getContractErrorMessage(error, 'Fractionalization failed. Please try again.'));
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Fractionalize Property"
        description="Split your tokenized properties into tradable fractional shares."
        icon={<path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />}
      />
      {loading ? (
        <Spinner words={['properties', 'shares', 'tokens', 'properties']} />
      ) : properties.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((prop) => {
            const validTiers = evenlyDividingTiers(prop.propertyPrice);
            const defaultTier = validTiers.includes(DEFAULT_BASE_PRICE)
              ? DEFAULT_BASE_PRICE
              : validTiers[0];
            const basePrice = basePrices[prop.propertyId] ?? String(defaultTier ?? '');
            const shares =
              Number(basePrice) > 0
                ? Math.floor(Number(prop.propertyPrice) / Number(basePrice))
                : 0;

            return (
            <PropertyCard key={prop.propertyId} property={prop}>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
                {validTiers.length > 0 ? (
                  <Select
                    label="Price per share"
                    value={basePrice}
                    onChange={(e) =>
                      setBasePrices((prev) => ({ ...prev, [prop.propertyId]: e.target.value }))
                    }
                    disabled={!!fractionalEvents[prop.propertyId]}
                  >
                    {validTiers.map((tier) => (
                      <option key={tier} value={tier}>
                        ${tier}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    No ${PRICE_STEP}-multiple price evenly divides the ${prop.propertyPrice} property
                    price, so this property cannot be fractionalized with a whole-share price.
                  </p>
                )}
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Yields{' '}
                  <span className="text-slate-700 dark:text-slate-200 font-medium">{shares}</span>{' '}
                  whole shares
                </p>
                {!fractionalEvents[prop.propertyId] ? (
                  <Button
                    fullWidth
                    disabled={shares === 0}
                    onClick={() => fractionalize(prop.propertyId, prop.complianceAddress, basePrice)}
                  >
                    Fractionalize Property
                  </Button>
                ) : (
                  <p className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold">Fractionalized</p>
                )}
                {fractionalEvents[prop.propertyId] && (
                  <div className="text-xs text-slate-500 space-y-1 break-all">
                    <p><span className="text-slate-500 dark:text-slate-400">Share Token:</span> {fractionalEvents[prop.propertyId].shareToken}</p>
                    <p><span className="text-slate-500 dark:text-slate-400">Total Shares:</span> {fractionalEvents[prop.propertyId].totalShares}</p>
                  </div>
                )}
              </div>
            </PropertyCard>
            );
          })}
        </div>
      ) : (
        <EmptyState>No tokenized properties available to fractionalize.</EmptyState>
      )}
    </AppLayout>
  );
};

export default FractionalizePage;
