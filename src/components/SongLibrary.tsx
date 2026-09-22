import React, { useState } from 'react';
import { Play, Download, Trash2, Share2, Music2, Calendar, X, Search, Sparkles, PlusCircle, UserCheck } from 'lucide-react';
import { GeneratedSong } from '../types';

interface SongLibraryProps {
  songs: GeneratedSong[];
  darkMode: boolean;
  activeSongId: string | null;
  onSelectSong: (song: GeneratedSong) => void;
  onDeleteSong: (id: string) => void;
  onShareSong: (song: GeneratedSong) => void;
  onClose?: () => void;
  onCreateNewSong?: () => void;
}

export const SongLibrary: React.FC<SongLibraryProps> = ({
  songs,
  darkMode,
  activeSongId,
  onSelectSong,
  onDeleteSong,
  onShareSong,
  onClose,
  onCreateNewSong,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'created'>('all');

  const handleDeleteDirectly = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteSong(id);
  };

  const handleDownload = (song: GeneratedSong, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!song.audioUrl) return;
    const a = document.createElement('a');
    a.href = song.audioUrl;
    const cleanTitle = (song.title || 'IsaiAI_Song').replace(/[^a-zA-Z0-9_\u0B80-\u0BFF]/g, '_');
    a.download = `${cleanTitle}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const userCreatedSongs = songs.filter((s) => s.isUserCreated || s.id !== 'demo-tamil-melody-01');

  const filteredSongs = songs.filter((s) => {
    if (filterType === 'created' && !(s.isUserCreated || s.id !== 'demo-tamil-melody-01')) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.title?.toLowerCase().includes(q) ||
      s.nativeTitle?.toLowerCase().includes(q) ||
      s.idea?.toLowerCase().includes(q) ||
      s.styleDisplayName?.toLowerCase().includes(q)
    );
  });

  return (
    <div
      id="song-library-modal"
      className={`rounded-2xl p-5 sm:p-6 border transition-all ${
        darkMode
          ? 'bg-neutral-900/95 border-neutral-800 text-neutral-100 shadow-2xl'
          : 'bg-white border-neutral-300 text-neutral-900 shadow-xl'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-neutral-200 dark:border-neutral-800 gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-neutral-950 dark:text-white">
              My Songs Library
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              {songs.length} {songs.length === 1 ? 'Song' : 'Songs'} Saved
            </span>
            {userCreatedSongs.length > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {userCreatedSongs.length} Created by You
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-700 dark:text-neutral-300 font-medium mt-0.5">
            Songs created and saved by you. Click any song to play, review lyrics, share, or download MP3.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {onCreateNewSong && (
            <button
              id="library-create-new-btn"
              type="button"
              onClick={onCreateNewSong}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-orange-500 hover:brightness-110 shadow-sm transition-all cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Compose New Song</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Close Library"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        {/* All vs Created Filter Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 w-fit">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white'
            }`}
          >
            All Songs ({songs.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('created')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterType === 'created'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Created by Me ({userCreatedSongs.length})</span>
          </button>
        </div>

        {/* Search Bar */}
        {songs.length > 1 && (
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, idea, style..."
              className={`w-full pl-9 pr-4 py-1.5 rounded-xl text-xs border outline-none transition-colors font-medium ${
                darkMode
                  ? 'bg-neutral-950/70 border-neutral-800 text-neutral-100 placeholder-neutral-500 focus:border-rose-500'
                  : 'bg-neutral-50 border-neutral-300 text-neutral-950 placeholder-neutral-500 focus:border-rose-500'
              }`}
            />
          </div>
        )}
      </div>

      {/* Song List */}
      {filteredSongs.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-800">
          <Music2 className="w-12 h-12 text-rose-500/60 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            {filterType === 'created' ? 'No Custom Songs Created Yet' : 'No Matching Songs Found'}
          </h3>
          <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-1 max-w-sm mx-auto font-medium">
            {filterType === 'created'
              ? 'Enter your own story or idea in Song Studio, select your favorite genre or fusion, and click "Generate AI Song & MP3" to create one!'
              : 'Try changing your search query or switch filters.'}
          </p>
          {onCreateNewSong && (
            <button
              type="button"
              onClick={onCreateNewSong}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Go to Studio & Compose Song</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
          {filteredSongs.map((song) => {
            const isActive = activeSongId === song.id;
            const isUserCreated = song.isUserCreated || song.id !== 'demo-tamil-melody-01';
            const dateStr = new Date(song.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={song.id}
                id={`library-item-${song.id}`}
                onClick={() => onSelectSong(song)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isActive
                    ? darkMode
                      ? 'bg-rose-500/10 border-rose-500/50 ring-1 ring-rose-500/30'
                      : 'bg-rose-50/90 border-rose-400 ring-1 ring-rose-200'
                    : darkMode
                    ? 'bg-neutral-950/40 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850/50'
                    : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-100/70'
                }`}
              >
                {/* Left Info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isActive
                        ? 'bg-rose-500 text-white'
                        : darkMode
                        ? 'bg-neutral-800 text-rose-400'
                        : 'bg-neutral-200 text-rose-600'
                    }`}
                  >
                    <Play className="w-4 h-4 ml-0.5 fill-current" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center flex-wrap gap-1.5">
                      <h3 className="text-sm font-bold text-neutral-950 dark:text-white truncate">
                        {song.title}
                      </h3>
                      {song.nativeTitle && (
                        <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                          ({song.nativeTitle})
                        </span>
                      )}
                      {isUserCreated ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                          Created by You
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-500/10 text-neutral-700 dark:text-neutral-400 border border-neutral-500/20">
                          Sample Track
                        </span>
                      )}
                      {song.isFusion && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                          Fusion
                        </span>
                      )}
                      {isActive && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500 text-white">
                          Now Playing
                        </span>
                      )}
                    </div>

                    {song.idea && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 font-bold italic truncate mt-0.5">
                        Idea: "{song.idea}"
                      </p>
                    )}

                    <p className="text-xs text-neutral-800 dark:text-neutral-200 mt-0.5 line-clamp-1 font-medium">
                      {song.styleDisplayName} • {song.languageName} • {song.bpm} BPM
                    </p>

                    <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-700 dark:text-neutral-300 font-semibold">
                      <Calendar className="w-3 h-3" />
                      <span>{dateStr}</span>
                      <span>•</span>
                      <span>{song.durationSec}s MP3</span>
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSong(song);
                    }}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-rose-500 text-white'
                        : darkMode
                        ? 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
                        : 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play</span>
                  </button>

                  <button
                    id={`lib-share-btn-${song.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onShareSong(song);
                    }}
                    className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                      darkMode
                        ? 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
                        : 'bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-100'
                    }`}
                    title="Share this song"
                  >
                    <Share2 className="w-3.5 h-3.5 text-rose-500" />
                  </button>

                  <button
                    id={`lib-download-btn-${song.id}`}
                    onClick={(e) => handleDownload(song, e)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500 text-white hover:bg-rose-600 shadow-xs cursor-pointer"
                    title="Download MP3"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>MP3</span>
                  </button>

                  <button
                    id={`lib-delete-btn-${song.id}`}
                    onClick={(e) => handleDeleteDirectly(song.id, e)}
                    className="p-2 rounded-lg border border-transparent text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                    title="Remove this song"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

