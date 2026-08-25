import axios from 'axios';
import envConfig from '../config/env.config';

const api = axios.create({
  baseURL: `${envConfig.apiBaseUrl}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const propertyApi = {
  // Fetch properties owned by address
  getOwnerProperties: async (ownerAddress) => {
    const response = await api.get(`/Properties/getOwnerProperty?ownerAddress=${ownerAddress}`);
    return response.data;
  },

  // Fetch all marketplace properties summary
  getAllMarketplaceProperties: async () => {
    const response = await api.get(`/Properties/marketPlace/getAllPropertiesSummary`);
    return response.data;
  },

  // Fetch single property details by ID
  getPropertyById: async (propertyId) => {
    const response = await api.get(`/Properties/marketPlace/getPropertyById/${propertyId}`);
    return response.data;
  },

  // Register new user
  addNewUser: async (payload) => {
    const response = await api.post(`/user/addnewUser`, payload);
    return response.data;
  },

  // Upload NFT file to IPFS via backend
  uploadNftImage: async (formData) => {
    const response = await axios.post(`${envConfig.apiBaseUrl}/api/Properties/nftUpload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Upload metadata JSON to IPFS via backend
  uploadMetadata: async (metadataJSON) => {
    const response = await api.post(`/Properties/metadataUpload`, metadataJSON);
    return response.data;
  },

  // Store property entry in backend DB
  addProperty: async (propertyPayload) => {
    const response = await api.post(`/Properties/addProperty`, propertyPayload);
    return response.data;
  },
};

export default propertyApi;
