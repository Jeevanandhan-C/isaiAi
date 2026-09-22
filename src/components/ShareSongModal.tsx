import React, { useState } from 'react';
import { X, Copy, Check, Share2, Music, ExternalLink } from 'lucide-react';
import { GeneratedSong } from '../types';

interface ShareSongModalProps {
  song: GeneratedSong;
  darkMode: boolean;
  onClose: () => void;
}

export const ShareSongModal: React.FC<ShareSongModalProps> = ({ song, darkMode, onClose }) => {
  const [copied, setCopied] = useState(false);

  // Generate direct share link focusing on listening to the song
  const shareUrl = `${window.location.origin}${window.location.pathname}?song=${song.id}#player`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-md rounded-2xl p-6 border shadow-2xl transition-all ${
          darkMode ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 mb-4">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-rose-500" />
            <h3 className="text-base font-bold text-neutral-950 dark:text-white">Share Song Link</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-xs text-neutral-700 dark:text-neutral-300 font-medium mb-2">
            This direct link is designed for the recipient to <strong>hear the song only</strong> directly in their browser without setup.
          </p>

          <div
            className={`p-3.5 rounded-xl border flex items-center gap-3 mb-4 ${
              darkMode ? 'bg-neutral-950/60 border-neutral-800' : 'bg-neutral-50 border-neutral-300'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shrink-0">
              <Music className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-neutral-950 dark:text-white truncate">{song.title}</h4>
              <p className="text-xs text-neutral-700 dark:text-neutral-300 font-medium truncate">
                {song.styleDisplayName} • {song.languageName}
              </p>
            </div>
          </div>

          <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block mb-1.5">
            Shareable Audio URL:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className={`w-full p-2.5 rounded-xl text-xs font-mono font-medium border outline-none ${
                darkMode ? 'bg-neutral-950 border-neutral-800 text-neutral-200' : 'bg-neutral-100 border-neutral-300 text-neutral-900'
              }`}
            />
            <button
              onClick={copyLink}
              className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-500 text-white hover:bg-rose-600 shadow-sm shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-neutral-600 dark:text-neutral-400 font-medium pt-2 border-t border-neutral-200 dark:border-neutral-800">
          <span>Format: Playable MP3 Audio</span>
          <button
            onClick={() => window.open(shareUrl, '_blank')}
            className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold hover:underline"
          >
            <span>Preview Player</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
