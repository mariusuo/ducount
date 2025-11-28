import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, query } from 'firebase/firestore';
import { db } from '../firebase';
import type { Group } from '../types';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';
import UserMenu from '../components/UserMenu';
import { Link } from 'react-router-dom';

export default function AdminPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  
  // Home link destination based on auth state
  const homeLink = user ? '/my-groups' : '/';
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'groups'));
      const snapshot = await getDocs(q);
      const groupList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Group[];
      // Sort by createdAt descending
      groupList.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setGroups(groupList);
    } catch (err) {
      console.error('Error fetching groups:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleDelete = async (groupId: string, groupName: string) => {
    if (!confirm(`Are you sure you want to delete "${groupName}"? This will NOT delete associated expenses and settlements.`)) {
      return;
    }

    setDeletingId(groupId);
    try {
      await deleteDoc(doc(db, 'groups', groupId));
      setGroups(groups.filter(g => g.id !== groupId));
    } catch (err) {
      console.error('Error deleting group:', err);
      alert('Failed to delete group');
    }
    setDeletingId(null);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-dark-950/80 backdrop-blur-lg border-b border-gray-800/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to={homeLink} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">{user ? 'My Groups' : 'Home'}</span>
            </Link>
            <Logo size="sm" />
            <div className="flex items-center gap-2">
              <button
                onClick={fetchGroups}
                className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Title */}
      <div className="bg-gradient-to-b from-amber-500/10 to-transparent border-b border-amber-500/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white">Admin Panel</h1>
              <p className="text-gray-500 text-sm">{groups.length} groups total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
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
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-dark-900 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="font-medium text-white mb-1">No groups yet</h3>
            <p className="text-gray-500 text-sm">Groups created will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map(group => (
              <div
                key={group.id}
                className="card p-4 hover:border-gray-700/70 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">{group.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                      <span>{group.members.length} members</span>
                      <span>{group.currency}</span>
                      <span>{formatDate(group.createdAt)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {group.members.map(m => (
                        <span
                          key={m.id}
                          className="px-2 py-0.5 bg-dark-900/50 rounded text-xs text-gray-400"
                        >
                          {m.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Open Link */}
                    <Link
                      to={`/group/${group.id}`}
                      className="p-2 text-gray-500 hover:text-primary-400 transition-colors"
                      title="Open group"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </Link>
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

