import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';

export default function NotFound() {
  const { user } = useAuth();
  const homeLink = user ? '/my-groups' : '/';

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <Logo className="mx-auto mb-8" />
        <h1 className="font-display text-6xl font-bold text-white mb-4">404</h1>
        <p className="text-gray-400 text-lg mb-8">
          Oops! This page doesn't exist.
        </p>
        <Link to={homeLink} className="btn-primary">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          {user ? 'My Groups' : 'Back to Home'}
        </Link>
      </div>
    </div>
  );
}
