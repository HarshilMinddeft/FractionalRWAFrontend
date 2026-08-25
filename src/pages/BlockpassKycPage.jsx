import React, { useState } from 'react';

const BlockpassKycPage = () => {
  const [refId, setRefId] = useState('');

  const handleStartKYC = () => {
    if (!refId) {
      return alert('Please enter a reference ID (e.g., wallet or email)');
    }

    if (!window.BlockpassKYCConnect) {
      return alert('Blockpass script not loaded yet');
    }

    const blockpass = new window.BlockpassKYCConnect('truefractionkyc_7bf80', {
      refId,
      elementId: 'blockpass-kyc-connect-button',
      mainColor: '800080',
    });

    blockpass.startKYCConnect();
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Connect with Blockpass KYC</h2>
      <input
        type="text"
        placeholder="Enter your Wallet or Email"
        value={refId}
        onChange={(e) => setRefId(e.target.value)}
        style={{ marginBottom: 10, padding: 8, width: '100%' }}
      />
      <button
        id="blockpass-kyc-connect-button"
        onClick={handleStartKYC}
        style={{ padding: '10px 20px', cursor: 'pointer' }}
      >
        Connect with Blockpass
      </button>
    </div>
  );
};

export default BlockpassKycPage;
