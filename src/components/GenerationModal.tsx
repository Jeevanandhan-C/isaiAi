import React from 'react';
import { Disc3, Sparkles, CheckCircle2, Music, Loader2, ArrowRight } from 'lucide-react';

interface GenerationModalProps {
  isOpen: boolean;
  phase: string;
  progressPercent?: number;
  progress?: number;
  idea?: string;
  ideaText?: string;
  styles?: string[];
  selectedStyles?: string[];
  languageName?: string;
  darkMode?: boolean;
  realtimeLyrics?: {
    title: string;
    section?: string;
    lines: string[];
  } | null;
}

export const GenerationModal: React.FC<GenerationModalProps> = ({
  isOpen,
  phase,
  progressPercent,
  progress,
  idea,
  ideaText,
  styles,
  selectedStyles,
  languageName = 'Selected Language',
  darkMode = true,
  realtimeLyrics,
}) => {
  if (!isOpen) return null;

  const currentPercent = progressPercent ?? progress ?? 45;
  const activeIdea = idea || ideaText || '';
  const activeStyles = styles || selectedStyles || [];

  const steps = [
    { num: 1, label: 'Story & Theme Isolation', desc: 'Isolating your exact idea strictly without external pollution' },
    { num: 2, label: `Poetic Lyrics in ${languageName}`, desc: 'Crafting rhyming Pallavi, Anupallavi, and Charanam' },
    { num: 3, label: 'Instrument & Raga Synthesis', desc: 'Arranging tempo, acoustic instrumentation & scale' },
    { num: 4, label: 'Playable MP3 Encoding', desc: 'Preparing final audio player and download package' },
  ];

  const currentStepNum =
    currentPercent >= 90 ? 4 : currentPercent >= 60 ? 3 : currentPercent >= 30 ? 2 : 1;

  return (
    <div
      id="generation-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-all animate-fadeIn"
    >
      <div
        id="generation-modal-card"
        className={`w-full max-w-lg rounded-3xl p-6 sm:p-8 border shadow-2xl transition-all ${
          darkMode
            ? 'bg-neutral-900 border-neutral-800 text-neutral-100 shadow-rose-950/40'
            : 'bg-white border-neutral-200 text-neutral-900 shadow-2xl'
        }`}
      >
        {/* Animated Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-500 via-orange-500 to-amber-500 p-0.5 animate-spin-slow">
              <div className="w-full h-full rounded-full bg-neutral-900 flex items-center justify-center">
                <Disc3 className="w-10 h-10 text-rose-500" />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          <h3 className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 bg-clip-text text-transparent">
            Composing Your AI Song
          </h3>
          <p className="text-xs text-neutral-700 dark:text-neutral-300 font-medium mt-1 max-w-sm">
            Automatic background synthesis in progress. Next step will open directly to Play / Download.
          </p>
        </div>

        {/* User Idea Preview */}
        <div
          className={`p-3.5 rounded-2xl border mb-4 ${
            darkMode ? 'bg-neutral-950/70 border-neutral-800' : 'bg-neutral-50 border-neutral-300'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider mb-1 text-rose-600 dark:text-rose-400">
            <span>Your Song Idea:</span>
            <span className="text-neutral-800 dark:text-neutral-200 font-semibold">{languageName}</span>
          </div>
          <p className="text-xs text-neutral-900 dark:text-neutral-100 line-clamp-2 italic font-serif">
            "{activeIdea || 'Original concept...'}"
          </p>
        </div>

        {/* Real-Time Generated Lyrics Live Display */}
        {realtimeLyrics && (
          <div
            className={`p-3.5 rounded-2xl border mb-4 animate-fadeIn transition-all ${
              darkMode
                ? 'bg-rose-950/30 border-rose-800/60 text-rose-100'
                : 'bg-rose-50/90 border-rose-200 text-neutral-900'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider mb-1 text-rose-600 dark:text-rose-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-500 animate-spin" />
                Real-Time Lyrics Generated:
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                ✓ Saving to My Songs
              </span>
            </div>
            <div className="text-xs font-bold mb-1 text-neutral-900 dark:text-white">
              {realtimeLyrics.title}
              {realtimeLyrics.section && (
                <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 ml-2">
                  [{realtimeLyrics.section}]
                </span>
              )}
            </div>
            <div className="space-y-0.5">
              {realtimeLyrics.lines.slice(0, 3).map((line, idx) => (
                <p key={idx} className="text-xs italic font-serif text-neutral-800 dark:text-neutral-200 line-clamp-1">
                  • {line}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Progress Bar & Phase Status */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {phase || 'Synthesizing song...'}
            </span>
            <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">{currentPercent}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${currentPercent}%` }}
            />
          </div>
        </div>

        {/* Technical Pipeline Steps */}
        <div className="space-y-2.5 mb-6">
          {steps.map((st) => {
            const isCompleted = currentStepNum > st.num || currentPercent >= 100;
            const isCurrent = currentStepNum === st.num && currentPercent < 100;

            return (
              <div
                key={st.num}
                className={`flex items-start gap-3 p-2.5 rounded-xl border text-xs transition-all ${
                  isCurrent
                    ? darkMode
                      ? 'bg-rose-500/15 border-rose-500/50 text-neutral-100 font-medium'
                      : 'bg-rose-50 border-rose-300 text-neutral-900 font-medium'
                    : isCompleted
                    ? darkMode
                      ? 'bg-neutral-950/40 border-neutral-800 text-neutral-300'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-700'
                    : darkMode
                    ? 'border-neutral-800/40 text-neutral-400'
                    : 'border-neutral-200/50 text-neutral-600'
                }`}
              >
                <div className="mt-0.5">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-rose-500 animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-neutral-400 dark:border-neutral-500 flex items-center justify-center text-[10px] text-neutral-700 dark:text-neutral-300 font-bold">
                      {st.num}
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-bold flex items-center gap-1.5 text-neutral-900 dark:text-white">
                    <span>{st.label}</span>
                    {isCurrent && (
                      <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                        (Active)
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-neutral-700 dark:text-neutral-300 mt-0.5 font-medium">{st.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="flex items-center justify-center gap-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 text-center">
          <Music className="w-3.5 h-3.5 text-rose-500" />
          <span>Opening Play & Download player automatically upon completion</span>
          <ArrowRight className="w-3.5 h-3.5 text-rose-500" />
        </div>
      </div>
    </div>
  );
};
