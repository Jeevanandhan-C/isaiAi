import React from 'react';
import { Sparkles, FileText, Lightbulb, Languages, RefreshCw, Music, Disc3, Radio } from 'lucide-react';
import { LANGUAGES, INSPIRATION_IDEAS } from '../data/musicStyles';
import { MusicStyleId } from '../types';

interface SongInputCardProps {
  darkMode: boolean;
  mode: 'idea-to-song' | 'lyrics-to-song';
  onModeChange: (m: 'idea-to-song' | 'lyrics-to-song') => void;
  trackLength: 'clip' | 'full';
  onTrackLengthChange: (tl: 'clip' | 'full') => void;
  ideaText: string;
  onIdeaChange: (text: string) => void;
  customLyricsText: string;
  onCustomLyricsChange: (text: string) => void;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  onApplyInspiration: (prompt: string, styles: MusicStyleId[], language: string) => void;
  onClearIdea: () => void;
  isGenerating: boolean;
  onGenerateSong: () => void;
}

export const SongInputCard: React.FC<SongInputCardProps> = ({
  darkMode,
  mode,
  onModeChange,
  trackLength,
  onTrackLengthChange,
  ideaText,
  onIdeaChange,
  customLyricsText,
  onCustomLyricsChange,
  selectedLanguage,
  onLanguageChange,
  onApplyInspiration,
  onClearIdea,
  isGenerating,
  onGenerateSong,
}) => {
  const currentLangObj = LANGUAGES.find((l) => l.code === selectedLanguage) || LANGUAGES[0];

  return (
    <div
      id="song-input-card"
      className={`rounded-2xl p-5 sm:p-6 border transition-all ${
        darkMode
          ? 'bg-neutral-900/95 border-neutral-800 text-neutral-100 shadow-xl shadow-black/30'
          : 'bg-white border-neutral-200 text-neutral-900 shadow-lg shadow-neutral-200/50'
      }`}
    >
      {/* Top Header: Mode Switcher & Strict Isolation Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 w-fit">
          <button
            id="mode-idea-btn"
            onClick={() => onModeChange('idea-to-song')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'idea-to-song'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            Text to Song
          </button>

          <button
            id="mode-lyrics-btn"
            onClick={() => onModeChange('lyrics-to-song')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'lyrics-to-song'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Custom Lyrics to Song
          </button>
        </div>

        {/* Clear / Strict Isolation Control */}
        <div className="flex items-center gap-2">
          <button
            id="clear-idea-btn"
            onClick={onClearIdea}
            disabled={isGenerating || (!ideaText && !customLyricsText)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
              darkMode
                ? 'bg-neutral-800/70 border-neutral-700 text-neutral-300 hover:text-rose-400 hover:border-rose-900/50'
                : 'bg-neutral-100 border-neutral-200 text-neutral-700 hover:text-rose-600 hover:border-rose-300'
            } disabled:opacity-40 disabled:pointer-events-none cursor-pointer`}
            title="Reset text to start a completely new, unmixed idea"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>New Idea (Don't Mix)</span>
          </button>
        </div>
      </div>

      {/* Lyria Music Generation Engine & Track Length Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 mb-4 rounded-xl border border-violet-500/20 bg-violet-500/10 dark:bg-violet-950/30">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          <div>
            <span className="text-xs font-bold text-neutral-950 dark:text-white">
              Lyria Music Engine:
            </span>
            <span className="text-[11px] text-neutral-700 dark:text-neutral-300 ml-1.5 hidden sm:inline font-medium">
              Google Lyria Audio Model
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="track-length-clip-btn"
            onClick={() => onTrackLengthChange('clip')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              trackLength === 'clip'
                ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                : darkMode
                ? 'bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700'
                : 'bg-white border-neutral-200 text-neutral-800 hover:bg-neutral-100'
            }`}
            title="Generate a 30s music clip / hook using lyria-3-clip-preview"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Lyria 3 Clip (30s)</span>
            <span className="text-[10px] opacity-80 font-mono">lyria-3-clip-preview</span>
          </button>

          <button
            type="button"
            id="track-length-full-btn"
            onClick={() => onTrackLengthChange('full')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              trackLength === 'full'
                ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                : darkMode
                ? 'bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700'
                : 'bg-white border-neutral-200 text-neutral-800 hover:bg-neutral-100'
            }`}
            title="Generate a full-length track with verse & chorus using lyria-3-pro-preview"
          >
            <Disc3 className="w-3.5 h-3.5" />
            <span>Lyria 3 Pro (Full Track)</span>
            <span className="text-[10px] opacity-80 font-mono">lyria-3-pro-preview</span>
          </button>
        </div>
      </div>

      {/* Language Selector row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-rose-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
            Song Lyrics Language:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {LANGUAGES.slice(0, 5).map((lang) => (
            <button
              key={lang.code}
              id={`lang-pill-${lang.code}`}
              onClick={() => onLanguageChange(lang.code)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                selectedLanguage === lang.code
                  ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                  : darkMode
                  ? 'bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700'
                  : 'bg-neutral-100 border-neutral-200 text-neutral-800 hover:bg-neutral-200'
              }`}
            >
              {lang.flag} {lang.name}
            </button>
          ))}

          {/* More languages selector dropdown */}
          <select
            id="more-languages-select"
            value={selectedLanguage}
            onChange={(e) => onLanguageChange(e.target.value)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
              darkMode
                ? 'bg-neutral-800 border-neutral-700 text-neutral-200'
                : 'bg-neutral-100 border-neutral-200 text-neutral-900'
            }`}
            aria-label="Select more song languages"
          >
            <option value="" disabled>More Languages...</option>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} className={darkMode ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-900'}>
                {l.flag} {l.name} ({l.nativeName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Input Textarea */}
      <div className="relative mb-4">
        {mode === 'idea-to-song' ? (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="idea-textarea" className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                Describe your song idea or story:
              </label>
              <span className="text-[11px] text-rose-600 dark:text-rose-400 font-bold">
                AI creates lyrics 100% focused strictly on this idea
              </span>
            </div>
            <textarea
              id="idea-textarea"
              rows={4}
              value={ideaText}
              onChange={(e) => onIdeaChange(e.target.value)}
              placeholder="e.g. A nostalgic journey back to school days in a Chennai village with rain falling outside the classroom window, sharing tea with best friends..."
              className={`w-full p-4 rounded-xl text-sm leading-relaxed border transition-colors outline-none resize-none focus:ring-2 focus:ring-rose-500/40 font-medium ${
                darkMode
                  ? 'bg-neutral-950/80 border-neutral-800 text-neutral-100 placeholder-neutral-500 focus:border-rose-500'
                  : 'bg-neutral-50 border-neutral-300 text-neutral-950 placeholder-neutral-500 focus:border-rose-500'
              }`}
            />
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="custom-lyrics-textarea" className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                Paste or write your own custom lyrics:
              </label>
              <span className="text-[11px] text-neutral-700 dark:text-neutral-300 font-semibold">
                Supports Tamil, Tanglish, or any language
              </span>
            </div>
            <textarea
              id="custom-lyrics-textarea"
              rows={6}
              value={customLyricsText}
              onChange={(e) => onCustomLyricsChange(e.target.value)}
              placeholder={`[Pallavi / Chorus]\nகண்ணில் வழியும் மழையின் துளிகள்...\nநெஞ்சில் பூக்கும் புதிய நினைவுகள்...\n\n[Charanam / Verse]\nகாலம் மாறினாலும் பாடும் ராகம் என்றும் மறைவதில்லை!`}
              className={`w-full p-4 rounded-xl text-sm font-mono leading-relaxed border transition-colors outline-none resize-none focus:ring-2 focus:ring-rose-500/40 ${
                darkMode
                  ? 'bg-neutral-950/80 border-neutral-800 text-neutral-100 placeholder-neutral-500 focus:border-rose-500'
                  : 'bg-neutral-50 border-neutral-300 text-neutral-950 placeholder-neutral-500 focus:border-rose-500'
              }`}
            />
          </div>
        )}
      </div>

      {/* Idea Inspiration Starter Chips */}
      {mode === 'idea-to-song' && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
              Quick Ideas to Try:
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {INSPIRATION_IDEAS.map((insp, idx) => (
              <button
                key={idx}
                id={`insp-chip-${idx}`}
                onClick={() => onApplyInspiration(insp.prompt, insp.styles as MusicStyleId[], insp.language)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border text-left transition-all ${
                  darkMode
                    ? 'bg-neutral-800/60 border-neutral-700 text-neutral-200 hover:bg-neutral-800 hover:border-neutral-600'
                    : 'bg-neutral-100 border-neutral-200 text-neutral-800 hover:bg-neutral-200/80'
                }`}
              >
                ✨ {insp.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Strict Isolation Notice */}
      <div
        className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
          darkMode
            ? 'bg-neutral-950/60 border-neutral-800 text-neutral-300'
            : 'bg-neutral-100/80 border-neutral-300 text-neutral-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>
            <strong className="font-bold text-neutral-950 dark:text-white">Isolated Composition:</strong> Song 1 and Song 2 ideas are never mixed. Each song is composed independently.
          </span>
        </div>
        <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">Language: {currentLangObj.name}</span>
      </div>
    </div>
  );
};
