import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGroup, useExpenses, useSettlements } from '../hooks/useFirestore';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';
import ExpenseList from '../components/ExpenseList';
import AddExpenseModal from '../components/AddExpenseModal';
import BalancesPanel from '../components/BalancesPanel';
import SettleUpModal from '../components/SettleUpModal';
import ShareButton from '../components/ShareButton';
import UserMenu from '../components/UserMenu';
import JoinGroupModal from '../components/JoinGroupModal';
import { formatCurrency, getTotalExpenses } from '../utils/balances';
import type { Expense } from '../types';

type Tab = 'expenses' | 'balances';

export default function GroupPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user, loading: authLoading } = useAuth();
  const { group, loading: groupLoading, error } = useGroup(groupId);
  const { expenses, loading: expensesLoading } = useExpenses(groupId);
  const { settlements, loading: settlementsLoading } = useSettlements(groupId);

  const [activeTab, setActiveTab] = useState<Tab>('expenses');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showSettleUp, setShowSettleUp] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Home link destination based on auth state
  const homeLink = user ? '/my-groups' : '/';

  // Get session storage key based on auth state (so it resets when user signs in/out)
  const getSessionKey = () => {
    const userSuffix = user ? user.uid : 'guest';
    return `ducount_joined_${groupId}_${userSuffix}`;
  };

  // Check if signed-in user has claimed a member
  const userHasClaim = user && group?.members.some(m => m.claimedBy === user.uid);
  const isCreator = user && group?.createdBy === user.uid;

  // Check if user needs to see the join modal
  useEffect(() => {
    if (authLoading || groupLoading || !group || !groupId) return;

    // Check if user has already dismissed/completed the join flow for this group
    const hasDismissed = sessionStorage.getItem(getSessionKey());

    if (hasDismissed) return;

    // If user is signed in
    if (user) {
      // Skip if user is the creator of this group
      if (group.createdBy === user.uid) return;
      
      // Skip if user has already claimed a member
      if (userHasClaim) return;
      
      // Otherwise, show the claim modal (skip welcome step since already signed in)
      setShowJoinModal(true);
    } else {
      // User is not signed in, show the join prompt
      setShowJoinModal(true);
    }
  }, [authLoading, groupLoading, group, groupId, user, userHasClaim]);

  const handleJoinModalClose = () => {
    setShowJoinModal(false);
    // Mark as completed for this session (user-specific key)
    if (groupId) {
      sessionStorage.setItem(getSessionKey(), 'true');
    }
  };

  const handleJoinModalSkip = () => {
    setShowJoinModal(false);
    // Mark as dismissed for this session (user-specific key)
    if (groupId) {
      sessionStorage.setItem(getSessionKey(), 'true');
    }
  };

  // Allow signed-in users to manually open the claim modal
  const handleClaimProfile = () => {
    setShowJoinModal(true);
  };

  if (groupLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading group...</p>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold text-white mb-2">Group Not Found</h1>
          <p className="text-gray-400 mb-8">
            This group doesn't exist or the link is invalid.
          </p>
          <Link to={user ? '/my-groups' : '/'} className="btn-primary">
            {user ? 'Back to My Groups' : 'Create a New Group'}
          </Link>
        </div>
      </div>
    );
  }

  const totalExpenses = getTotalExpenses(expenses);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex-none sticky top-0 z-40 bg-dark-950/80 backdrop-blur-lg border-b border-gray-800/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to={homeLink} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">{user ? 'My Groups' : 'Home'}</span>
            </Link>
            <Logo size="sm" />
            <div className="flex items-center gap-2">
              <ShareButton groupId={groupId!} />
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Group Info */}
      <div className="flex-none bg-gradient-to-b from-dark-800/50 to-transparent border-b border-gray-800/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">
            {group.name}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {group.members.length} members
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {expenses.length} expenses
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatCurrency(totalExpenses, group.currency)} total
            </span>
          </div>

          {/* Claim Profile Banner - shown for signed-in users who haven't claimed */}
          {user && !userHasClaim && !isCreator && (
            <button
              onClick={handleClaimProfile}
              className="mt-4 w-full flex items-center justify-between gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-left hover:bg-amber-500/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-200">Claim your profile</p>
                  <p className="text-xs text-amber-400/70">Select which member you are to track your expenses</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-none sticky top-[65px] z-30 bg-dark-950/90 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex border-b border-gray-800/50">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`flex-1 sm:flex-none px-6 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'expenses'
                  ? 'text-primary-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Expenses
              {activeTab === 'expenses' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('balances')}
              className={`flex-1 sm:flex-none px-6 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'balances'
                  ? 'text-primary-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Balances
              {activeTab === 'balances' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-6">
        {activeTab === 'expenses' ? (
          <ExpenseList
            expenses={expenses}
            members={group.members}
            currency={group.currency}
            loading={expensesLoading}
            onEdit={(expense) => setEditingExpense(expense)}
          />
        ) : (
          <BalancesPanel
            members={group.members}
            expenses={expenses}
            settlements={settlements}
            currency={group.currency}
            loading={expensesLoading || settlementsLoading}
            onSettleUp={() => setShowSettleUp(true)}
          />
        )}
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        {activeTab === 'balances' && (
          <button
            onClick={() => setShowSettleUp(true)}
            className="btn-secondary shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="hidden sm:inline">Settle Up</span>
          </button>
        )}
        <button
          onClick={() => setShowAddExpense(true)}
          className="btn-primary shadow-lg shadow-primary-500/30"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="hidden sm:inline">Add Expense</span>
        </button>
      </div>

      {/* Modals */}
      {(showAddExpense || editingExpense) && (
        <AddExpenseModal
          groupId={groupId!}
          members={group.members}
          currency={group.currency}
          expense={editingExpense || undefined}
          onClose={() => {
            setShowAddExpense(false);
            setEditingExpense(null);
          }}
        />
      )}

      {showSettleUp && (
        <SettleUpModal
          groupId={groupId!}
          members={group.members}
          expenses={expenses}
          settlements={settlements}
          currency={group.currency}
          onClose={() => setShowSettleUp(false)}
        />
      )}

      {showJoinModal && group && (
        <JoinGroupModal
          groupId={groupId!}
          groupName={group.name}
          members={group.members}
          onClose={handleJoinModalClose}
          onSkip={handleJoinModalSkip}
        />
      )}
    </div>
  );
}

