import { useState } from 'react';
import type { Expense, Member } from '../types';
import { formatCurrency } from '../utils/balances';
import { deleteExpense } from '../hooks/useFirestore';

interface ExpenseListProps {
  expenses: Expense[];
  members: Member[];
  currency: string;
  loading: boolean;
  onEdit?: (expense: Expense) => void;
}

export default function ExpenseList({ expenses, members, currency, loading, onEdit }: ExpenseListProps) {
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

  const handleDelete = async (expenseId: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      setDeletingId(expenseId);
      try {
        await deleteExpense(expenseId);
      } catch (err) {
        console.error('Error deleting expense:', err);
        alert('Failed to delete expense');
      }
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="card p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-dark-900" />
              <div className="flex-1">
                <div className="h-5 w-32 bg-dark-900 rounded mb-2" />
                <div className="h-4 w-24 bg-dark-900 rounded" />
              </div>
              <div className="h-6 w-16 bg-dark-900 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="card p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-dark-900 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="font-medium text-white mb-1">No expenses yet</h3>
        <p className="text-gray-500 text-sm">
          Add your first expense to start tracking
        </p>
      </div>
    );
  }

  // Group expenses by date
  const groupedExpenses: Record<string, Expense[]> = {};
  expenses.forEach(expense => {
    const dateKey = expense.date.split('T')[0];
    if (!groupedExpenses[dateKey]) {
      groupedExpenses[dateKey] = [];
    }
    groupedExpenses[dateKey].push(expense);
  });

  const sortedDates = Object.keys(groupedExpenses).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="space-y-6">
      {sortedDates.map(date => (
        <div key={date}>
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 px-1">
            {formatDate(date)}
          </h3>
          <div className="space-y-2">
            {groupedExpenses[date].map(expense => (
              <div
                key={expense.id}
                className="card p-4 group hover:border-gray-700/70 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white truncate">
                      {expense.description}
                    </h4>
                    <p className="text-sm text-gray-500">
                      Paid by <span className="text-gray-400">{getMemberName(expense.paidBy)}</span>
                    </p>
                  </div>

                  {/* Amount & Actions */}
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-white mr-2">
                      {formatCurrency(expense.amount, currency)}
                    </span>
                    {/* Edit Button */}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(expense)}
                        className="p-2 text-gray-600 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all"
                        title="Edit expense"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(expense.id)}
                      disabled={deletingId === expense.id}
                      className="p-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete expense"
                    >
                      {deletingId === expense.id ? (
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

                {/* Split Details */}
                <div className="mt-3 pt-3 border-t border-gray-800/50">
                  <div className="flex flex-wrap gap-2">
                    {expense.splitBetween.map(split => (
                      <span
                        key={split.memberId}
                        className="inline-flex items-center gap-1.5 px-2 py-1 bg-dark-900/50 rounded-lg text-xs"
                      >
                        <span className="text-gray-400">{getMemberName(split.memberId)}</span>
                        <span className="text-gray-500">
                          {formatCurrency(split.amount, currency)}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
