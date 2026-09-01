/**
 * Maps a thrown ethers/web3 error to a short, user-facing message.
 * Checks .reason, .message, and .data.message since ethers v5 populates
 * different fields depending on where the revert/rejection occurred.
 */
const getErrorText = (error) =>
  [error?.reason, error?.message, error?.data?.message].filter(Boolean).join(' ');

const KNOWN_ERRORS = [
  { match: 'user rejected', text: 'Transaction Rejected.' },
  { match: 'Identity is not verified', text: 'Identity Verification Required. Please complete KYC before continuing.' },
  { match: 'Transfer not possible', text: 'KYC Required' },
  { match: 'cannot estimate gas', text: 'Insufficient funds' },
  { match: 'insufficient funds', text: 'Insufficient funds' },
];

export const getContractErrorMessage = (error, fallback = 'Please try after some time') => {
  const text = getErrorText(error);
  const known = KNOWN_ERRORS.find(({ match }) => text.includes(match));
  return known?.text || fallback;
};

export default getContractErrorMessage;
