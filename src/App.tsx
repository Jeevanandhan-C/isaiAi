import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Music,
  Disc3,
  Play,
  RotateCcw,
  ArrowRight,
  Flame,
  Layers,
  Radio,
  FileText,
  Volume2,
  ExternalLink,
  ChevronDown,
  Edit3,
  FileDown,
  Check,
  Headphones,
  PlusCircle,
  Download,
  Library,
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { ProcessFlowBanner } from './components/ProcessFlowBanner';
import { SongInputCard } from './components/SongInputCard';
import { StyleSelector } from './components/StyleSelector';
import { AudioPlayerCard } from './components/AudioPlayerCard';
import { SongLibrary } from './components/SongLibrary';
import { ShareSongModal } from './components/ShareSongModal';
import { GenerationModal } from './components/GenerationModal';
import { ThemeToggle } from './components/ThemeToggle';
import {
  MUSIC_STYLES,
  LANGUAGES,
  INSPIRATION_IDEAS,
  getDefaultStyleForLanguage,
} from './data/musicStyles';
import { MusicStyleId, GeneratedSong } from './types';
import { generateSongAudio, generateLyriaOrSynthesizedAudio } from './audio/musicSynthesizer';
import { composeLyricsForIdea } from './data/ideaLyricsComposer';

