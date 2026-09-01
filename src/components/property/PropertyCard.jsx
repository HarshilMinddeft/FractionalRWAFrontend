import Card from '../ui/Card';

const PropertyCard = ({ property, onClick, children }) => {
  return (
    <Card
      className={`overflow-hidden transition hover:border-slate-300 dark:hover:border-slate-700 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {property.propertyThumbImages?.length > 0 && (
        <img src={property.propertyThumbImages[0]} alt="Thumbnail" className="h-56 w-full object-cover" />
      )}
      <div className="space-y-3 p-5">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{property.propertyName}</h3>
        <dl className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <dt className="text-slate-500">ID</dt>
            <dd className="font-medium text-slate-700 dark:text-slate-200">{property.propertyId}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Price</dt>
            <dd className="font-medium text-slate-700 dark:text-slate-200">${property.propertyPrice}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Size</dt>
            <dd className="font-medium text-slate-700 dark:text-slate-200">{property.propertySize} sqft</dd>
          </div>
        </dl>
        {children}
      </div>
    </Card>
  );
};

export default PropertyCard;
