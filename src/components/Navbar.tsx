import React from 'react';
import { Music, Radio, Library, Sparkles, Globe2 } from 'lucide-react';
import { LANGUAGES } from '../data/musicStyles';

interface NavbarProps {
  darkMode: boolean;
  libraryCount: number;
  onOpenLibrary: () => void;
  selectedLanguage: string;
  onSelectLanguage: (code: string) => void;
  isLibraryActive?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  libraryCount,
  onOpenLibrary,
  selectedLanguage,
  onSelectLanguage,
  isLibraryActive = false,
}) => {
  const currentLang = LANGUAGES.find((l) => l.code === selectedLanguage) || LANGUAGES[0];

  return (
    <header
      id="main-navbar"
      className={`sticky top-0 z-40 w-full border-b transition-colors backdrop-blur-md ${
        darkMode
          ? 'bg-neutral-950/80 border-neutral-800/80 text-white'
          : 'bg-white/85 border-neutral-200/90 text-neutral-900 shadow-xs'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo / Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-orange-500 to-amber-500 text-white shadow-md shadow-rose-500/20">
            <Music className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 bg-clip-text text-transparent">
                IsaiAI
              </h1>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                Text to Song
              </span>
            </div>
            <p className="text-[11px] text-neutral-700 dark:text-neutral-300 font-medium hidden sm:block">
              AI Music & MP3 Song Generator • Tamil & Global Styles
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Selector Dropdown */}
          <div className="relative flex items-center">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                darkMode
                  ? 'bg-neutral-900 border-neutral-700 text-neutral-200 hover:border-neutral-600'
                  : 'bg-neutral-100 border-neutral-300 text-neutral-800 hover:bg-neutral-200'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5 text-rose-500" />
              <select
                id="global-language-select"
                value={selectedLanguage}
                onChange={(e) => onSelectLanguage(e.target.value)}
                className="bg-transparent border-none outline-none cursor-pointer pr-1 text-xs font-bold focus:ring-0 text-neutral-900 dark:text-neutral-100"
                aria-label="Select default language"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className={darkMode ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-900'}>
                    {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Library Button */}
          <button
            id="library-nav-btn"
            onClick={onOpenLibrary}
            className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs ${
              isLibraryActive
                ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/25 ring-2 ring-rose-500/30'
                : libraryCount > 0
                ? darkMode
                  ? 'bg-neutral-900 border-rose-500/40 text-rose-400 hover:bg-rose-500 hover:text-white hover:border-rose-500'
                  : 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-500 hover:text-white hover:border-rose-500'
                : darkMode
                ? 'bg-neutral-900 border-neutral-700 text-neutral-200 hover:bg-neutral-800'
                : 'bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-100'
            }`}
            title="Open My Songs Library"
          >
            <Library className="w-4 h-4 shrink-0" />
            <span className="inline font-bold">My Songs</span>
            <span
              className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-black transition-colors ${
                isLibraryActive
                  ? 'bg-white text-rose-600'
                  : libraryCount > 0
                  ? darkMode
                    ? 'bg-rose-500/20 text-rose-300 group-hover:bg-white group-hover:text-rose-600'
                    : 'bg-rose-200 text-rose-800'
                  : darkMode
                  ? 'bg-neutral-800 text-neutral-300'
                  : 'bg-neutral-200 text-neutral-800'
              }`}
            >
              {libraryCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
