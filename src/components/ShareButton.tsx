import { useState } from 'react';

interface ShareButtonProps {
  groupId: string;
}

export default function ShareButton({ groupId }: ShareButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}${window.location.pathname}#/group/${groupId}`;

  const handleShare = async () => {
    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my expense group on DuCount',
          text: 'Track and split expenses easily',
          url: shareUrl,
        });
        return;
      } catch (err) {
        // User cancelled or share failed, fall through to copy
        if ((err as Error).name === 'AbortError') return;
      }
    }

    // Fallback to copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setShowTooltip(true);
      setTimeout(() => {
        setCopied(false);
        setShowTooltip(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Final fallback - show URL in prompt
      prompt('Copy this link to share:', shareUrl);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white transition-colors"
        title="Share group"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        <span className="hidden sm:inline text-sm">Share</span>
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 px-3 py-2 bg-dark-800 border border-gray-700 rounded-lg shadow-xl text-sm whitespace-nowrap">
          <div className="flex items-center gap-2">
            {copied ? (
              <>
                <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-primary-400">Link copied!</span>
              </>
            ) : (
              <span className="text-gray-400">Copying...</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

