import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserGroups, deleteGroup } from '../hooks/useFirestore';
import Logo from '../components/Logo';
import UserMenu from '../components/UserMenu';

export default function MyGroupsPage() {
  const { user } = useAuth();
  const { groups, loading } = useUserGroups(user?.uid);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleCopyLink = async (groupId: string) => {
    const link = `${window.location.origin}${window.location.pathname}#/group/${groupId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(groupId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      prompt('Copy this link:', link);
    }
  };

  const handleDelete = async (groupId: string, groupName: string) => {
    if (!confirm(`Are you sure you want to delete "${groupName}"?\n\nThis will also delete all expenses and settlements in this group. This action cannot be undone.`)) {
      return;
    }

    setDeletingId(groupId);
    try {
      await deleteGroup(groupId, true);
    } catch (err) {
      console.error('Error deleting group:', err);
      alert('Failed to delete group');
    }
    setDeletingId(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex-none sticky top-0 z-40 bg-dark-950/80 backdrop-blur-lg border-b border-gray-800/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="w-8" />
            <Logo size="sm" />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Title */}
      <div className="flex-none bg-gradient-to-b from-primary-500/10 to-transparent border-b border-primary-500/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
                My Groups
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {groups.length} {groups.length === 1 ? 'group' : 'groups'}
              </p>
            </div>
            <Link to="/new" className="btn-primary">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="hidden sm:inline">New Group</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-6 w-48 bg-dark-900 rounded mb-2" />
                <div className="h-4 w-32 bg-dark-900 rounded" />
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary-500/10 flex items-center justify-center">
              <svg className="w-10 h-10 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="font-display text-xl font-semibold text-white mb-2">
              No groups yet
            </h3>
            <p className="text-gray-500 mb-6">
              Create your first group to start splitting expenses with friends
            </p>
            <Link to="/new" className="btn-primary">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Your First Group
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map(group => (
              <div
                key={group.id}
                className="card p-4 hover:border-primary-500/50 transition-all group/card"
              >
                <div className="flex items-start justify-between gap-4">
                  <Link
                    to={`/group/${group.id}`}
                    className="flex-1 min-w-0"
                  >
                    <h3 className="font-medium text-white group-hover/card:text-primary-400 transition-colors truncate">
                      {group.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                      <span>{group.members.length} members</span>
                      <span>{group.currency}</span>
                      <span>{formatDate(group.createdAt)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {group.members.slice(0, 4).map(m => (
                        <span
                          key={m.id}
                          className="px-2 py-0.5 bg-dark-900/50 rounded text-xs text-gray-400"
                        >
                          {m.name}
                        </span>
                      ))}
                      {group.members.length > 4 && (
                        <span className="px-2 py-0.5 bg-dark-900/50 rounded text-xs text-gray-500">
                          +{group.members.length - 4} more
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="flex items-center gap-1">
                    {/* Copy Link */}
                    <button
                      onClick={() => handleCopyLink(group.id)}
                      className={`p-2 transition-colors ${
                        copiedId === group.id 
                          ? 'text-green-400' 
                          : 'text-gray-500 hover:text-blue-400'
                      }`}
                      title={copiedId === group.id ? 'Copied!' : 'Copy link'}
                    >
                      {copiedId === group.id ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(group.id, group.name)}
                      disabled={deletingId === group.id}
                      className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                      title="Delete group"
                    >
                      {deletingId === group.id ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                    {/* Open Arrow */}
                    <Link
                      to={`/group/${group.id}`}
                      className="p-2 text-gray-600 hover:text-primary-400 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
