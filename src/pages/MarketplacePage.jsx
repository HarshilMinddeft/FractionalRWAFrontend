import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/landingPage/comps/Header/Index';
import web3Service from '../services/web3Service';
import propertyApi from '../api/propertyApi';

const MarketplacePage = () => {
  const navigate = useNavigate();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const data = await propertyApi.getAllMarketplaceProperties();
      const allProps = data.properties || [];

      const marketplaceContract = web3Service.getReadOnlyMarketplaceContract();
      const filteredProps = [];
      for (const prop of allProps) {
        try {
          const checkListing = await marketplaceContract.listings(prop.propertyId);
          if (checkListing.active) {
            filteredProps.push(prop);
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

  useEffect(() => {
    fetchProperties();
  }, []);

  return (
    <div>
      <Header />
      {loading ? (
        <p className="text-gray-300 text-center text-lg mt-10">Loading properties...</p>
      ) : properties?.length > 0 ? (
        <div className="mx-auto w-full max-w-[1360px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[30px] mb-5 mt-10 ml-2 mr-2">
            {properties.map((prop) => (
              <div
                key={prop.propertyId}
                className="bg-[#ffffff] text-white rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 hover:scale-[1.02] cursor-pointer overflow-hidden"
                onClick={() => navigate(`/property/${prop.propertyId}`)}
              >
                {prop.propertyThumbImages?.length > 0 && (
                  <img
                    src={prop.propertyThumbImages[0]}
                    alt="Thumbnail"
                    className="w-full h-56 md:h-72 lg:h-80 object-cover"
                  />
                )}
                <div className="p-4 space-y-2">
                  <h3 className="text-2xl text-[#000000] font-bold">{prop.propertyName}</h3>
                  <div className="text-sm text-[#000000] space-y-1">
                    <p><strong className="text-[#000000]"> ID:</strong> {prop.propertyId}</p>
                    <p><strong className="text-[#000000]"> Price:</strong> {prop.propertyPrice} USD</p>
                    <p><strong className="text-[#000000]"> Size:</strong> {prop.propertySize} sqft</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-gray-300 text-center mt-10">No properties found.</p>
      )}
    </div>
  );
};

export default MarketplacePage;
