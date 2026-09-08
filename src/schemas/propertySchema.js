import { ethers } from 'ethers';
import { z } from 'zod';

/**
 * Property Size / Price are collected as free text (e.g. "4151 Sqft",
 * "$450,000") because that's how the data is naturally written, but
 * `PropertyNFT.mintProperty` needs a plain positive uint256 for each.
 * Extracts the leading number so both the validator and the mint call
 * agree on what the field means.
 */
export const parseLeadingNumber = (value) => {
  const match = String(value).replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : NaN;
};

const requiredText = (fieldLabel) => z.string().trim().min(1, `${fieldLabel} is required.`);

const numericText = (fieldLabel) =>
  requiredText(fieldLabel)
    .refine((value) => !Number.isNaN(parseLeadingNumber(value)), `${fieldLabel} must contain a number.`)
    .refine((value) => parseLeadingNumber(value) > 0, `${fieldLabel} must be greater than 0.`);

const walletAddress = (fieldLabel) =>
  requiredText(fieldLabel).refine((value) => ethers.utils.isAddress(value), 'Enter a valid wallet address.');

/**
 * Validates the Tokenize Property form fields before any upload or
 * on-chain call is made. `singleImage` gates the mint step in
 * TokenizePropertyPage, so it's required here too — submitting without it
 * would otherwise silently skip minting while still saving a listing.
 */
export const tokenizePropertySchema = z.object({
  name: requiredText('Property Name'),
  propertyPrice: numericText('Property Price'),
  propertySize: numericText('Property Size'),
  propertyOwnerWallet: walletAddress('Property Owner Wallet'),
  features: requiredText('Features'),
  offering: requiredText('Offering'),
  details: requiredText('Details'),
  management: requiredText('Managed By'),
  location: requiredText('Location'),
  singleImage: z
    .instanceof(File, { message: 'Upload a primary property image.' })
    .refine((file) => file.size > 0, 'Upload a primary property image.'),
});
