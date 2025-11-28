import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { claimMember, addAndClaimMember } from '../hooks/useFirestore';
import type { Member } from '../types';

interface JoinGroupModalProps {
  groupId: string;
  groupName: string;
  members: Member[];
  onClose: () => void;
  onSkip: () => void;
}

type Step = 'welcome' | 'claim' | 'add-new';

export default function JoinGroupModal({ groupId, groupName, members, onClose, onSkip }: JoinGroupModalProps) {
  const { user, signInWithGoogle, loading: authLoading } = useAuth();
  // Start at 'claim' step if user is already signed in, otherwise show welcome
  const [step, setStep] = useState<Step>(user ? 'claim' : 'welcome');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [newMemberName, setNewMemberName] = useState('');
  const [loading, setLoading] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState('');

  // Filter out already claimed members (except by current user)
  const availableMembers = members.filter(m => !m.claimedBy || m.claimedBy === user?.uid);
  const currentUserClaim = members.find(m => m.claimedBy === user?.uid);

  const handleSignIn = async () => {
    setSigningIn(true);
    setError('');
    try {
      await signInWithGoogle();
      setStep('claim');
    } catch (err) {
      setError('Failed to sign in. Please try again.');
    }
    setSigningIn(false);
  };

  const handleClaimMember = async () => {
    if (!selectedMemberId || !user) return;
    
    setLoading(true);
    setError('');
    try {
      await claimMember(groupId, members, selectedMemberId, user.uid);
      onClose();
    } catch (err) {
      console.error('Error claiming member:', err);
      setError('Failed to claim member. Please try again.');
    }
    setLoading(false);
  };

  const handleAddNewMember = async () => {
    if (!newMemberName.trim() || !user) return;
    
    // Check for duplicate names
    if (members.some(m => m.name.toLowerCase() === newMemberName.trim().toLowerCase())) {
      setError('A member with this name already exists');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await addAndClaimMember(groupId, members, newMemberName, user.uid);
      onClose();
    } catch (err) {
      console.error('Error adding member:', err);
      setError('Failed to add member. Please try again.');
    }
    setLoading(false);
  };

  // If user is already signed in and has claimed a member, don't show modal
  if (user && currentUserClaim) {
    onClose();
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onSkip}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md bg-dark-800 sm:rounded-2xl border border-gray-700/50 shadow-2xl max-h-[90vh] overflow-hidden rounded-t-2xl sm:rounded-2xl">
        {/* Welcome Step - Ask to sign in */}
        {step === 'welcome' && (
          <>
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="font-display text-xl font-semibold text-white mb-2">
                Join "{groupName}"
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                Sign in to claim your profile and track your expenses across devices.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleSignIn}
                  disabled={signingIn || authLoading}
                  className="w-full btn-primary justify-center"
                >
                  {signingIn ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Sign in with Google
                    </>
                  )}
                </button>
                <button
                  onClick={onSkip}
                  className="w-full btn-secondary justify-center"
                >
                  Continue without signing in
                </button>
              </div>

              <p className="mt-4 text-xs text-gray-500">
                You can still view and add expenses without signing in
              </p>
            </div>
          </>
        )}

        {/* Claim Step - Select which member you are */}
        {step === 'claim' && user && (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50">
              <h2 className="font-display text-lg font-semibold text-white">
                Who are you?
              </h2>
              <button
                onClick={onSkip}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-400 text-sm mb-4">
                Select your name from the list, or add yourself as a new member.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                {availableMembers.map(member => (
                  <button
                    key={member.id}
                    onClick={() => setSelectedMemberId(member.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors text-left ${
                      selectedMemberId === member.id
                        ? 'bg-primary-500/10 border-primary-500/50'
                        : 'bg-dark-900/50 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                        selectedMemberId === member.id
                          ? 'bg-primary-500 text-white'
                          : 'bg-dark-800 text-gray-400'
                      }`}>
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <span className={selectedMemberId === member.id ? 'text-white' : 'text-gray-300'}>
                        {member.name}
                      </span>
                    </div>
                    {selectedMemberId === member.id && (
                      <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep('add-new')}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add myself as new member
              </button>
            </div>

            <div className="px-6 py-4 border-t border-gray-700/50 flex gap-3">
              <button
                onClick={onSkip}
                className="btn-secondary flex-1"
              >
                Skip
              </button>
              <button
                onClick={handleClaimMember}
                disabled={!selectedMemberId || loading}
                className="btn-primary flex-1"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Claiming...
                  </>
                ) : (
                  "That's me!"
                )}
              </button>
            </div>
          </>
        )}

        {/* Add New Member Step */}
        {step === 'add-new' && user && (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStep('claim')}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="font-display text-lg font-semibold text-white">
                  Add yourself
                </h2>
              </div>
              <button
                onClick={onSkip}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-400 text-sm mb-4">
                Enter your name to join this group as a new member.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="label">Your name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Enter your name"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-700/50 flex gap-3">
              <button
                onClick={() => setStep('claim')}
                className="btn-secondary flex-1"
              >
                Back
              </button>
              <button
                onClick={handleAddNewMember}
                disabled={!newMemberName.trim() || loading}
                className="btn-primary flex-1"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Adding...
                  </>
                ) : (
                  'Join Group'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

