import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import PropertyCard from '../components/property/PropertyCard';
import PageHeader from '../components/ui/PageHeader';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { getPropertyDetailsPath } from '../config/routes';
import web3Service from '../services/web3Service';
import propertyApi from '../api/propertyApi';
import usePropertiesFilteredBy from '../hooks/usePropertiesFilteredBy';

const isActivelyListed = async (property, marketplaceContract) => {
  const listing = await marketplaceContract.listings(property.propertyId);
  return listing.active;
};

const MarketplacePage = () => {
  const navigate = useNavigate();

  const { properties, loading } = usePropertiesFilteredBy(
    propertyApi.getAllMarketplaceProperties,
    isActivelyListed,
    web3Service.getReadOnlyMarketplaceContract
  );

  return (
    <AppLayout>
      <PageHeader
        title="Marketplace"
        description="Browse fractionalized properties currently listed for sale."
        icon={<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" />}
      />
      {loading ? (
        <Spinner words={['properties', 'listings', 'prices', 'properties']} />
      ) : properties?.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((prop) => (
            <PropertyCard
              key={prop.propertyId}
              property={prop}
              onClick={() => navigate(getPropertyDetailsPath(prop.propertyId))}
            />
          ))}
        </div>
      ) : (
        <EmptyState>No properties are currently listed.</EmptyState>
      )}
    </AppLayout>
  );
};

export default MarketplacePage;
