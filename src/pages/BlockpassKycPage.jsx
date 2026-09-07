import { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import AppLayout from '../components/layout/AppLayout';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

const PERKS = [
  {
    title: 'Trade compliant shares',
    text: 'Buy and sell tokenized property across the marketplace and order book.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
      />
    ),
  },
  {
    title: 'One verification, many assets',
    text: 'Your verified identity unlocks every offering on the platform.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
      />
    ),
  },
  {
    title: 'Privacy-first & fast',
    text: 'Documents are never stored on-chain. Typical reviews complete within minutes.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
      />
    ),
  },
];

const ShieldCheck = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
    />
  </svg>
);

const BlockpassKycPage = () => {
  const [refId, setRefId] = useState('');
  const { isConnected, connectWallet } = useWeb3();

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
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_440px]">
        {/* Left — explainer */}
        <div>
          <Badge tone="brand" className="mb-4">
            Compliance
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Verify once, <span className="text-gradient">trade everywhere</span>
          </h1>
          <p className="mt-2 max-w-xl text-[15px] leading-6 text-slate-500 dark:text-slate-400">
            TrueFraction is a compliant security-token platform. Completing KYC with Blockpass connects your wallet to
            your verified identity so you can buy, sell and redeem tokenized real estate.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {PERKS.map((perk) => (
              <Card key={perk.title} className="p-4">
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    {perk.icon}
                  </svg>
                </span>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{perk.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400 dark:text-slate-500">{perk.text}</p>
              </Card>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-2.5 text-xs text-slate-400 dark:text-slate-500">
            <ShieldCheck />
            <p>
              Powered by <span className="font-semibold text-slate-500 dark:text-slate-400">Blockpass Identity Lab</span> —
              no documents are ever stored on the blockchain.
            </p>
          </div>
        </div>

        {/* Right — start KYC */}
        <Card className="p-6 sm:p-7">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm">
                <ShieldCheck />
              </span>
              <div>
                <h2 className="text-[15px] font-bold text-slate-900 dark:text-white">Start verification</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500">Identity Verification</p>
              </div>
            </div>
            <Badge tone={isConnected ? 'success' : 'neutral'} dot>
              {isConnected ? 'Wallet ready' : 'No wallet'}
            </Badge>
          </div>

          {!isConnected && (
            <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-amber-200/70 bg-amber-50/70 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/20">
              <p className="text-[13px] text-amber-800 dark:text-amber-300">
                <span className="font-semibold">Tip:</span> connect your wallet first so we can map the result to it.
              </p>
              <Button size="sm" variant="secondary" onClick={connectWallet}>
                Connect
              </Button>
            </div>
          )}

          <Input
            label="Reference ID"
            type="text"
            placeholder="Your wallet or email"
            value={refId}
            onChange={(e) => setRefId(e.target.value)}
            hint="Use the same reference whenever you trade on the platform"
          />

          <Button id="blockpass-kyc-connect-button" size="lg" fullWidth className="mt-4" onClick={handleStartKYC}>
            <span className="flex items-center gap-2">
              Continue with Blockpass
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </span>
          </Button>

          <div className="mt-5 space-y-2.5 rounded-xl bg-slate-50 p-4 text-[13px] dark:bg-slate-950/50">
            <Step n={1} text="Enter a reference ID (email or wallet)" />
            <Step n={2} text="Complete the checks in the Blockpass widget" />
            <Step n={3} text="Start buying & selling property tokens" />
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};

const Step = ({ n, text }) => (
  <div className="flex items-center gap-3">
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-bold text-indigo-600 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:text-indigo-400 dark:ring-slate-700">
      {n}
    </span>
    <span className="text-slate-500 dark:text-slate-400">{text}</span>
  </div>
);

export default BlockpassKycPage;
