import React, { useState ,useEffect } from 'react';
import PropertyNFTArti from '../artifacts/contracts/RwaERC-3643/TrueFraction/propertyNFT.sol/PropertyNFT.json'
import ComplianceArti from '../artifacts/contracts/RwaERC-3643/compliance/modular/ModularCompliance.sol/ModularCompliance.json'
import {ethers} from 'ethers'
// import NAV from './nav';
import { ToastContainer, toast } from 'react-toastify';
import Header from './landingPage/comps/Header/Index'

const TokenizeProperty = () => {
  const [singleImage, setSingleImage] = useState(null);
  const [multipleImages, setMultipleImages] = useState([]);
  const [userAddress, setUserAddress] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [propUploadStatus, setProUploadStatus] = useState();
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

  const [uploadStatus, setUploadStatus] = useState('');

  const PContractAddr = "0x00A0A54c2e1a41D41182Dcd255bfD06305361d21"; // On cello nft contract address

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSingleImageChange = (e) => setSingleImage(e.target.files[0]);
  const handleMultipleImagesChange = (e) => setMultipleImages([...e.target.files]);
  const handlePdfChange = (e) => setPdfFile(e.target.files[0]);

  const uploadToPinata = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('https://fractionalrwabackend-k5z9.onrender.com/api/Properties/nftUpload', {
      method: 'POST',
      body: fd
    });
    const data = await res.json();
    return `https://brown-leading-scallop-142.mypinata.cloud/ipfs/${data.IpfsHash}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadStatus("Uploading...");

    try {
      let tokenpId = '';
      let singleImageUrl = '';
      let ComplianceAddress = '';

      if (singleImage) {
  singleImageUrl = await uploadToPinata(singleImage);
  
  // Prepare and upload metadata
       const metadata = {
        description: formData.details,
        external_url: "https://openseacreatures.io/3",
        image: singleImageUrl,
        name: formData.name,
        attributes: [
          {
            trait_type: "PDF",
            value: "Doc"
          }
        ]
      };

        const metadataRes = await fetch('https://fractionalrwabackend-k5z9.onrender.com/api/Properties/metadataUpload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(metadata)
        });

        const metadataData = await metadataRes.json();
        console.log("Metadata uploaded to IPFS:", metadataData.IpfsHash);
        const metadataUrl = `https://ipfs.io/ipfs/${metadataData.IpfsHash}`;
        console.log("Metadata URL:", metadataUrl);

        // Contract intigration
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        console.log("signerAddress",address)
        
         const ComplianceFactory = new ethers.ContractFactory(
          ComplianceArti.abi,
          ComplianceArti.bytecode,
          signer
        );
        toast.info('Deploying Compliance Contract.')
        const complianceContract = await ComplianceFactory.deploy();
        await complianceContract.deployed();
        console.log("Deployed ModularCompliance at:", complianceContract.address);
        toast.success('Deployed Compliance')

        ComplianceAddress = complianceContract.address

        // Call init() as it's an initializer
        toast.info('Initializing Compliance Contract.')
        const tx = await complianceContract.init();
        await tx.wait();
        toast.success('Compliance Contract Initialized')

          const ComplianceCont = new ethers.Contract(
          ComplianceAddress,
          ComplianceArti.abi,
          signer
        );
        toast.info('Transferring Ownership.')
        const chnageOwnerCompliance = await ComplianceCont.transferOwnership(
          formData.propertyOwnerWallet
        );
        
        const complianceTxn = await chnageOwnerCompliance.wait();
        // const transactionHash = transaction.hash

         const PropertyNFT = new ethers.Contract(
          PContractAddr,
          PropertyNFTArti.abi,
          signer
        );
          toast.info('Minting Property NFT.')
          const transaction =
          await PropertyNFT.mintProperty(
            formData.name,
            formData.name,
            formData.propertyOwnerWallet,
            metadataUrl,
            formData.location,
            Number(formData.propertySize),
            Number(formData.propertyPrice)
          );

        const receipt = await transaction.wait();
        const transactionHash = transaction.hash
        console.log("Transaction receipt:", receipt);
        const mintedEvent = receipt.events.find(event => event.event === 'PropertyMinted');
        const tokenId = mintedEvent.args.tokenId.toString();
        tokenpId = tokenId;
        const recipient = mintedEvent.args.recipient;

         // https://alfajores.celoscan.io/tx/${transactionHash} Removed temp 
          setProUploadStatus(`NFT Minted!
           Property NFT ID: ${tokenId}
           Owner Address: ${recipient}
           Nft Address: ${PContractAddr}`);

          console.log("NFT DETAILES",tokenId,recipient,transactionHash,PContractAddr)
        }

      const multiImageUrls = [];
      for (const file of multipleImages) {
        const url = await uploadToPinata(file);
        multiImageUrls.push(url);
      }

      let pdfUrl = '';
      if (pdfFile) pdfUrl = await uploadToPinata(pdfFile);

      toast.info('Saving Data.')
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
        complianceAddress : ComplianceAddress,
        active: true
      };

      // console.log("FINAL PAYLOAD", JSON.stringify(finalPayload));

      const response = await fetch('https://fractionalrwabackend-k5z9.onrender.com/api/Properties/addProperty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload),
      });

      if (!response.ok) throw new Error('Failed to upload property data.');

      setUploadStatus("Property tokenization successful!");
      toast.success('Process Completed successfully.')
      console.log("Saved property:", await response.json());

    } catch (err) {
      console.error(err);
      setUploadStatus("Upload failed.");
      if (err instanceof Error) {
        if (err.message.includes('user rejected')) {
          toast.error('Transection Rejected.')
         } else if (err.message.includes('cannot estimate gas')){
          toast.error('Unauthorized Account')
          } else{
          toast.error('Please try after some time')
        }
      }
    }
  };
    const getWalletAddress = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        const lowercaseAddress = accounts[0].toLowerCase();
        setUserAddress(lowercaseAddress);
        // console.log(lowercaseAddress)
        return lowercaseAddress;
      } catch (err) {
        console.error('Error getting wallet:', err);
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

    useEffect(() => {
       getWalletAddress();
    }, []);


return (
  <div className=''>
      <Header/>
    {/* <NAV /> */}
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
            'location'
          ].map((field) => {
            const customLabels = {
              propertyPrice: 'Property Price ($)',
              management: 'Managed By'
            };

            const label =
              customLabels[field] ||
              field.replace(/([A-Z])/g, ' $1').replace(/^./, (str) =>
                str.toUpperCase()
              );

            return (
              <div key={field} className="mb-4 text-left">
                <label className="mb-2 text-sm font-medium block">{label}</label>
                <input
                  name={field}
                  type="text"
                  value={formData[field]}
                  onChange={handleInputChange}
                  className={`${
                    field === 'propertyId'
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-gray-100'
                  } border border-gray-300 text-gray-900 text-sm rounded-lg w-full py-2.5 px-4`}
                  placeholder={`Enter ${label}`}
                />
              </div>
            );
          })}

          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium">Upload Single Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleSingleImageChange}
              className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-100"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium">Upload Multiple Images</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleMultipleImagesChange}
              className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-100"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium">Upload PDF Document</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={handlePdfChange}
              className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-100"
            />
          </div>
          {userAddress === "0xe917e81c69bf15238c63abd45d1c335c2fc80bdd" ?( <button
            type="submit"
            className="w-full rounded-lg border border-transparent px-5 py-2 text-base font-medium bg-[#0c162c] text-white cursor-pointer transition-colors duration-200 hover:border-[#646cff]"
          >
            Register
          </button>):(
            <p className='font-semibold mt-4 text-red-600'>Connect With Admin Wallet</p>
          )}
         
        </form>
      )}
      {uploadStatus && <p className="mt-4 text-sm">{uploadStatus}</p>}
    </div>
  </div>
);

};

export default TokenizeProperty;
