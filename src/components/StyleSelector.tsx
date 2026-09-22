import React from 'react';
import { Radio, Sparkles, Layers, Flame, Globe2 } from 'lucide-react';
import {
  MUSIC_STYLES,
  LANGUAGES,
  getStylesForLanguage,
  getLanguageHeading,
} from '../data/musicStyles';
import { MusicStyleId } from '../types';

interface StyleSelectorProps {
  darkMode: boolean;
  selectedStyles: MusicStyleId[];
  onToggleStyle: (styleId: MusicStyleId) => void;
  selectionMode: 'single' | 'fusion';
  onSelectionModeChange: (mode: 'single' | 'fusion') => void;
  selectedLanguage: string;
  onLanguageChange?: (languageCode: string) => void;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({
  darkMode,
  selectedStyles,
  onToggleStyle,
  selectionMode,
  onSelectionModeChange,
  selectedLanguage,
  onLanguageChange,
}) => {
  const isFusion = selectedStyles.length > 1;

  // Dynamically get the 10 styles for the currently selected language
  const languageStyles = getStylesForLanguage(selectedLanguage);
  const headingText = getLanguageHeading(selectedLanguage);

  // Global cross-cultural styles
  const globalStyles = MUSIC_STYLES.filter((s) => s.category === 'global');

  // Currently selected language metadata
  const currentLangObj = LANGUAGES.find((l) => l.code === selectedLanguage) || LANGUAGES[0];

  return (
    <div
      id="style-selector-card"
      className={`rounded-2xl p-5 sm:p-6 border transition-all ${
        darkMode
          ? 'bg-neutral-900/90 border-neutral-800 text-neutral-100 shadow-xl shadow-black/20'
          : 'bg-white border-neutral-200 text-neutral-900 shadow-lg shadow-neutral-200/50'
      }`}
    >
      {/* Title & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold tracking-tight text-neutral-950 dark:text-white">Select Music Style</h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              {currentLangObj.flag} {currentLangObj.name}
            </span>
            <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
              ({languageStyles.length} Styles Available)
            </span>
          </div>
          <p className="text-xs text-neutral-700 dark:text-neutral-300 font-medium mt-0.5">
            Choose an individual radio style or select multiple to generate a blended fusion track.
          </p>
        </div>

        {/* Radio Button (Single) vs Fusion (Multiple) Toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700 w-fit">
          <button
            id="style-mode-single-btn"
            type="button"
            onClick={() => onSelectionModeChange('single')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectionMode === 'single'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            Individual (Radio)
          </button>

          <button
            id="style-mode-fusion-btn"
            type="button"
            onClick={() => onSelectionModeChange('fusion')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectionMode === 'fusion'
                ? 'bg-gradient-to-r from-purple-600 to-rose-600 text-white shadow-sm'
                : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Blended Fusion (Multiple)
          </button>
        </div>
      </div>

      {/* Language Quick-Filter Pills */}
      {onLanguageChange && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-neutral-800 dark:text-neutral-200">
            <Globe2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Switch Language to view its 10 Signature Styles:</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth">
            {LANGUAGES.map((lang) => {
              const isActive = selectedLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  id={`style-lang-filter-${lang.code}`}
                  type="button"
                  onClick={() => onLanguageChange(lang.code)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-rose-500 text-white shadow-sm'
                      : darkMode
                      ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white'
                      : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 border border-neutral-300'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Dynamic Status Banner */}
      <div
        className={`p-3.5 rounded-xl border mb-5 transition-all ${
          isFusion
            ? darkMode
              ? 'bg-purple-950/30 border-purple-800/60 text-purple-200'
              : 'bg-purple-50 border-purple-200 text-purple-900'
            : darkMode
            ? 'bg-rose-950/20 border-rose-900/50 text-rose-200'
            : 'bg-rose-50/70 border-rose-200 text-rose-900'
        }`}
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {isFusion ? (
              <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
            ) : (
              <Flame className="w-4 h-4 text-rose-500" />
            )}
            <span className="text-xs font-bold">
              {isFusion ? (
                <>
                  <span className="uppercase tracking-wider">Blended Fusion Track:</span>{' '}
                  <span className="font-normal">
                    {selectedStyles
                      .map((id) => MUSIC_STYLES.find((s) => s.id === id)?.name)
                      .filter(Boolean)
                      .join(' + ')}
                  </span>
                </>
              ) : (
                <>
                  <span className="uppercase tracking-wider">Individual Style:</span>{' '}
                  <span className="font-normal">
                    {MUSIC_STYLES.find((s) => s.id === selectedStyles[0])?.name || languageStyles[0]?.name || 'Signature Melody'}
                  </span>
                </>
              )}
            </span>
          </div>

          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white/20 dark:bg-black/20">
            {isFusion
              ? `${selectedStyles.length} styles blended`
              : 'Pure signature arrangement'}
          </span>
        </div>
      </div>

      {/* 10 Signature Styles for the selected language */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-pulse" />
            {headingText}
          </span>
          <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
            {selectionMode === 'single' ? 'Click to select (Radio)' : 'Click to toggle (Multi-Fusion)'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {languageStyles.map((style) => {
            const isSelected = selectedStyles.includes(style.id);

            return (
              <div
                key={style.id}
                id={`style-card-${style.id}`}
                onClick={() => onToggleStyle(style.id)}
                className={`relative p-3.5 rounded-xl border cursor-pointer transition-all select-none ${
                  isSelected
                    ? darkMode
                      ? 'bg-rose-500/15 border-rose-500 text-white ring-2 ring-rose-500/20 shadow-md shadow-rose-950/20'
                      : 'bg-rose-50/90 border-rose-500 text-rose-950 ring-2 ring-rose-200 shadow-sm'
                    : darkMode
                    ? 'bg-neutral-950/40 border-neutral-800 text-neutral-200 hover:border-neutral-700 hover:bg-neutral-800/40'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-900 hover:border-neutral-300 hover:bg-neutral-100'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-rose-500 text-white'
                          : darkMode
                          ? 'border border-neutral-700 text-transparent'
                          : 'border border-neutral-300 text-transparent'
                      }`}
                    >
                      {selectionMode === 'single' ? (
                        <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : ''}`} />
                      ) : (
                        <span className="text-[10px] font-bold">✓</span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-xs font-bold leading-tight text-neutral-950 dark:text-white">{style.name}</h3>
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                        {style.nativeName}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                    {style.bpmRange[0]}-{style.bpmRange[1]} BPM
                  </span>
                </div>

                <p className="text-[11px] mt-2 leading-relaxed line-clamp-2 text-neutral-700 dark:text-neutral-300 font-medium">
                  {style.description}
                </p>

                <div className="mt-2.5 flex flex-wrap gap-1">
                  {style.instruments.slice(0, 3).map((inst, i) => (
                    <span
                      key={i}
                      className="text-[9px] px-1.5 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-800 font-semibold text-neutral-800 dark:text-neutral-200"
                    >
                      {inst}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cross-Cultural Global Styles */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 block mb-3">
          Optional Cross-Cultural & Global Additions:
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {globalStyles.map((style) => {
            const isSelected = selectedStyles.includes(style.id);

            return (
              <div
                key={style.id}
                id={`style-card-${style.id}`}
                onClick={() => onToggleStyle(style.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all select-none ${
                  isSelected
                    ? darkMode
                      ? 'bg-rose-500/15 border-rose-500 text-white ring-2 ring-rose-500/20'
                      : 'bg-rose-50 border-rose-500 text-rose-950 ring-2 ring-rose-200'
                    : darkMode
                    ? 'bg-neutral-950/40 border-neutral-800 text-neutral-200 hover:border-neutral-700'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-900 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-950 dark:text-white">{style.name}</span>
                  <span className="text-[10px] font-mono font-bold text-neutral-700 dark:text-neutral-300">
                    {style.bpmRange[0]}-{style.bpmRange[1]} BPM
                  </span>
                </div>
                <p className="text-[11px] mt-1 text-neutral-700 dark:text-neutral-300 font-medium">{style.signatureVibe}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

