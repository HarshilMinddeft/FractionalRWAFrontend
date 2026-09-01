import { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

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
    <AppLayout>
      <PageHeader
        title="Identity Verification"
        description="Complete KYC to unlock buying and selling."
        icon={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        }
      />
      <Card className="mx-auto max-w-md space-y-4 p-6 sm:p-8">
        <Input
          label="Wallet or Email"
          type="text"
          placeholder="Enter your wallet or email"
          value={refId}
          onChange={(e) => setRefId(e.target.value)}
        />
        <Button id="blockpass-kyc-connect-button" fullWidth onClick={handleStartKYC}>
          Connect with Blockpass
        </Button>
      </Card>
    </AppLayout>
  );
};

export default BlockpassKycPage;
