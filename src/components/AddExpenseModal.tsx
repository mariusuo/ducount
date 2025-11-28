import { useState, useEffect } from 'react';
import type { Member, Split, Expense } from '../types';
import { addExpense, updateExpense } from '../hooks/useFirestore';
import { formatCurrency } from '../utils/balances';

interface AddExpenseModalProps {
  groupId: string;
  members: Member[];
  currency: string;
  onClose: () => void;
  expense?: Expense; // If provided, we're in edit mode
}

type SplitType = 'equal' | 'custom';

export default function AddExpenseModal({ groupId, members, currency, onClose, expense }: AddExpenseModalProps) {
  const isEditMode = !!expense;
  
  const [description, setDescription] = useState(expense?.description || '');
  const [amount, setAmount] = useState(expense?.amount?.toString() || '');
  const [paidBy, setPaidBy] = useState(expense?.paidBy || members[0]?.id || '');
  const [date, setDate] = useState(expense?.date?.split('T')[0] || new Date().toISOString().split('T')[0]);
  
  // Determine initial split type based on expense data
  const getInitialSplitType = (): SplitType => {
    if (!expense) return 'equal';
    // Check if all split amounts are equal
    const amounts = expense.splitBetween.map(s => s.amount);
    const allEqual = amounts.every(a => Math.abs(a - amounts[0]) < 0.01);
    return allEqual ? 'equal' : 'custom';
  };
  
  const [splitType, setSplitType] = useState<SplitType>(getInitialSplitType());
  
  // Initialize selected members from expense or all members
  const getInitialSelectedMembers = (): Set<string> => {
    if (expense) {
      return new Set(expense.splitBetween.map(s => s.memberId));
    }
    return new Set(members.map(m => m.id));
  };
  
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(getInitialSelectedMembers);
  
  // Initialize custom amounts from expense
  const getInitialCustomAmounts = (): Record<string, string> => {
    if (!expense) return {};
    const amounts: Record<string, string> = {};
    expense.splitBetween.forEach(s => {
      amounts[s.memberId] = s.amount.toString();
    });
    return amounts;
  };
  
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>(getInitialCustomAmounts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const numAmount = parseFloat(amount) || 0;
  const equalSplit = selectedMembers.size > 0 ? numAmount / selectedMembers.size : 0;

  const toggleMember = (memberId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      if (newSelected.size > 1) {
        newSelected.delete(memberId);
      }
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
  };

  const updateCustomAmount = (memberId: string, value: string) => {
    setCustomAmounts(prev => ({
      ...prev,
      [memberId]: value,
    }));
  };

  const getCustomTotal = () => {
    return Object.entries(customAmounts)
      .filter(([id]) => selectedMembers.has(id))
      .reduce((sum, [, val]) => sum + (parseFloat(val) || 0), 0);
  };

  const customTotal = getCustomTotal();
  const remainingAmount = numAmount - customTotal;
  const isOverAssigned = remainingAmount < -0.01;
  const isUnderAssigned = remainingAmount > 0.01;
  const isExactMatch = Math.abs(remainingAmount) <= 0.01;

  // Split remaining amount equally among members with 0 or empty amounts
  const splitRemainingEqually = () => {
    if (remainingAmount <= 0) return;
    
    // Find members that are selected but have 0 or empty amounts
    const membersToFill = Array.from(selectedMembers).filter(id => {
      const amount = parseFloat(customAmounts[id] || '0');
      return amount === 0 || !customAmounts[id];
    });
    
    if (membersToFill.length === 0) {
      // If all have amounts, distribute to all selected members proportionally
      const perMember = remainingAmount / selectedMembers.size;
      const newAmounts: Record<string, string> = { ...customAmounts };
      selectedMembers.forEach(id => {
        const current = parseFloat(customAmounts[id] || '0');
        newAmounts[id] = (current + perMember).toFixed(2);
      });
      setCustomAmounts(newAmounts);
    } else {
      // Distribute remaining to members with 0
      const perMember = remainingAmount / membersToFill.length;
      const newAmounts: Record<string, string> = { ...customAmounts };
      membersToFill.forEach(id => {
        newAmounts[id] = perMember.toFixed(2);
      });
      setCustomAmounts(newAmounts);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }

    if (numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (selectedMembers.size === 0) {
      setError('Please select at least one member');
      return;
    }

    let splitBetween: Split[];

    if (splitType === 'equal') {
      splitBetween = Array.from(selectedMembers).map(memberId => ({
        memberId,
        amount: Math.round(equalSplit * 100) / 100,
      }));
    } else {
      const customTotal = getCustomTotal();
      if (Math.abs(customTotal - numAmount) > 0.01) {
        setError(`Split amounts (${formatCurrency(customTotal, currency)}) don't match total (${formatCurrency(numAmount, currency)})`);
        return;
      }

      splitBetween = Array.from(selectedMembers)
        .filter(id => parseFloat(customAmounts[id] || '0') > 0)
        .map(memberId => ({
          memberId,
          amount: parseFloat(customAmounts[memberId] || '0'),
        }));
    }

    setLoading(true);
    try {
      if (isEditMode && expense) {
        // Update existing expense
        await updateExpense(expense.id, {
          description: description.trim(),
          amount: numAmount,
          paidBy,
          splitBetween,
          date,
        });
      } else {
        // Add new expense
        await addExpense({
          groupId,
          description: description.trim(),
          amount: numAmount,
          paidBy,
          splitBetween,
          date,
        });
      }
      onClose();
    } catch (err) {
      console.error(`Error ${isEditMode ? 'updating' : 'adding'} expense:`, err);
      setError(`Failed to ${isEditMode ? 'update' : 'add'} expense. Please try again.`);
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
          <h2 className="font-display text-lg font-semibold text-white">
            {isEditMode ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-130px)]">
          <div className="p-6 space-y-5">
            {/* Description */}
            <div>
              <label className="label">Description</label>
              <input
                type="text"
                className="input"
                placeholder="What was this expense for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                autoFocus
              />
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

            {/* Date & Paid By Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  className="input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Paid by</label>
                <select
                  className="input"
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Split Type */}
            <div>
              <label className="label">Split</label>
              <div className="flex bg-dark-900 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setSplitType('equal')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    splitType === 'equal'
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Equal
                </button>
                <button
                  type="button"
                  onClick={() => setSplitType('custom')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    splitType === 'custom'
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Custom
                </button>
              </div>
            </div>

            {/* Members Selection */}
            <div>
              <label className="label">
                {splitType === 'equal' ? 'Split between' : 'Custom amounts'}
              </label>
              <div className="space-y-2">
                {members.map(member => (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                      selectedMembers.has(member.id)
                        ? 'bg-dark-900/50 border-primary-500/30'
                        : 'bg-dark-900/30 border-gray-800'
                    }`}
                  >
                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={selectedMembers.has(member.id)}
                        onChange={() => toggleMember(member.id)}
                        className="w-4 h-4 rounded border-gray-600 text-primary-500 focus:ring-primary-500 focus:ring-offset-0 bg-dark-900"
                      />
                      <span className={selectedMembers.has(member.id) ? 'text-white' : 'text-gray-500'}>
                        {member.name}
                      </span>
                    </label>
                    
                    {splitType === 'equal' ? (
                      selectedMembers.has(member.id) && numAmount > 0 && (
                        <span className="text-sm text-gray-400">
                          {formatCurrency(equalSplit, currency)}
                        </span>
                      )
                    ) : (
                      selectedMembers.has(member.id) && (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-24 px-3 py-1.5 bg-dark-800 border border-gray-700 rounded-lg text-right text-sm text-white focus:outline-none focus:border-primary-500"
                          placeholder="0.00"
                          value={customAmounts[member.id] || ''}
                          onChange={(e) => updateCustomAmount(member.id, e.target.value)}
                        />
                      )
                    )}
                  </div>
                ))}
              </div>
              
              {/* Custom split status */}
              {splitType === 'custom' && numAmount > 0 && (
                <div className="mt-4 space-y-3">
                  {/* Status card */}
                  <div className={`p-3 rounded-xl border ${
                    isExactMatch 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : isOverAssigned 
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-amber-500/10 border-amber-500/30'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isExactMatch ? (
                          <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : isOverAssigned ? (
                          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        <span className={`text-sm font-medium ${
                          isExactMatch ? 'text-green-300' : isOverAssigned ? 'text-red-300' : 'text-amber-300'
                        }`}>
                          {isExactMatch 
                            ? 'Perfectly split!' 
                            : isOverAssigned 
                              ? `Over by ${formatCurrency(Math.abs(remainingAmount), currency)}`
                              : `${formatCurrency(remainingAmount, currency)} remaining`
                          }
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatCurrency(customTotal, currency)} / {formatCurrency(numAmount, currency)}
                      </span>
                    </div>
                  </div>

                  {/* Split remaining button */}
                  {isUnderAssigned && (
                    <button
                      type="button"
                      onClick={splitRemainingEqually}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/30 rounded-lg text-primary-400 text-sm font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Split remaining equally
                    </button>
                  )}
                </div>
              )}
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
              disabled={loading || (splitType === 'custom' && isOverAssigned)}
              className="btn-primary flex-1"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {isEditMode ? 'Saving...' : 'Adding...'}
                </>
              ) : (
                isEditMode ? 'Save Changes' : 'Add Expense'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
