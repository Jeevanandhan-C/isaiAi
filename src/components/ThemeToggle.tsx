import React from 'react';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  darkMode: boolean;
  onToggle: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ darkMode, onToggle }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        id="theme-toggle-btn"
        onClick={onToggle}
        aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        className={`group flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 border ${
          darkMode
            ? 'bg-neutral-900/90 text-amber-300 border-neutral-700/80 hover:bg-neutral-800 shadow-amber-500/10'
            : 'bg-white/95 text-neutral-800 border-neutral-200/90 hover:bg-neutral-50 shadow-neutral-900/10'
        } backdrop-blur-md`}
        title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        <span className="relative flex h-5 w-5 items-center justify-center">
          {darkMode ? (
            <Sun className="h-5 w-5 text-amber-400 animate-spin-slow transition-transform group-hover:rotate-45" />
          ) : (
            <Moon className="h-5 w-5 text-indigo-600 transition-transform group-hover:-rotate-12" />
          )}
        </span>
        <span className="text-xs font-semibold tracking-wide pr-1 select-none">
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </span>
      </button>
    </div>
  );
};
