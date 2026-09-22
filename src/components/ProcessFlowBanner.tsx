import React from 'react';
import { User, FileText, Music2, Cpu, Sparkles, Disc3, Play } from 'lucide-react';

interface ProcessFlowBannerProps {
  currentStep: number; // 1 to 6 (or user facing 1 to 4)
  darkMode: boolean;
  onStepClick?: (stepId: number) => void;
  hasActiveSong?: boolean;
}

export const ProcessFlowBanner: React.FC<ProcessFlowBannerProps> = ({
  currentStep,
  darkMode,
  onStepClick,
  hasActiveSong = false,
}) => {
  // The user workflow consists of 4 clean visible stages:
  // USER -> Enter Lyrics/Text -> Select Song Style -> Play / Download
  // The technical backend API call and AI synthesis steps are hidden from the user view
  // and run completely and automatically in the background without requesting user approval.
  const steps = [
    { id: 1, label: 'USER', sub: 'Creator', icon: User, internalId: 1 },
    { id: 2, label: 'Text / Lyrics', sub: 'Idea or Words', icon: FileText, internalId: 2 },
    { id: 3, label: 'Song Style', sub: 'Melody / Kuthu / etc.', icon: Music2, internalId: 3 },
    { id: 4, label: 'Play / Download', sub: 'Playable MP3', icon: Play, internalId: 6 },
  ];

  // Map internal technical pipeline steps (1..6) to user-facing visible stage (1..4)
  const getUserFacingStep = (step: number) => {
    if (step <= 1) return 1;
    if (step === 2) return 2;
    if (step === 3) return 3;
    if (step >= 4 && step < 6) return 3; // during background generation, user is at style selection transitioning to output
    return 4; // ready to play / download
  };

  const activeDisplayStep = getUserFacingStep(currentStep);

  return (
    <div
      id="process-flow-container"
      className={`w-full rounded-2xl p-4 sm:p-5 transition-colors border ${
        darkMode
          ? 'bg-neutral-900/60 border-neutral-800/80 text-neutral-200'
          : 'bg-white/80 border-neutral-200/90 text-neutral-800 shadow-sm'
      } backdrop-blur-sm`}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Disc3 className="w-4 h-4 text-rose-500 animate-spin-slow" />
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Song Creation Workflow
          </span>
        </div>
        <span className="text-xs text-neutral-700 dark:text-neutral-300 font-bold">
          Step {activeDisplayStep} of {steps.length}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = activeDisplayStep === step.id;
          const isDone = activeDisplayStep > step.id;
          const isClickable = !!onStepClick && (step.id <= 3 || hasActiveSong);

          return (
            <button
              key={step.id}
              id={`process-flow-step-${step.id}`}
              type="button"
              onClick={() => isClickable && onStepClick?.(step.id)}
              disabled={!isClickable}
              className={`relative flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                isClickable ? 'cursor-pointer' : 'cursor-default'
              } ${
                isActive
                  ? darkMode
                    ? 'bg-rose-500/15 border-rose-500/50 text-rose-300 ring-2 ring-rose-500/20 shadow-lg shadow-rose-950/20'
                    : 'bg-rose-50 border-rose-300 text-rose-800 ring-2 ring-rose-200 shadow-md shadow-rose-100'
                  : isDone
                  ? darkMode
                    ? 'bg-neutral-800/40 border-neutral-700/60 text-emerald-400 hover:border-emerald-500/50'
                    : 'bg-emerald-50/80 border-emerald-300 text-emerald-800 hover:border-emerald-400'
                  : darkMode
                  ? 'bg-neutral-900/30 border-neutral-800/50 text-neutral-400 hover:border-neutral-700'
                  : 'bg-neutral-100/90 border-neutral-300 text-neutral-800 hover:border-neutral-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 transition-colors ${
                  isActive
                    ? 'bg-rose-500 text-white shadow-xs'
                    : isDone
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : darkMode
                    ? 'bg-neutral-800 text-neutral-300'
                    : 'bg-neutral-200 text-neutral-800'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold leading-tight text-neutral-900 dark:text-neutral-100">{step.label}</span>
              <span className="text-[10px] font-semibold text-neutral-700 dark:text-neutral-300 mt-0.5 leading-tight">{step.sub}</span>

              {/* Arrow connector */}
              {idx < steps.length - 1 && (
                <div className="hidden sm:block absolute -right-2 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400 text-xs font-bold pointer-events-none z-10">
                  →
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