// Initial pre-loaded sample song so user can hear playable audio immediately on first visit!
const INITIAL_DEMO_SONG: GeneratedSong = {
  id: 'demo-tamil-melody-01',
  title: 'Vaanam Paadum Isai',
  nativeTitle: 'வானம் பாடும் இசை',
  idea: 'A nostalgic romantic memory of waiting under a tea stall in a Chennai village as sudden heavy rain pours down.',
  selectedStyles: ['tamil-melody', '90s-melody-tamil'],
  isFusion: true,
  styleDisplayName: 'Tamil Melody + 90s Melody Tamil Fusion',
  language: 'ta',
  languageName: 'Tamil (தமிழ்)',
  bpm: 92,
  scale: 'Kharaharapriya / Mohanam Ragam',
  mood: 'Soulful, Nostalgic & Romantic',
  instruments: ['Bansuri Flute', 'Acoustic Guitar', 'Soft Tabla', 'Warm Strings Pad'],
  lyrics: `[Pallavi / Chorus]
கண்ணில் வழியும் மழையின் துளிகள்...
நெஞ்சில் பூக்கும் புதிய நினைவுகள்...
இசை தரும் தென்றல் காற்றில் கலந்தது,
நம் காதல் பயணம் இன்று மலர்ந்தது!

[Anupallavi / Verse 1]
சாலையின் ஓரம் பூத்த மலர்கள்,
காலையில் கேட்கும் குயிலின் குரல்கள்!
மண்ணில் தவழும் ஈர வாசம்,
மறக்க முடியா இந்த நேசம்!

[Charanam / Verse 2]
காலம் மாறினாலும் காட்சியும் மாறுவதில்லை,
பாடும் ராகம் என்றும் மறைவதில்லை!
ஒவ்வொரு நொடியும் இசையாய் மாறும்,
எங்கள் உள்ளம் எங்கும் ஆனந்தம் கூடும்!

[Outro]
இசை அலைகளில் மிதக்கும் மனம்...
இது முடிவிலா இன்பப் பயணம்!`,
  sections: [
    {
      type: 'Pallavi / Chorus',
      lines: [
        'கண்ணில் வழியும் மழையின் துளிகள்...',
        'நெஞ்சில் பூக்கும் புதிய நினைவுகள்...',
        'இசை தரும் தென்றல் காற்றில் கலந்தது,',
        'நம் காதல் பயணம் இன்று மலர்ந்தது!',
      ],
      timestampSec: 0,
    },
    {
      type: 'Anupallavi / Verse 1',
      lines: [
        'சாலையின் ஓரம் பூத்த மலர்கள்,',
        'காலையில் கேட்கும் குயிலின் குரல்கள்!',
        'மண்ணில் தவழும் ஈர வாசம்,',
        'மறக்க முடியா இந்த நேசம்!',
      ],
      timestampSec: 8,
    },
    {
      type: 'Charanam / Verse 2',
      lines: [
        'காலம் மாறினாலும் காட்சியும் மாறுவதில்லை,',
        'பாடும் ராகம் என்றும் மறைவதில்லை!',
        'ஒவ்வொரு நொடியும் இசையாய் மாறும்,',
        'எங்கள் உள்ளம் எங்கும் ஆனந்தம் கூடும்!',
      ],
      timestampSec: 16,
    },
    {
      type: 'Outro',
      lines: [
        'இசை அலைகளில் மிதக்கும் மனம்...',
        'இது முடிவிலா இன்பப் பயணம்!',
      ],
      timestampSec: 24,
    },
  ],
    durationSec: 32,
    createdAt: Date.now() - 3600000,
    isUserCreated: false,
  };

  export default function App() {
    // Theme State (Dark / Light)
    const [darkMode, setDarkMode] = useState<boolean>(() => {
      const saved = localStorage.getItem('isai_ai_dark_mode');
      if (saved !== null) return saved === 'true';
      return true; // Default to dark for music studio ambiance
    });

    // Flow & View States
    const [activeView, setActiveView] = useState<'studio' | 'player' | 'library'>('studio');
  const [currentStep, setCurrentStep] = useState<number>(2);
  const [mode, setMode] = useState<'idea-to-song' | 'lyrics-to-song'>('idea-to-song');
  const [ideaText, setIdeaText] = useState<string>('');
  const [customLyricsText, setCustomLyricsText] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ta');
  const [selectedStyles, setSelectedStyles] = useState<MusicStyleId[]>(['tamil-melody']);
  const [selectionMode, setSelectionMode] = useState<'single' | 'fusion'>('single');
  const [trackLength, setTrackLength] = useState<'clip' | 'full'>('clip');

  // Generation States
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationPhase, setGenerationPhase] = useState<string>('');
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [autoPlayCurrent, setAutoPlayCurrent] = useState<boolean>(false);

  // Songs Collection & Active Song
  const [songs, setSongs] = useState<GeneratedSong[]>(() => {
    try {
      const stored = localStorage.getItem('isai_ai_songs');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load songs from localStorage:', e);
    }
    return [INITIAL_DEMO_SONG];
  });

  const [activeSong, setActiveSong] = useState<GeneratedSong | null>(null);
  const [shareModalSong, setShareModalSong] = useState<GeneratedSong | null>(null);
  const [showLibrary, setShowLibrary] = useState<boolean>(false);
  const [onlyHearMode, setOnlyHearMode] = useState<boolean>(false);
  const [realtimeLyrics, setRealtimeLyrics] = useState<{
    title: string;
    section?: string;
    lines: string[];
  } | null>(null);
  const [savedToast, setSavedToast] = useState<string | null>(null);

  const playerRef = useRef<HTMLDivElement | null>(null);

  // Sync dark mode class
  useEffect(() => {
    localStorage.setItem('isai_ai_dark_mode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Check URL query param for direct share link ("line of the song only it's only for hear the song")
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedSongId = urlParams.get('song');
    if (sharedSongId) {
      const found = songs.find((s) => s.id === sharedSongId);
      if (found) {
        setActiveSong(found);
        setOnlyHearMode(true);
      }
    }
  }, [songs]);

  // Initialize demo song audio on first mount if missing
  useEffect(() => {
    if (!songs[0]?.audioUrl) {
      generateSongAudio({
        styles: songs[0]?.selectedStyles || ['tamil-melody'],
        bpm: songs[0]?.bpm || 92,
        scale: songs[0]?.scale,
        durationSec: 32,
      }).then(({ audioUrl }) => {
        setSongs((prev) => {
          if (!prev[0]) return prev;
          const updated = [...prev];
          updated[0] = { ...updated[0], audioUrl };
          return updated;
        });
        if (!activeSong) {
          setActiveSong((prev) => (prev ? prev : { ...songs[0], audioUrl }));
        }
      }).catch(console.error);
    } else if (!activeSong && songs[0]) {
      setActiveSong(songs[0]);
    }
  }, []);

  // Save songs to localStorage
  useEffect(() => {
    try {
      // Exclude large blob URLs from local storage to keep it lightweight
      const lightSongs = songs.map(({ audioUrl, ...rest }) => rest);
      localStorage.setItem('isai_ai_songs', JSON.stringify(lightSongs));
    } catch (e) {
      console.warn('Could not persist songs to localStorage:', e);
    }
  }, [songs]);

  // Style Toggling Handler (Radio Button vs Multi Fusion)
  const handleToggleStyle = (styleId: MusicStyleId) => {
    if (selectionMode === 'single') {
      setSelectedStyles([styleId]);
    } else {
      // Fusion mode: toggle in/out
      if (selectedStyles.includes(styleId)) {
        if (selectedStyles.length > 1) {
          setSelectedStyles(selectedStyles.filter((id) => id !== styleId));
        }
      } else {
        setSelectedStyles([...selectedStyles, styleId]);
      }
    }
    setCurrentStep(3);
  };

  // Change Selection Mode (Single/Radio vs Fusion)
  const handleSelectionModeChange = (newMode: 'single' | 'fusion') => {
    setSelectionMode(newMode);
    if (newMode === 'single' && selectedStyles.length > 1) {
      setSelectedStyles([selectedStyles[0]]);
    }
  };

  // Language Change Handler - changes language and automatically syncs default style for that language
  const handleLanguageChange = (langCode: string) => {
    setSelectedLanguage(langCode);
    const defaultStyle = getDefaultStyleForLanguage(langCode);
    setSelectedStyles([defaultStyle]);
    setCurrentStep(3);
  };

  // Apply Inspiration Idea
  const handleApplyInspiration = (prompt: string, styles: MusicStyleId[], langCode: string) => {
    setIdeaText(prompt);
    setSelectedStyles(styles);
    setSelectedLanguage(langCode);
    setMode('idea-to-song');
    setActiveView('studio');
    setCurrentStep(3);
  };

  // Clear idea to guarantee 100% strict isolation between ideas ("don't mix 1st 2nd idea")
  const handleClearIdea = () => {
    setIdeaText('');
    setCustomLyricsText('');
    setActiveView('studio');
    setCurrentStep(2);
  };

  // Create a brand new song
  const handleCreateNewSong = () => {
    setIdeaText('');
    setCustomLyricsText('');
    setActiveView('studio');
    setCurrentStep(2);
    setAutoPlayCurrent(false);
  };

  // Edit / Remix current song idea
  const handleEditActiveIdea = () => {
    if (activeSong) {
      setIdeaText(activeSong.idea || '');
      setSelectedStyles(activeSong.selectedStyles || ['tamil-melody']);
      setSelectedLanguage(activeSong.language || 'ta');
    }
    setActiveView('studio');
    setCurrentStep(2);
    setAutoPlayCurrent(false);
  };

  // Step click handler from ProcessFlowBanner
  const handleStepClick = (stepId: number) => {
    if (stepId <= 3) {
      setActiveView('studio');
      setCurrentStep(stepId === 1 ? 2 : stepId);
    } else if (stepId === 4 && activeSong) {
      setActiveView('player');
      setCurrentStep(6);
      setTimeout(() => {
        playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  // Delete Individual Song Handler
  const handleDeleteSong = (id: string) => {
    setSongs((prev) => prev.filter((s) => s.id !== id));
    if (activeSong?.id === id) {
      const remaining = songs.filter((s) => s.id !== id);
      setActiveSong(remaining.length > 0 ? remaining[0] : null);
      if (remaining.length === 0) {
        setActiveView('studio');
        setCurrentStep(2);
      }
    }
  };

  // Core Generation Function
  const handleGenerateSong = async () => {
    const inputText = mode === 'idea-to-song' ? ideaText.trim() : customLyricsText.trim();
    if (!inputText) {
      alert('Please enter an idea, story, or custom lyrics to generate your song.');
      return;
    }

    setIsGenerating(true);
    setCurrentStep(4);
    setGenerationProgress(15);
    setRealtimeLyrics(null);
    setGenerationPhase('Step 1/3: Analyzing your idea & composing real-time lyrics...');

    // Progress simulation while waiting for lyrics
    const progressTimer = setInterval(() => {
      setGenerationProgress((p) => (p < 55 ? p + 8 : p));
    }, 250);

    try {
      let lyricsData: any = null;

      // 1. Call Backend API for lyrics tailored strictly to the user's idea
      try {
        const res = await fetch('/api/generate-song-lyrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idea: mode === 'idea-to-song' ? inputText : '',
            customLyrics: mode === 'lyrics-to-song' ? inputText : '',
            styles: selectedStyles,
            language: selectedLanguage,
            mode,
          }),
        });

        if (res.ok) {
          lyricsData = await res.json();
        }
      } catch (networkErr) {
        console.warn('Backend lyrics fetch issue, switching to dynamic composer:', networkErr);
      }

      // If backend was slow or unavailable, synthesize real-time lyrics directly for the exact idea
      if (!lyricsData || !lyricsData.title || !lyricsData.fullLyrics) {
        lyricsData = composeLyricsForIdea(inputText, selectedStyles, selectedLanguage);
      }

      clearInterval(progressTimer);

      // Display real-time generated lyrics right inside the generation modal!
      setRealtimeLyrics({
        title: lyricsData.title,
        section: lyricsData.sections?.[0]?.type || 'Pallavi / Chorus',
        lines: lyricsData.sections?.[0]?.lines || [lyricsData.title],
      });

      // 2. Synthesize High-Fidelity Audio & MP3
      setCurrentStep(5);
      setGenerationProgress(65);
      const lyriaModelName = trackLength === 'full' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview';
      setGenerationPhase(`Step 2/3: Generating music audio with Google Lyria (${lyriaModelName})...`);

      const synthTimer = setInterval(() => {
        setGenerationProgress((p) => (p < 92 ? p + 6 : p));
      }, 250);

      let audioResult: { audioUrl: string; duration: number; modelUsed: any } | null = null;
      try {
        audioResult = await generateLyriaOrSynthesizedAudio({
          text: inputText,
          lyrics: lyricsData.fullLyrics,
          styles: selectedStyles,
          language: selectedLanguage,
          trackLength,
          bpm: lyricsData.bpm || 105,
          scale: lyricsData.scale,
          mood: lyricsData.mood,
          instruments: lyricsData.instruments,
          title: lyricsData.title,
        });
      } catch (audioErr) {
        console.warn('Audio call exception, generating local synthesizer audio:', audioErr);
        const synthFallback = await generateSongAudio({
          styles: selectedStyles,
          bpm: lyricsData.bpm || 100,
          scale: lyricsData.scale,
          durationSec: trackLength === 'full' ? 60 : 32,
          title: lyricsData.title,
        });
        audioResult = {
          audioUrl: synthFallback.audioUrl,
          duration: synthFallback.duration,
          modelUsed: 'synthesizer',
        };
      }

      clearInterval(synthTimer);

      setGenerationProgress(98);
      setGenerationPhase('Step 3/3: Saving to My Songs & opening Play / Download...');

      // 3. Assemble complete song
      const isFusion = selectedStyles.length > 1;
      const styleDisplayName = isFusion
        ? selectedStyles
            .map((id) => MUSIC_STYLES.find((s) => s.id === id)?.name)
            .filter(Boolean)
            .join(' + ') + ' Fusion'
        : MUSIC_STYLES.find((s) => s.id === selectedStyles[0])?.name || 'Tamil Melody';

      const langObj = LANGUAGES.find((l) => l.code === selectedLanguage);

      const newSong: GeneratedSong = {
        id: `isai-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: lyricsData.title || 'Pudhu Isai Paattu',
        nativeTitle: lyricsData.nativeTitle,
        idea: inputText,
        selectedStyles,
        isFusion,
        styleDisplayName,
        language: selectedLanguage,
        languageName: langObj ? `${langObj.name} (${langObj.nativeName})` : selectedLanguage,
        bpm: lyricsData.bpm || 100,
        scale: lyricsData.scale || 'Mohanam Ragam',
        mood: lyricsData.mood || 'Soulful & Energetic',
        instruments: lyricsData.instruments || ['Bansuri Flute', 'Thavil', 'Acoustic Guitar'],
        lyrics: lyricsData.fullLyrics,
        sections: lyricsData.sections || [],
        audioUrl: audioResult.audioUrl,
        durationSec: audioResult.duration,
        trackLength,
        modelUsed: audioResult.modelUsed,
        createdAt: Date.now(),
      };

      setGenerationProgress(100);

      // Automatically save to My Songs collection
      setSongs((prev) => [newSong, ...prev.filter((s) => s.id !== newSong.id)]);
      setActiveSong(newSong);
      setSavedToast(`Saved "${newSong.title}" to My Songs!`);
      setTimeout(() => setSavedToast(null), 4000);

      // Transition smoothly to the Play / Download view and start playback
      setTimeout(() => {
        setAutoPlayCurrent(true);
        setCurrentStep(6);
        setActiveView('player');
        setIsGenerating(false);
        setRealtimeLyrics(null);

        // Smooth scroll to top of player
        setTimeout(() => {
          playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }, 450);
    } catch (err: any) {
      clearInterval(progressTimer);
      console.error('Song generation emergency fallback:', err);

      // Guarantee the user always gets their song generated
      const emergencyLyrics = composeLyricsForIdea(inputText, selectedStyles, selectedLanguage);
      const synthRes = await generateSongAudio({
        styles: selectedStyles,
        bpm: emergencyLyrics.bpm || 100,
        scale: emergencyLyrics.scale,
        durationSec: 32,
        title: emergencyLyrics.title,
      });

      const emergencySong: GeneratedSong = {
        id: `isai-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: emergencyLyrics.title,
        nativeTitle: emergencyLyrics.nativeTitle,
        idea: inputText,
        selectedStyles,
        isFusion: selectedStyles.length > 1,
        styleDisplayName: 'Tamil Melody',
        language: selectedLanguage,
        languageName: selectedLanguage,
        bpm: emergencyLyrics.bpm,
        scale: emergencyLyrics.scale,
        mood: emergencyLyrics.mood,
        instruments: emergencyLyrics.instruments,
        lyrics: emergencyLyrics.fullLyrics,
        sections: emergencyLyrics.sections,
        audioUrl: synthRes.audioUrl,
        durationSec: synthRes.duration,
        trackLength: 'clip',
        modelUsed: 'synthesizer',
        createdAt: Date.now(),
      };

      setSongs((prev) => [emergencySong, ...prev.filter((s) => s.id !== emergencySong.id)]);
      setActiveSong(emergencySong);
      setSavedToast(`Saved "${emergencySong.title}" to My Songs!`);
      setTimeout(() => setSavedToast(null), 4000);
      setAutoPlayCurrent(true);
      setCurrentStep(6);
      setActiveView('player');
      setIsGenerating(false);
      setRealtimeLyrics(null);
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        darkMode ? 'bg-neutral-950 text-neutral-100' : 'bg-neutral-50 text-neutral-900'
      }`}
    >
      {/* Navbar */}
      <Navbar
        darkMode={darkMode}
        libraryCount={songs.length}
        onOpenLibrary={() => setShowLibrary(true)}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={handleLanguageChange}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Direct "Hear the Song Only" Banner if opened from a share link */}
        {onlyHearMode && activeSong && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/20 via-orange-500/20 to-amber-500/20 border border-rose-500/30 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
              <span className="text-xs sm:text-sm font-semibold text-rose-500 dark:text-rose-300">
                Shared Song Mode: You are listening directly to "{activeSong.title}"
              </span>
            </div>
            <button
              onClick={() => setOnlyHearMode(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500 text-white hover:bg-rose-600 transition-colors"
            >
              Open Full Studio
            </button>
          </div>
        )}

        {/* Step-by-Step Workflow Pipeline Diagram with Step Navigation */}
        <ProcessFlowBanner
          currentStep={currentStep}
          darkMode={darkMode}
          onStepClick={handleStepClick}
          hasActiveSong={!!activeSong}
        />

        {/* Studio / Play-Download Navigation Tabs */}
        {!onlyHearMode && (
          <div className="flex items-center justify-center gap-2 pt-1 pb-2">
            <button
              id="view-tab-studio"
              type="button"
              onClick={() => {
                setActiveView('studio');
                setCurrentStep(2);
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                activeView === 'studio'
                  ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20'
                  : darkMode
                  ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white'
                  : 'bg-white border-neutral-300 text-neutral-900 hover:bg-neutral-100 hover:text-neutral-950'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>1. Song Studio</span>
            </button>

            <button
              id="view-tab-player"
              type="button"
              onClick={() => {
                if (activeSong) {
                  setActiveView('player');
                  setCurrentStep(6);
                  setTimeout(() => {
                    playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 100);
                }
              }}
              disabled={!activeSong}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                activeView === 'player'
                  ? 'bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 text-white border-transparent shadow-md shadow-rose-500/20'
                  : darkMode
                  ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white'
                  : 'bg-white border-neutral-300 text-neutral-900 hover:bg-neutral-100 hover:text-neutral-950'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <Headphones className="w-4 h-4" />
              <span>2. Play / Download Section</span>
              {activeSong && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  Ready
                </span>
              )}
            </button>

            <button
              id="view-tab-my-songs"
              type="button"
              onClick={() => setShowLibrary((prev) => !prev)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                showLibrary
                  ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20'
                  : darkMode
                  ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white'
                  : 'bg-white border-neutral-300 text-neutral-900 hover:bg-neutral-100 hover:text-neutral-950'
              }`}
            >
              <Library className="w-4 h-4" />
              <span>3. My Songs</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-extrabold border border-rose-500/30">
                {songs.length}
              </span>
            </button>
          </div>
        )}

        {/* Saved to My Songs Notification Toast */}
        {savedToast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/30 animate-bounce">
            <Check className="w-4 h-4" />
            <span>{savedToast}</span>
            <button
              onClick={() => {
                setShowLibrary(true);
                setSavedToast(null);
              }}
              className="ml-2 underline text-white/90 hover:text-white cursor-pointer"
            >
              View in My Songs
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: PLAY / DOWNLOAD SECTION (AUTOMATICALLY OPENED AFTER GENERATION)   */}
        {/* ========================================================================= */}
        {activeView === 'player' && activeSong && (
          <div ref={playerRef} className="space-y-6 scroll-mt-20">
            {/* Celebratory Banner */}
            <div
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                darkMode
                  ? 'bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-rose-950/30 border-emerald-500/30'
                  : 'bg-gradient-to-r from-emerald-50 via-white to-rose-50 border-emerald-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Step 4: Song Ready to Play & Download
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-neutral-900 dark:text-neutral-100">
                    "{activeSong.title}" {activeSong.nativeTitle && `• ${activeSong.nativeTitle}`}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                    <strong className="text-rose-500">Strictly Composed on Idea:</strong> "
                    {activeSong.idea}"
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleEditActiveIdea}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-orange-500" />
                    <span>Edit Idea</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCreateNewSong}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-orange-500 hover:brightness-110 shadow-sm transition-all cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>New Song</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Core Audio Player Card with Full Controls, Lyrics, Waveform & Playback */}
            <AudioPlayerCard
              song={activeSong}
              darkMode={darkMode}
              autoPlay={autoPlayCurrent}
              onDeleteSong={handleDeleteSong}
              onShareSong={(s) => setShareModalSong(s)}
              onEditIdea={handleEditActiveIdea}
              onCreateNewSong={handleCreateNewSong}
            />

            {/* Quick Actions Grid Under Player */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Direct MP3 Download Card */}
              {activeSong.audioUrl && (
                <a
                  href={activeSong.audioUrl}
                  download={`${activeSong.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                    darkMode
                      ? 'bg-neutral-900/60 border-neutral-800 hover:border-emerald-500/50 hover:bg-emerald-500/5'
                      : 'bg-white border-neutral-300 hover:border-emerald-400 hover:bg-emerald-50/50 shadow-sm'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-950 dark:text-neutral-100">
                      Download MP3 Audio
                    </h4>
                    <p className="text-[11px] text-neutral-700 dark:text-neutral-300 font-medium">
                      MPEG-1 Layer 3 • Playable anywhere
                    </p>
                  </div>
                </a>
              )}

              {/* Share Song Card */}
              <button
                type="button"
                onClick={() => setShareModalSong(activeSong)}
                className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                  darkMode
                    ? 'bg-neutral-900/60 border-neutral-800 hover:border-rose-500/50 hover:bg-rose-500/5'
                    : 'bg-white border-neutral-300 hover:border-rose-400 hover:bg-rose-50/50 shadow-sm'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
                  <ExternalLink className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-950 dark:text-neutral-100">
                    Share Direct Song Link
                  </h4>
                  <p className="text-[11px] text-neutral-700 dark:text-neutral-300 font-medium">
                    Generate listen-only link
                  </p>
                </div>
              </button>

              {/* Back to Studio Card */}
              <button
                type="button"
                onClick={() => {
                  setActiveView('studio');
                  setCurrentStep(2);
                }}
                className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                  darkMode
                    ? 'bg-neutral-900/60 border-neutral-800 hover:border-amber-500/50 hover:bg-amber-500/5'
                    : 'bg-white border-neutral-300 hover:border-amber-400 hover:bg-amber-50/50 shadow-sm'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-950 dark:text-neutral-100">
                    Compose Another Track
                  </h4>
                  <p className="text-[11px] text-neutral-700 dark:text-neutral-300 font-medium">
                    Open Studio & input new story
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: STUDIO (INPUT IDEA & SELECT LANGUAGE-SPECIFIC MUSIC STYLES)       */}
        {/* ========================================================================= */}
        {activeView === 'studio' && !onlyHearMode && (
          <div className="space-y-6">
            {/* Quick banner if user has an active song already created */}
            {activeSong && (
              <div
                className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between flex-wrap gap-3 ${
                  darkMode
                    ? 'bg-neutral-900/60 border-neutral-800 text-neutral-200'
                    : 'bg-rose-50/90 border-rose-300 text-neutral-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center">
                    <Music className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-neutral-950 dark:text-white">
                      Active Song in Player: "{activeSong.title}"
                    </span>
                    <p className="text-[11px] text-neutral-700 dark:text-neutral-300 font-medium">
                      {activeSong.styleDisplayName} • {activeSong.languageName}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveView('player');
                    setCurrentStep(6);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500 text-white hover:bg-rose-600 transition-colors shadow-xs"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Open Play / Download Section</span>
                </button>
              </div>
            )}

            {/* Hero Tagline & Status */}
            <div className="text-center max-w-2xl mx-auto pt-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>IsaiAI • Intelligent Text & Lyrics to Music</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-neutral-950 dark:text-white">
                Turn Any Idea or Lyrics into a{' '}
                <span className="bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 bg-clip-text text-transparent">
                  Playable Song
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 font-medium mt-2">
                Type your story or idea below. The AI strictly converts only that idea into song
                lyrics, authentic instruments, and a playable MP3 file.
              </p>
            </div>

            {/* Step 1: Input Idea / Lyrics */}
            <SongInputCard
              darkMode={darkMode}
              mode={mode}
              onModeChange={setMode}
              trackLength={trackLength}
              onTrackLengthChange={setTrackLength}
              ideaText={ideaText}
              onIdeaChange={setIdeaText}
              customLyricsText={customLyricsText}
              onCustomLyricsChange={setCustomLyricsText}
              selectedLanguage={selectedLanguage}
              onLanguageChange={handleLanguageChange}
              onApplyInspiration={handleApplyInspiration}
              onClearIdea={handleClearIdea}
              isGenerating={isGenerating}
              onGenerateSong={handleGenerateSong}
            />

            {/* Step 2: Select Song Style (Language-specific music styles with radio or fusion) */}
            <StyleSelector
              darkMode={darkMode}
              selectedStyles={selectedStyles}
              onToggleStyle={handleToggleStyle}
              selectionMode={selectionMode}
              onSelectionModeChange={handleSelectionModeChange}
              selectedLanguage={selectedLanguage}
              onLanguageChange={handleLanguageChange}
            />

            {/* Main Generate Button CTA */}
            <div className="flex flex-col items-center justify-center pt-2">
              <button
                id="generate-song-main-btn"
                type="button"
                onClick={handleGenerateSong}
                disabled={isGenerating}
                className="group relative flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-base sm:text-lg font-extrabold text-white bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 shadow-xl shadow-rose-500/25 hover:brightness-110 active:scale-98 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Disc3 className="w-6 h-6 animate-spin" />
                    <span>{generationPhase || 'Generating Song & MP3 Audio...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-200 group-hover:rotate-12 transition-transform" />
                    <span>
                      Generate AI Song & MP3 ({selectedStyles.length > 1 ? 'Fusion' : 'Track'})
                    </span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2.5 font-medium">
                Automatically runs in background without approval, opening directly to the Play &
                Download section upon completion.
              </p>
            </div>
          </div>
        )}

        {/* Songs Library Drawer/Section */}
        {showLibrary && (
          <div className="pt-4">
            <SongLibrary
              songs={songs}
              darkMode={darkMode}
              activeSongId={activeSong?.id || null}
              onSelectSong={async (s) => {
                let songToPlay = s;
                if (!s.audioUrl) {
                  try {
                    const synth = await generateSongAudio({
                      styles: s.selectedStyles || ['tamil-melody'],
                      bpm: s.bpm || 100,
                      scale: s.scale,
                      durationSec: s.durationSec || 32,
                      title: s.title,
                    });
                    songToPlay = { ...s, audioUrl: synth.audioUrl };
                    setSongs((prev) => prev.map((item) => (item.id === s.id ? songToPlay : item)));
                  } catch (e) {
                    console.warn('Audio synth error on playback:', e);
                  }
                }
                setActiveSong(songToPlay);
                setAutoPlayCurrent(true);
                setShowLibrary(false);
                setActiveView('player');
                setCurrentStep(6);
                setTimeout(() => {
                  playerRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              onDeleteSong={handleDeleteSong}
              onShareSong={(s) => setShareModalSong(s)}
              onClose={() => setShowLibrary(false)}
            />
          </div>
        )}
      </main>

      {/* Background Generation Process Modal (Fully automatic without manual approvals) */}
      <GenerationModal
        isOpen={isGenerating}
        phase={generationPhase}
        progress={generationProgress}
        ideaText={mode === 'idea-to-song' ? ideaText : customLyricsText}
        selectedStyles={selectedStyles}
        languageName={LANGUAGES.find((l) => l.code === selectedLanguage)?.name || selectedLanguage}
        darkMode={darkMode}
        realtimeLyrics={realtimeLyrics}
      />

      {/* Share Modal */}
      {shareModalSong && (
        <ShareSongModal
          song={shareModalSong}
          darkMode={darkMode}
          onClose={() => setShareModalSong(null)}
        />
      )}

      {/* Floating Dark Mode / Light Mode Toggle Button on Bottom-Right */}
      <ThemeToggle darkMode={darkMode} onToggle={() => setDarkMode(!darkMode)} />
    </div>
  );
}
