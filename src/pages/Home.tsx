import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGroup } from '../hooks/useFirestore';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';
import UserMenu from '../components/UserMenu';

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [groupName, setGroupName] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [members, setMembers] = useState<string[]>(['', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [createdGroupId, setCreatedGroupId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const addMember = () => {
    setMembers([...members, '']);
  };

  const updateMember = (index: number, value: string) => {
    const newMembers = [...members];
    newMembers[index] = value;
    setMembers(newMembers);
  };

  const removeMember = (index: number) => {
    if (members.length > 2) {
      setMembers(members.filter((_, i) => i !== index));
    }
  };

  const getShareUrl = (groupId: string) => {
    return `${window.location.origin}${window.location.pathname}#/group/${groupId}`;
  };

  const handleCopyLink = async () => {
    if (!createdGroupId) return;
    
    try {
      await navigator.clipboard.writeText(getShareUrl(createdGroupId));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      prompt('Copy this link:', getShareUrl(createdGroupId));
    }
  };

  const handleNativeShare = async () => {
    if (!createdGroupId) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join "${groupName}" on DuCount`,
          text: 'Split expenses with me!',
          url: getShareUrl(createdGroupId),
        });
      } catch (err) {
        // User cancelled or share failed
        if ((err as Error).name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleContinueToGroup = () => {
    if (createdGroupId) {
      navigate(`/group/${createdGroupId}`);
    }
  };

  const handleSubmit = async () => {
    setError('');
    
    // Validation
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }

    const validMembers = members.filter(m => m.trim());
    if (validMembers.length < 2) {
      setError('Please add at least 2 members');
      return;
    }

    // Check for duplicates
    const uniqueMembers = new Set(validMembers.map(m => m.toLowerCase().trim()));
    if (uniqueMembers.size !== validMembers.length) {
      setError('Member names must be unique');
      return;
    }

    setLoading(true);
    try {
      // Pass user ID if signed in, to track group ownership
      const groupId = await createGroup(groupName, currency, validMembers, user?.uid);
      setCreatedGroupId(groupId);
      setShowShareModal(true);
      setLoading(false);
    } catch (err) {
      console.error('Error creating group:', err);
      setError('Failed to create group. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <nav className="flex-none px-4 sm:px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="w-8" /> {/* Spacer for centering */}
          <Logo size="sm" />
          <UserMenu />
        </div>
      </nav>

      {/* Hero Section */}
      <header className="flex-none px-4 sm:px-6 pt-4 pb-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
            Split expenses <span className="text-primary-400">effortlessly</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-md mx-auto">
            No sign-up required. Create a group, share the link, 
            and start tracking shared expenses in seconds.
          </p>
        </div>
      </header>

      {/* Main Form */}
      <main className="flex-1 px-4 sm:px-6 py-8">
        <div className="max-w-md mx-auto">
          <div className="card p-6 sm:p-8">
            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      step >= s
                        ? 'bg-primary-500 text-white'
                        : 'bg-dark-900 text-gray-500'
                    }`}
                  >
                    {s}
                  </div>
                  {s < 2 && (
                    <div
                      className={`w-12 h-0.5 ${
                        step > s ? 'bg-primary-500' : 'bg-dark-900'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {step === 1 ? (
              /* Step 1: Group Info */
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-xl font-semibold text-white mb-1">
                    Create your group
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Give your group a name and pick a currency
                  </p>
                </div>

                <div>
                  <label className="label">Group Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Weekend Trip to Paris"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="label">Currency</label>
                  <select
                    className="input"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.symbol} {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  className="btn-primary w-full"
                  onClick={() => setStep(2)}
                  disabled={!groupName.trim()}
                >
                  Continue
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            ) : (
              /* Step 2: Members */
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-xl font-semibold text-white mb-1">
                    Add group members
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Who's splitting the expenses?
                  </p>
                </div>

                <div className="space-y-3">
                  {members.map((member, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        className="input flex-1"
                        placeholder={`Member ${index + 1}`}
                        value={member}
                        onChange={(e) => updateMember(index, e.target.value)}
                        autoFocus={index === 0}
                      />
                      {members.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeMember(index)}
                          className="p-3 text-gray-500 hover:text-red-400 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addMember}
                  className="w-full py-2.5 border-2 border-dashed border-gray-700 rounded-xl text-gray-400 hover:text-primary-400 hover:border-primary-500/50 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add another member
                </button>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    className="btn-secondary flex-1"
                    onClick={() => setStep(1)}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>
                  <button
                    className="btn-primary flex-1"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Creating...
                      </>
                    ) : (
                      <>
                        Create Group
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Features */}
          <div className="mt-12 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-sm text-gray-400">No sign-up</p>
            </div>
            <div>
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <p className="text-sm text-gray-400">Share link</p>
            </div>
            <div>
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm text-gray-400">Smart splits</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex-none px-4 sm:px-6 py-6 text-center text-gray-600 text-sm">
        <p>Free & open-source expense splitter</p>
      </footer>

      {/* Share Modal */}
      {showShareModal && createdGroupId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <div className="relative w-full max-w-md bg-dark-800 rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-primary-500/20 to-primary-600/10 px-6 py-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="font-display text-2xl font-bold text-white mb-2">
                Group Created! 🎉
              </h2>
              <p className="text-gray-400">
                Share the link with your friends to start splitting expenses
              </p>
            </div>

            {/* Content */}
            <div className="px-6 py-6 space-y-4">
              {/* Link Display */}
              <div>
                <label className="label">Share this link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getShareUrl(createdGroupId)}
                    className="input flex-1 text-sm bg-dark-900 cursor-text select-all"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      copied
                        ? 'bg-primary-500 text-white'
                        : 'bg-dark-900 text-gray-300 hover:bg-dark-800'
                    }`}
                  >
                    {copied ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Share Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleNativeShare}
                  className="btn-secondary flex-1"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </button>
                <button
                  onClick={handleContinueToGroup}
                  className="btn-primary flex-1"
                >
                  Continue to Group
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Reminder */}
              <p className="text-center text-gray-500 text-xs">
                💡 Tip: Bookmark or save this link - it's how you access your group!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
