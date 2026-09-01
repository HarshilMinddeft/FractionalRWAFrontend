import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import AppLayout from '../components/layout/AppLayout';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import web3Service from '../services/web3Service';
import propertyApi from '../api/propertyApi';
import envConfig from '../config/env.config';
import contractsConfig from '../config/contracts.config';

const FIELDS = [
  'name',
  'propertyPrice',
  'propertySize',
  'propertyOwnerWallet',
  'features',
  'offering',
  'details',
  'management',
  'location',
];

const CUSTOM_LABELS = {
  propertyPrice: 'Property Price ($)',
  management: 'Managed By',
};

const labelFor = (field) =>
  CUSTOM_LABELS[field] || field.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());

const FileField = ({ label, ...rest }) => (
  <div className="mb-4 text-left">
    <label className="block mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">{label}</label>
    <input
      className="block w-full text-sm text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-950 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-200 file:cursor-pointer cursor-pointer"
      {...rest}
    />
  </div>
);

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
          contractsConfig.compliance.abi,
          contractsConfig.compliance.bytecode,
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
          contractsConfig.compliance.abi,
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
    <AppLayout>
      <PageHeader
        title="Tokenize Property"
        description="Mint a new property NFT and deploy its compliance contract."
        icon={<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18M3.75 3h16.5M9 6.75h.008v.008H9V6.75Zm0 3h.008v.008H9V9.75Zm0 3h.008v.008H9v-.008Zm3-6h.008v.008H12V6.75Zm0 3h.008v.008H12V9.75Zm0 3h.008v.008H12v-.008Z" />}
      />
      <Card className="max-w-lg mx-auto p-6 sm:p-8">
        {propUploadStatus ? (
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-sm whitespace-pre-line p-4">
            {propUploadStatus}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {FIELDS.map((field) => (
              <Input
                key={field}
                name={field}
                label={labelFor(field)}
                value={formData[field]}
                onChange={handleInputChange}
                placeholder={`Enter ${labelFor(field)}`}
              />
            ))}

            <FileField label="Upload Single Image" type="file" accept="image/*" onChange={handleSingleImageChange} />
            <FileField label="Upload Multiple Images" type="file" multiple accept="image/*" onChange={handleMultipleImagesChange} />
            <FileField label="Upload PDF Document" type="file" accept="application/pdf" onChange={handlePdfChange} />

            {userAddress === envConfig.adminWalletAddress ? (
              <Button type="submit" fullWidth>
                Register
              </Button>
            ) : (
              <p className="font-semibold text-red-600 dark:text-red-400 text-sm">Connect with the admin wallet to continue.</p>
            )}
          </form>
        )}
        {uploadStatus && <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{uploadStatus}</p>}
      </Card>
    </AppLayout>
  );
};

export default TokenizePropertyPage;
