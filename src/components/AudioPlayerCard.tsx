import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Download,
  Share2,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Music2,
  Copy,
  Check,
  Disc,
  Trash2,
  Clock,
  Gauge,
  FileDown,
  Edit3,
  PlusCircle,
} from 'lucide-react';
import { GeneratedSong } from '../types';

interface AudioPlayerCardProps {
  song: GeneratedSong;
  darkMode: boolean;
  onDeleteSong?: (id: string) => void;
  onShareSong: (song: GeneratedSong) => void;
  autoPlay?: boolean;
  onEditIdea?: () => void;
  onCreateNewSong?: () => void;
}

export const AudioPlayerCard: React.FC<AudioPlayerCardProps> = ({
  song,
  darkMode,
  onDeleteSong,
  onShareSong,
  autoPlay = false,
  onEditIdea,
  onCreateNewSong,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(song.durationSec || 32);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [copiedLyrics, setCopiedLyrics] = useState(false);
  const [downloadedLyrics, setDownloadedLyrics] = useState(false);
  const [activeTab, setActiveTab] = useState<'karaoke' | 'fullLyrics'>('karaoke');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Initialize or update audio when song changes
  useEffect(() => {
    if (!song.audioUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(song.audioUrl);
    } else {
      audioRef.current.src = song.audioUrl;
    }

    const audio = audioRef.current;
    audio.volume = volume;
    audio.playbackRate = playbackRate;

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
      if (autoPlay) {
        audio.play().then(() => setIsPlaying(true)).catch((e) => console.log('Autoplay was prevented by browser:', e));
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    if (autoPlay) {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.pause();
    };
  }, [song.audioUrl, autoPlay]);

  // Sync playback time loop
  useEffect(() => {
    const updateTime = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
      if (isPlaying) {
        animFrameRef.current = requestAnimationFrame(updateTime);
      }
    };

    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(updateTime);
    } else if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => console.error('Audio play failed:', e));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 0.85;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [0.75, 1.0, 1.25, 1.5];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const handleDownloadMp3 = () => {
    if (!song.audioUrl) return;
    const a = document.createElement('a');
    a.href = song.audioUrl;
    // Clean filename
    const cleanTitle = (song.title || 'IsaiAI_Song').replace(/[^a-zA-Z0-9_\u0B80-\u0BFF]/g, '_');
    a.download = `${cleanTitle}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadLyrics = () => {
    const cleanTitle = (song.title || 'IsaiAI_Lyrics').replace(/[^a-zA-Z0-9_\u0B80-\u0BFF]/g, '_');
    const content = `=====================================================
Title: ${song.title} ${song.nativeTitle ? `(${song.nativeTitle})` : ''}
Musical Style: ${song.styleDisplayName}
Language: ${song.languageName}
Tempo: ${song.bpm} BPM | Scale: ${song.scale} | Mood: ${song.mood}
Original Idea / Story:
"${song.idea}"
Featured Instruments: ${song.instruments.join(', ')}
Created with IsaiAI
=====================================================

LYRICS:

${song.lyrics}
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cleanTitle}_Lyrics.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadedLyrics(true);
    setTimeout(() => setDownloadedLyrics(false), 2500);
  };

  const handleCopyLyrics = () => {
    navigator.clipboard.writeText(song.lyrics);
    setCopiedLyrics(true);
    setTimeout(() => setCopiedLyrics(false), 2000);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Find active lyric line based on current time
  const activeSectionIdx = song.sections.findIndex((sec, i) => {
    const nextSec = song.sections[i + 1];
    if (!nextSec) return true;
    return currentTime >= sec.timestampSec && currentTime < nextSec.timestampSec;
  });

  return (
    <div
      id={`audio-player-card-${song.id}`}
      className={`rounded-2xl p-5 sm:p-7 border transition-all ${
        darkMode
          ? 'bg-neutral-900/95 border-neutral-800 text-neutral-100 shadow-2xl shadow-rose-950/20'
          : 'bg-white border-neutral-200 text-neutral-900 shadow-xl shadow-neutral-200/60'
      }`}
    >
      {/* Top Banner: Title, Native Script, Fusion tags, Actions */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center flex-wrap gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              {song.isFusion ? '✦ Fusion Track' : '● Signature Style'}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
              {song.languageName}
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
              {song.bpm} BPM
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
              {song.scale}
            </span>
            {song.modelUsed && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {song.modelUsed === 'lyria-3-pro-preview'
                  ? 'Lyria 3 Pro'
                  : song.modelUsed === 'lyria-3-clip-preview'
                  ? 'Lyria 3 Clip'
                  : 'Synthesized MP3'}
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 dark:text-white">
            {song.title}
          </h2>
          {song.nativeTitle && (
            <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 mt-0.5">
              {song.nativeTitle}
            </p>
          )}

          <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-1 max-w-xl font-medium">
            <strong className="text-neutral-900 dark:text-white font-bold">Style:</strong> {song.styleDisplayName} •{' '}
            <strong className="text-neutral-900 dark:text-white font-bold">Mood:</strong> {song.mood}
          </p>
        </div>

        {/* Action Buttons: Share, Download MP3, Download Lyrics, Edit Idea, Delete */}
        <div className="flex items-center flex-wrap gap-2 self-start sm:self-auto">
          {onEditIdea && (
            <button
              id={`edit-idea-btn-${song.id}`}
              onClick={onEditIdea}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                darkMode
                  ? 'bg-neutral-800/80 border-neutral-700 text-neutral-200 hover:bg-neutral-700'
                  : 'bg-neutral-100 border-neutral-200 text-neutral-800 hover:bg-neutral-200'
              }`}
              title="Edit or adjust this song's idea in the studio"
            >
              <Edit3 className="w-3.5 h-3.5 text-orange-500" />
              <span>Edit Idea</span>
            </button>
          )}

          {onCreateNewSong && (
            <button
              id={`create-new-btn-${song.id}`}
              onClick={onCreateNewSong}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                darkMode
                  ? 'bg-neutral-800/80 border-neutral-700 text-neutral-200 hover:bg-neutral-700'
                  : 'bg-neutral-100 border-neutral-200 text-neutral-800 hover:bg-neutral-200'
              }`}
              title="Create a brand new song with a new idea"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>New Song</span>
            </button>
          )}

          <button
            id={`share-btn-${song.id}`}
            onClick={() => onShareSong(song)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              darkMode
                ? 'bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700'
                : 'bg-neutral-100 border-neutral-200 text-neutral-800 hover:bg-neutral-200'
            }`}
            title="Get direct share link for hearing this song only"
          >
            <Share2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Share</span>
          </button>

          <button
            id={`download-lyrics-btn-${song.id}`}
            onClick={handleDownloadLyrics}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              downloadedLyrics
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                : darkMode
                ? 'bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700'
                : 'bg-neutral-100 border-neutral-200 text-neutral-800 hover:bg-neutral-200'
            }`}
            title="Download song lyrics and structure as a text (.txt) file"
          >
            {downloadedLyrics ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <FileDown className="w-3.5 h-3.5 text-amber-500" />}
            <span>{downloadedLyrics ? 'Lyrics Saved' : 'Lyrics (.txt)'}</span>
          </button>

          <button
            id={`download-mp3-btn-${song.id}`}
            onClick={handleDownloadMp3}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 text-white shadow-md shadow-rose-500/20 hover:brightness-110 active:scale-95 transition-all"
            title="Download playable MP3 format compatible with all players"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download MP3</span>
          </button>

          {onDeleteSong && (
            <button
              id={`delete-song-btn-${song.id}`}
              onClick={() => onDeleteSong(song.id)}
              className={`p-2 rounded-xl border text-neutral-400 hover:text-red-500 hover:border-red-300 dark:hover:border-red-900/50 transition-colors ${
                darkMode ? 'bg-neutral-800/60 border-neutral-700/60' : 'bg-neutral-100 border-neutral-200'
              }`}
              title="Remove this song individually"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Interactive Visualizer & Vinyl Display */}
      <div className="py-6 flex flex-col items-center justify-center">
        <div className="relative mb-5">
          {/* Animated Vinyl Record Graphic */}
          <div
            className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-neutral-800 flex items-center justify-center shadow-xl transition-transform ${
              isPlaying ? 'animate-spin-slow' : ''
            } bg-gradient-to-tr from-neutral-900 via-neutral-950 to-neutral-900`}
          >
            {/* Vinyl Grooves */}
            <div className="w-20 h-20 rounded-full border border-neutral-700/40 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border border-neutral-700/60 flex items-center justify-center bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-inner">
                <Disc className="w-6 h-6 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Quick Play Trigger badge */}
          <button
            onClick={togglePlay}
            className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
        </div>

        {/* Animated Frequency Audio Visualizer Bars */}
        <div className="w-full max-w-md h-12 flex items-end justify-center gap-1 sm:gap-1.5 px-4">
          {Array.from({ length: 28 }).map((_, i) => {
            // Simulated frequency height when playing
            const minH = 15;
            const maxH = 100;
            const randomH = isPlaying
              ? Math.sin((i / 4) + currentTime * 8) * 35 + 50 + Math.random() * 20
              : minH;
            const heightPct = Math.min(100, Math.max(12, randomH));

            return (
              <div
                key={i}
                className={`w-full rounded-full transition-all duration-75 ${
                  isPlaying
                    ? 'bg-gradient-to-t from-rose-600 via-orange-500 to-amber-400'
                    : darkMode
                    ? 'bg-neutral-800'
                    : 'bg-neutral-200'
                }`}
                style={{ height: `${heightPct}%` }}
              />
            );
          })}
        </div>
      </div>

      {/* Scrubber & Time Bar */}
      <div className="mb-4">
        <input
          type="range"
          id={`seek-bar-${song.id}`}
          min={0}
          max={duration || 32}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-2 rounded-lg bg-neutral-200 dark:bg-neutral-800 accent-rose-500 cursor-pointer transition-all"
        />
        <div className="flex items-center justify-between text-xs font-mono text-neutral-800 dark:text-neutral-200 font-bold mt-1">
          <span>{formatTime(currentTime)}</span>
          <span className="font-bold text-rose-600 dark:text-rose-400">Playable MP3 Format</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main Transport Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4 py-3 px-4 rounded-xl bg-neutral-100/90 dark:bg-neutral-950/80 border border-neutral-300 dark:border-neutral-800 mb-6">
        {/* Play / Pause & Replay */}
        <div className="flex items-center gap-3">
          <button
            id={`main-play-btn-${song.id}`}
            onClick={togglePlay}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-rose-500 text-white shadow-md shadow-rose-500/30 hover:bg-rose-600 active:scale-95 transition-all"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          <button
            onClick={() => {
              if (audioRef.current) audioRef.current.currentTime = 0;
              setCurrentTime(0);
            }}
            className="p-2 rounded-lg text-neutral-700 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white transition-colors"
            title="Restart song"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Speed Selector */}
          <button
            onClick={cyclePlaybackRate}
            className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-300"
            title="Change Playback Speed"
          >
            {playbackRate}x
          </button>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="text-neutral-700 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white"
          >
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-20 sm:w-24 h-1.5 rounded-lg bg-neutral-300 dark:bg-neutral-700 accent-rose-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Lyrics Follow-Along & Karaoke Section */}
      <div className="mt-4">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('karaoke')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'karaoke'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-neutral-700 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white'
              }`}
            >
              🎤 Sing & Follow-Along (Karaoke)
            </button>
            <button
              onClick={() => setActiveTab('fullLyrics')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'fullLyrics'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-neutral-700 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white'
              }`}
            >
              Full Lyrics Text
            </button>
          </div>

          <button
            onClick={handleCopyLyrics}
            className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md transition-colors ${
              copiedLyrics
                ? 'text-emerald-500'
                : 'text-neutral-700 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white'
            }`}
          >
            {copiedLyrics ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLyrics ? 'Copied!' : 'Copy Lyrics'}</span>
          </button>
        </div>

        {activeTab === 'karaoke' ? (
          <div className="space-y-4 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
            {song.sections.map((section, sIdx) => {
              const isCurrent = activeSectionIdx === sIdx;

              return (
                <div
                  key={sIdx}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isCurrent
                      ? darkMode
                        ? 'bg-rose-500/15 border-rose-500/50 ring-1 ring-rose-500/30'
                        : 'bg-rose-50 border-rose-400 ring-1 ring-rose-200'
                      : darkMode
                      ? 'bg-neutral-950/60 border-neutral-800'
                      : 'bg-neutral-50/90 border-neutral-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider ${
                        isCurrent ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-800 dark:text-neutral-200'
                      }`}
                    >
                      {section.type}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-600 dark:text-neutral-400 font-semibold">
                      ~{formatTime(section.timestampSec)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {section.lines.map((line, lIdx) => (
                      <p
                        key={lIdx}
                        className={`text-sm sm:text-base leading-relaxed ${
                          isCurrent
                            ? 'font-bold text-neutral-950 dark:text-white'
                            : 'font-medium text-neutral-800 dark:text-neutral-200'
                        }`}
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className={`p-4 rounded-xl border text-sm font-mono whitespace-pre-line leading-relaxed max-h-72 overflow-y-auto font-medium ${
              darkMode ? 'bg-neutral-950/80 border-neutral-800 text-neutral-100' : 'bg-neutral-50 border-neutral-300 text-neutral-950'
            }`}
          >
            {song.lyrics}
          </div>
        )}
      </div>

      {/* Featured Instruments Footer */}
      <div className="mt-5 pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between flex-wrap gap-2 text-xs text-neutral-700 dark:text-neutral-300 font-medium">
        <div className="flex items-center gap-1.5">
          <Music2 className="w-3.5 h-3.5 text-rose-500" />
          <span>Featured Instruments:</span>
          <span className="font-bold text-neutral-950 dark:text-white">
            {song.instruments.join(', ')}
          </span>
        </div>

        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
          <Check className="w-3 h-3" /> Fully Playable on All Devices
        </span>
      </div>
    </div>
  );
};
