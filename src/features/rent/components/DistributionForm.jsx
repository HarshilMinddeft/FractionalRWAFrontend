import { useMemo, useState } from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Textarea from '../../../components/ui/Textarea';
import { formatMonth, recentMonths } from '../utils/format';

const currentMonth = () => new Date().toISOString().slice(0, 7);

/**
 * New monthly distribution: property, month, rent, issuer toggle. Submitting
 * asks the backend to calculate the split and save it as a draft.
 */
const DistributionForm = ({ properties, allowCurrentMonth, feeBps, symbol, onCreate, creating }) => {
  const months = useMemo(() => recentMonths(12), []);
  const thisMonth = currentMonth();

  const [tokenId, setTokenId] = useState('');
  const [month, setMonth] = useState(() => months.find((m) => m < thisMonth) ?? months[0]);
  const [rent, setRent] = useState('');
  const [excludeIssuer, setExcludeIssuer] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const property = properties.find((p) => p.id === tokenId);
  const monthInProgress = month === thisMonth;

  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (!tokenId) return setError('Choose a property.');
    if (!/^\d+(\.\d{1,6})?$/.test(rent) || Number(rent) <= 0) return setError('Enter the rent as a positive amount, e.g. 3000 or 3000.50.');
    onCreate({ tokenId, month, rent, excludeIssuer, note: note.trim() || undefined });
  };

  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">New monthly distribution</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Enter the property’s full rent for the month. Each share earns the same amount per day held, so holders who
        bought or sold mid-month are paid only for their days — nothing is sent for days before launch.
      </p>

      <form onSubmit={submit} className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Select label="Property" value={tokenId} onChange={(e) => setTokenId(e.target.value)}>
          <option value="">Select a property…</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              #{p.id} · {p.propertyName || 'Unnamed property'} · {p.holderCount} holder{p.holderCount === 1 ? '' : 's'}
              {p.lastDistributedMonth ? ` · last paid ${p.lastDistributedMonth}` : ''}
            </option>
          ))}
        </Select>

        <Select label="Month (UTC)" value={month} onChange={(e) => setMonth(e.target.value)}>
          {months.map((m) => (
            <option key={m} value={m} disabled={m === thisMonth && !allowCurrentMonth}>
              {formatMonth(m)}
              {m === thisMonth ? (allowCurrentMonth ? ' — in progress (testnet)' : ' — in progress') : ''}
            </option>
          ))}
        </Select>

        <Input
          label={`Rent for the month (${symbol})`}
          prefix="$"
          inputMode="decimal"
          placeholder="3000"
          value={rent}
          onChange={(e) => setRent(e.target.value.trim())}
          hint={
            feeBps > 0
              ? `A ${(feeBps / 100).toFixed(2)}% platform fee is taken from what holders receive.`
              : 'The platform rent fee is currently 0%.'
          }
        />

        <div className="flex flex-col justify-center gap-1.5">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 cursor-pointer accent-indigo-600"
              checked={excludeIssuer}
              onChange={(e) => setExcludeIssuer(e.target.checked)}
            />
            <span>
              <span className="block text-[13px] font-medium text-slate-700 dark:text-slate-200">Exclude the issuer</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                Don’t pay rent on shares the issuer still holds, including unsold listing inventory. Investors’
                amounts don’t change.
              </span>
            </span>
          </label>
        </div>

        <div className="md:col-span-2">
          <Textarea label="Note (optional)" rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Includes late payment from tenant" />
        </div>

        {monthInProgress && allowCurrentMonth && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 md:col-span-2 dark:bg-amber-500/10 dark:text-amber-300">
            Testnet mode: {formatMonth(month)} hasn’t ended, so holders are paid only up to the latest indexed block.
            This month can’t be distributed again once it ends.
          </p>
        )}
        {property && property.redeemed && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 md:col-span-2 dark:bg-amber-500/10 dark:text-amber-300">
            This property has been redeemed; only the days before redemption can earn rent.
          </p>
        )}
        {error && <p className="text-sm font-medium text-red-500 md:col-span-2">{error}</p>}

        <div className="md:col-span-2">
          <Button type="submit" loading={creating}>
            {creating ? 'Calculating…' : 'Calculate distribution'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default DistributionForm;
