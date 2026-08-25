import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { ToastContainer, toast } from 'react-toastify';
import Header from '../components/landingPage/comps/Header/Index';
import web3Service from '../services/web3Service';
import propertyApi from '../api/propertyApi';
import envConfig from '../config/env.config';
import contractsConfig from '../config/contracts.config';
import ComplianceArti from '../artifacts/contracts/RwaERC-3643/compliance/modular/ModularCompliance.sol/ModularCompliance.json';

const TokenizePropertyPage = () => {
  const [singleImage, setSingleImage] = useState(null);
  const [multipleImages, setMultipleImages] = useState([]);
  const [userAddress, setUserAddress] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [propUploadStatus, setProUploadStatus] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [formData, setFormData] = useState({
    propertyId: '',
    name: '',
    propertyPrice: '',
    propertySize: '',
    propertyOwnerWallet: '',
    features: '',
    offering: '',
    details: '',
    management: '',
    location: '',
  });

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSingleImageChange = (e) => setSingleImage(e.target.files[0]);
  const handleMultipleImagesChange = (e) => setMultipleImages([...e.target.files]);
  const handlePdfChange = (e) => setPdfFile(e.target.files[0]);

  const uploadToPinata = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const data = await propertyApi.uploadNftImage(fd);
    return `${envConfig.ipfsGateway}${data.IpfsHash}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadStatus('Uploading...');

    try {
      let tokenpId = '';
      let singleImageUrl = '';
      let complianceAddress = '';

      if (singleImage) {
        singleImageUrl = await uploadToPinata(singleImage);

        const metadata = {
          description: formData.details,
          external_url: 'https://openseacreatures.io/3',
          image: singleImageUrl,
          name: formData.name,
          attributes: [
            {
              trait_type: 'PDF',
              value: 'Doc',
            },
          ],
        };

        const metadataData = await propertyApi.uploadMetadata(metadata);
        const metadataUrl = `${envConfig.publicIpfsGateway}${metadataData.IpfsHash}`;

        const signer = await web3Service.getSigner();

        const complianceFactory = new ethers.ContractFactory(
          ComplianceArti.abi,
          ComplianceArti.bytecode,
          signer
        );
        toast.info('Deploying Compliance Contract.');
        const complianceContract = await complianceFactory.deploy();
        await complianceContract.deployed();
        toast.success('Deployed Compliance');

        complianceAddress = complianceContract.address;

        toast.info('Initializing Compliance Contract.');
        const initTx = await complianceContract.init();
        await initTx.wait();
        toast.success('Compliance Contract Initialized');

        const complianceCont = new ethers.Contract(
          complianceAddress,
          ComplianceArti.abi,
          signer
        );
        toast.info('Transferring Ownership.');
        const changeOwnerCompliance = await complianceCont.transferOwnership(
          formData.propertyOwnerWallet
        );
        await changeOwnerCompliance.wait();

        const propertyNftContract = await web3Service.getPropertyNftContract();
        toast.info('Minting Property NFT.');
        const transaction = await propertyNftContract.mintProperty(
          formData.name,
          formData.name,
          formData.propertyOwnerWallet,
          metadataUrl,
          formData.location,
          Number(formData.propertySize),
          Number(formData.propertyPrice)
        );

        const receipt = await transaction.wait();
        const mintedEvent = receipt.events.find((event) => event.event === 'PropertyMinted');
        const tokenId = mintedEvent.args.tokenId.toString();
        tokenpId = tokenId;
        const recipient = mintedEvent.args.recipient;

        setProUploadStatus(
          `NFT Minted!\nProperty NFT ID: ${tokenId}\nOwner Address: ${recipient}\nNft Address: ${contractsConfig.propertyNft.address}`
        );
      }

      const multiImageUrls = [];
      for (const file of multipleImages) {
        const url = await uploadToPinata(file);
        multiImageUrls.push(url);
      }

      let pdfUrl = '';
      if (pdfFile) pdfUrl = await uploadToPinata(pdfFile);

      toast.info('Saving Data.');
      const finalPayload = {
        propertyId: tokenpId,
        propertyName: formData.name,
        propertyPrice: formData.propertyPrice,
        propertySize: formData.propertySize,
        propertyOwnerWallet: formData.propertyOwnerWallet,
        propertyFeatures: formData.features,
        offringDetailes: formData.offering,
        propertyDetailes: formData.details,
        propertyManagement: formData.management,
        locationDetailes: formData.location,
        propertyDocuments: [pdfUrl],
        propertyImages: multiImageUrls,
        propertyThumbImages: [singleImageUrl],
        complianceAddress: complianceAddress,
        active: true,
      };

      await propertyApi.addProperty(finalPayload);

      setUploadStatus('Property tokenization successful!');
      toast.success('Process Completed successfully.');
    } catch (err) {
      console.error(err);
      setUploadStatus('Upload failed.');
      if (err instanceof Error) {
        if (err.message.includes('user rejected')) {
          toast.error('Transaction Rejected.');
        } else if (err.message.includes('cannot estimate gas')) {
          toast.error('Unauthorized Account');
        } else {
          toast.error('Please try after some time');
        }
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      const address = await web3Service.getWalletAddress();
      if (address) {
        setUserAddress(address.toLowerCase());
      }
    };
    init();
  }, []);

  return (
    <div>
      <Header />
      <div>
        <ToastContainer position="top-center" autoClose={2000} />
      </div>
      <div className="max-w-lg mx-auto sm:p-8 mt-5 rounded-[10px] mb-4 bg-[#ffffff] backdrop-blur-3xl text-black shadow-lg w-full">
        <h2 className="text-2xl font-bold">Property Details</h2>
        {propUploadStatus ? (
          <div className="bg-green-100 text-green-800 rounded-lg text-sm whitespace-pre-line p-4">
            {propUploadStatus}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {[
              'name',
              'propertyPrice',
              'propertySize',
              'propertyOwnerWallet',
              'features',
              'offering',
              'details',
              'management',
              'location',
            ].map((field) => {
              const customLabels = {
                propertyPrice: 'Property Price ($)',
                management: 'Managed By',
              };

              const label =
                customLabels[field] ||
                field.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());

              return (
                <div key={field} className="mb-4 text-left">
                  <label className="mb-2 text-sm font-medium block">{label}</label>
                  <input
                    name={field}
                    type="text"
                    value={formData[field]}
                    onChange={handleInputChange}
                    className="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg w-full py-2.5 px-4"
                    placeholder={`Enter ${label}`}
                  />
                </div>
              );
            })}

            <div className="mb-4 text-left">
              <label className="block mb-2 text-sm font-medium">Upload Single Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleSingleImageChange}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-100"
              />
            </div>

            <div className="mb-4 text-left">
              <label className="block mb-2 text-sm font-medium">Upload Multiple Images</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleMultipleImagesChange}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-100"
              />
            </div>

            <div className="mb-4 text-left">
              <label className="block mb-2 text-sm font-medium">Upload PDF Document</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={handlePdfChange}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-100"
              />
            </div>

            {userAddress === envConfig.adminWalletAddress ? (
              <button
                type="submit"
                className="w-full rounded-lg border border-transparent px-5 py-2 text-base font-medium bg-[#0c162c] text-white cursor-pointer transition-colors duration-200 hover:border-[#646cff]"
              >
                Register
              </button>
            ) : (
              <p className="font-semibold mt-4 text-red-600">Connect With Admin Wallet</p>
            )}
          </form>
        )}
        {uploadStatus && <p className="mt-4 text-sm">{uploadStatus}</p>}
      </div>
    </div>
  );
};

export default TokenizePropertyPage;
