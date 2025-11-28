import type { Member, Expense, Settlement } from '../types';
import { calculateMemberBalances, simplifyDebts, formatCurrency } from '../utils/balances';
import { deleteSettlement } from '../hooks/useFirestore';
import { useState } from 'react';

interface BalancesPanelProps {
  members: Member[];
  expenses: Expense[];
  settlements: Settlement[];
  currency: string;
  loading: boolean;
  onSettleUp: () => void;
}

export default function BalancesPanel({
  members,
  expenses,
  settlements,
  currency,
  loading,
  onSettleUp,
}: BalancesPanelProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getMemberName = (memberId: string) => {
    return members.find(m => m.id === memberId)?.name || 'Unknown';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDeleteSettlement = async (settlementId: string) => {
    if (confirm('Are you sure you want to delete this settlement?')) {
      setDeletingId(settlementId);
      try {
        await deleteSettlement(settlementId);
      } catch (err) {
        console.error('Error deleting settlement:', err);
        alert('Failed to delete settlement');
      }
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="card p-6 animate-pulse">
          <div className="h-6 w-32 bg-dark-900 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-dark-900 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const memberBalances = calculateMemberBalances(members, expenses, settlements);
  const simplifiedDebts = simplifyDebts(memberBalances);

  // Check if all settled
  const isAllSettled = simplifiedDebts.length === 0;

  return (
    <div className="space-y-6">
      {/* Individual Balances */}
      <div className="card p-6">
        <h3 className="font-display font-semibold text-white mb-4">Member Balances</h3>
        <div className="space-y-3">
          {memberBalances
            .sort((a, b) => b.balance - a.balance)
            .map(({ memberId, balance }) => {
              const member = members.find(m => m.id === memberId);
              if (!member) return null;

              return (
                <div
                  key={memberId}
                  className="flex items-center justify-between p-3 bg-dark-900/50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                      balance > 0.01
                        ? 'bg-primary-500/20 text-primary-400'
                        : balance < -0.01
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-gray-700/50 text-gray-400'
                    }`}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white">{member.name}</span>
                  </div>
                  <span className={`font-medium ${
                    balance > 0.01
                      ? 'text-primary-400'
                      : balance < -0.01
                      ? 'text-red-400'
                      : 'text-gray-500'
                  }`}>
                    {balance > 0.01 && '+'}
                    {formatCurrency(balance, currency)}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Suggested Settlements */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-white">Who Owes Whom</h3>
          {!isAllSettled && (
            <span className="text-xs text-gray-500">Simplified debts</span>
          )}
        </div>

        {isAllSettled ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 className="font-medium text-white mb-1">All settled up!</h4>
            <p className="text-gray-500 text-sm">Everyone is even</p>
          </div>
        ) : (
          <div className="space-y-3">
            {simplifiedDebts.map((debt, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-dark-900/80 to-dark-900/50 rounded-xl border border-gray-800/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-xs font-medium text-red-400">
                      {getMemberName(debt.from).charAt(0).toUpperCase()}
                    </div>
                    <svg className="w-6 h-6 text-gray-600 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-xs font-medium text-primary-400">
                      {getMemberName(debt.to).charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="text-red-400">{getMemberName(debt.from)}</span>
                    <span className="text-gray-500"> owes </span>
                    <span className="text-primary-400">{getMemberName(debt.to)}</span>
                  </div>
                </div>
                <span className="font-semibold text-white">
                  {formatCurrency(debt.amount, currency)}
                </span>
              </div>
            ))}

            <button
              onClick={onSettleUp}
              className="w-full mt-4 btn-primary"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Record a Settlement
            </button>
          </div>
        )}
      </div>

      {/* Settlement History */}
      {settlements.length > 0 && (
        <div className="card p-6">
          <h3 className="font-display font-semibold text-white mb-4">Settlement History</h3>
          <div className="space-y-2">
            {settlements.map(settlement => (
              <div
                key={settlement.id}
                className="flex items-center justify-between p-3 bg-dark-900/30 rounded-xl group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-white">
                      <span className="text-gray-400">{getMemberName(settlement.from)}</span>
                      {' → '}
                      <span className="text-gray-400">{getMemberName(settlement.to)}</span>
                    </p>
                    <p className="text-xs text-gray-600">{formatDate(settlement.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-primary-400">
                    {formatCurrency(settlement.amount, currency)}
                  </span>
                  <button
                    onClick={() => handleDeleteSettlement(settlement.id)}
                    disabled={deletingId === settlement.id}
                    className="p-1.5 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    {deletingId === settlement.id ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

