import { useState } from 'react';
import type { Member, Expense, Settlement } from '../types';
import { addSettlement } from '../hooks/useFirestore';
import { calculateMemberBalances, simplifyDebts, formatCurrency } from '../utils/balances';

interface SettleUpModalProps {
  groupId: string;
  members: Member[];
  expenses: Expense[];
  settlements: Settlement[];
  currency: string;
  onClose: () => void;
}

export default function SettleUpModal({
  groupId,
  members,
  expenses,
  settlements,
  currency,
  onClose,
}: SettleUpModalProps) {
  const memberBalances = calculateMemberBalances(members, expenses, settlements);
  const suggestedDebts = simplifyDebts(memberBalances);

  const [from, setFrom] = useState(suggestedDebts[0]?.from || members[0]?.id || '');
  const [to, setTo] = useState(suggestedDebts[0]?.to || members[1]?.id || '');
  const [amount, setAmount] = useState(suggestedDebts[0]?.amount.toString() || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getMemberName = (memberId: string) => {
    return members.find(m => m.id === memberId)?.name || 'Unknown';
  };

  const handleQuickSelect = (debt: { from: string; to: string; amount: number }) => {
    setFrom(debt.from);
    setTo(debt.to);
    setAmount(debt.amount.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);

    if (!from || !to) {
      setError('Please select both members');
      return;
    }

    if (from === to) {
      setError('Cannot settle with same member');
      return;
    }

    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await addSettlement({
        groupId,
        from,
        to,
        amount: numAmount,
        date,
      });
      onClose();
    } catch (err) {
      console.error('Error adding settlement:', err);
      setError('Failed to record settlement. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md bg-dark-800 sm:rounded-2xl border border-gray-700/50 shadow-2xl max-h-[90vh] overflow-hidden rounded-t-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50">
          <h2 className="font-display text-lg font-semibold text-white">Record Settlement</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-130px)]">
          <div className="p-6 space-y-5">
            {/* Quick Select */}
            {suggestedDebts.length > 0 && (
              <div>
                <label className="label">Suggested settlements</label>
                <div className="space-y-2">
                  {suggestedDebts.map((debt, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleQuickSelect(debt)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors ${
                        from === debt.from && to === debt.to
                          ? 'bg-primary-500/10 border-primary-500/50'
                          : 'bg-dark-900/50 border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400">{getMemberName(debt.from)}</span>
                        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                        <span className="text-gray-400">{getMemberName(debt.to)}</span>
                      </div>
                      <span className="font-medium text-primary-400">
                        {formatCurrency(debt.amount, currency)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            {suggestedDebts.length > 0 && (
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-800" />
                <span className="text-xs text-gray-600">or custom</span>
                <div className="flex-1 h-px bg-gray-800" />
              </div>
            )}

            {/* From */}
            <div>
              <label className="label">Who paid?</label>
              <select
                className="input"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* To */}
            <div>
              <label className="label">Who received?</label>
              <select
                className="input"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="label">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  {currency}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input pl-14"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-700/50 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Recording...
                </>
              ) : (
                <>
                  Record Settlement
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

