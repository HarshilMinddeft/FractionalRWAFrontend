export const ROUTES = {
  home: '/',
  tokenizeProperty: '/tokenize-property',
  fractionalizeProperty: '/fractionalize-property',
  redeemProperty: '/redeem-property',
  listProperty: '/list-property',
  marketplace: '/marketplace',
  withdrawBuyBack: '/withdraw-buyback',
  updatePrice: '/update-price',
  cancelListing: '/cancel-listing',
  propertyDetails: '/properties/:id',
  identityVerification: '/identity-verification',
  updateBuyBackBPS: '/update-buyback-bps',
};

export const getPropertyDetailsPath = (propertyId) => `/properties/${propertyId}`;
