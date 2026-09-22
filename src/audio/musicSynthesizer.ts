import { MusicStyleId, LyricSection } from '../types';
import { audioBufferToMp3Blob } from './mp3Encoder';

interface SynthesisParams {
  styles: MusicStyleId[];
  bpm: number;
  scale?: string;
  durationSec?: number;
  sections?: LyricSection[];
  title?: string;
  lyrics?: string;
  language?: string;
}

// Note frequencies in Hz
const NOTE_FREQS: Record<string, number> = {
  'C2': 65.41, 'D2': 73.42, 'E2': 82.41, 'F2': 87.31, 'G2': 98.00, 'A2': 110.00, 'B2': 123.47,
  'C3': 130.81, 'D3': 146.83, 'Eb3': 155.56, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'Ab3': 207.65, 'A3': 220.00, 'Bb3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'D4': 293.66, 'Eb4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'Ab4': 415.30, 'A4': 440.00, 'Bb4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'D5': 587.33, 'Eb5': 622.25, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
};

// Ragam / Scale definitions for melodic generation
const RAGAMS: Record<string, number[]> = {
  // Mohanam / Pentatonic Major: Sa Ri2 Ga3 Pa Dha2 (C, D, E, G, A) - quintessential Tamil melody / 80s / folk
  mohanam: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25],
  // Kalyani / Lydian: Sa Ri2 Ga3 Ma2 Pa Dha2 Ni3 - grand, cinematic, emotional
  kalyani: [261.63, 293.66, 329.63, 369.99, 392.00, 440.00, 493.88, 523.25],
  // Mayamalavagowla: Sa Ri1 Ga3 Ma1 Pa Dha1 Ni3 - soulful, devotional Carnatic
  mayamalavagowla: [261.63, 277.18, 329.63, 349.23, 392.00, 415.30, 493.88, 523.25],
  // Natabhairavi / Minor: Sa Ri2 Ga2 Ma1 Pa Dha1 Ni2 - energetic kuthu / gaana / rap
  natabhairavi: [261.63, 293.66, 311.13, 349.23, 392.00, 415.30, 466.16, 523.25],
  // Kharaharapriya / Dorian: Sa Ri2 Ga2 Ma1 Pa Dha2 Ni2 - 90s AR Rahman magic
  kharaharapriya: [261.63, 293.66, 311.13, 349.23, 392.00, 440.00, 466.16, 523.25]
};

// Helper to match style IDs flexibly across multiple regional and cultural genres
function matchStyle(style: string | null | undefined, keywords: string[]): boolean {
  if (!style) return false;
  const lower = style.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

/**
 * Creates high-quality procedural audio for the requested style(s) and encodes into MP3.
 */
export async function generateSongAudio(params: SynthesisParams): Promise<{ audioBlob: Blob; audioUrl: string; duration: number }> {
  const duration = params.durationSec || 32; // Default 32 seconds full structured movement
  const sampleRate = 24000; // Optimized sample rate for ultra-fast rendering (<120ms) and instant MP3 encoding
  const ctx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

  const bpm = params.bpm || 110;
  const beatSec = 60 / bpm;
  const totalBeats = Math.floor(duration / beatSec);

  const primaryStyle = params.styles[0] || 'tamil-melody';
  const isFusion = params.styles.length > 1;
  const secondaryStyle = isFusion ? params.styles[1] : null;

  // Master Gain & Limiter
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.72, 0);

  // Soft fade out at end
  masterGain.gain.setValueAtTime(0.72, duration - 2.5);
  masterGain.gain.linearRampToValueAtTime(0.001, duration);
  masterGain.connect(ctx.destination);

  const vocalBus = ctx.createGain();
  vocalBus.gain.setValueAtTime(0.8, 0);
  vocalBus.connect(masterGain);

  // Reverb simulation bus (convolver / stereo delay)
  const reverbGain = ctx.createGain();
  reverbGain.gain.setValueAtTime(0.25, 0);
  reverbGain.connect(masterGain);

  const delayNode = ctx.createDelay();
  delayNode.delayTime.setValueAtTime(beatSec * 0.75, 0);
  const delayFeedback = ctx.createGain();
  delayFeedback.gain.setValueAtTime(0.3, 0);
  delayNode.connect(delayFeedback);
  delayFeedback.connect(delayNode);
  delayNode.connect(reverbGain);

  // Select scale based on style family
  let scale = RAGAMS.mohanam;
  if (matchStyle(primaryStyle, ['carnatic', 'sopanam', 'haridasa', 'ghazal', 'enka', 'neoclassical', 'devotional', 'tango'])) {
    scale = RAGAMS.mayamalavagowla;
  } else if (matchStyle(primaryStyle, ['kuthu', 'gaana', 'rap', 'hiphop', 'hip-hop', 'mass', 'teenmaar', 'trap', 'drill', 'gully', 'flamenco'])) {
    scale = RAGAMS.natabhairavi;
  } else if (matchStyle(primaryStyle, ['90s', 'rahman', 'lofi', 'rnb', 'soul', 'bossa', 'indie', 'city-pop', 'dream', 'chanson'])) {
    scale = RAGAMS.kharaharapriya;
  } else if (matchStyle(primaryStyle, ['cinematic', 'epic', 'anime', 'blockbuster', 'orchestral', 'kalyani'])) {
    scale = RAGAMS.kalyani;
  }

  // 1. Synth Rhythm & Percussion Layer
  renderPercussionLayer(ctx, masterGain, {
    primaryStyle,
    secondaryStyle,
    bpm,
    beatSec,
    totalBeats,
    duration,
  });

  // 2. Bassline Layer
  renderBassLayer(ctx, masterGain, {
    primaryStyle,
    secondaryStyle,
    bpm,
    beatSec,
    totalBeats,
    scale,
  });

  // 3. Harmony & Chords Layer (Pads, Guitar arpeggios, Harmonium, or Tanpura)
  renderHarmonyLayer(ctx, masterGain, delayNode, {
    primaryStyle,
    secondaryStyle,
    beatSec,
    totalBeats,
    scale,
  });

  // 4. Melodic Lead & Signature Hook Layer (Flute, Veena, Violin, Synth Lead, Whistle)
  renderMelodyLayer(ctx, masterGain, delayNode, {
    primaryStyle,
    secondaryStyle,
    beatSec,
    totalBeats,
    scale,
    duration,
  });

  // 5. Vocal layer: sing the actual lyrics with a voice-like synth timbre so the result is not karaoke-only.
  renderVocalLayer(ctx, vocalBus, {
    lyrics: params.lyrics || '',
    beatSec,
    duration,
    scale,
  });

  // Render audio offline
  const renderedBuffer = await ctx.startRendering();

  // Encode to genuine MP3 blob
  const audioBlob = audioBufferToMp3Blob(renderedBuffer, 128);
  const audioUrl = URL.createObjectURL(audioBlob);

  return {
    audioBlob,
    audioUrl,
    duration,
  };
}

// ==========================================
// LAYER 1: PERCUSSION & DRUMS
// ==========================================
function renderPercussionLayer(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  opts: { primaryStyle: MusicStyleId; secondaryStyle: MusicStyleId | null; bpm: number; beatSec: number; totalBeats: number; duration: number }
) {
  const { primaryStyle, secondaryStyle, beatSec, totalBeats } = opts;

  // Determine percussion patterns across all regional and world genres
  const isKuthu = matchStyle(primaryStyle, ['kuthu', 'mass', 'bhangra', 'teenmaar', 'reggaeton', 'edm', 'pooram', 'kunitha', 'dance']) ||
                  matchStyle(secondaryStyle, ['kuthu', 'mass', 'bhangra', 'teenmaar', 'reggaeton', 'edm', 'pooram', 'kunitha', 'dance']);
  const isGaana = matchStyle(primaryStyle, ['gaana', 'cumbia', 'salsa', 'bachata', 'musette']) ||
                  matchStyle(secondaryStyle, ['gaana', 'cumbia', 'salsa', 'bachata', 'musette']);
  const isCarnatic = matchStyle(primaryStyle, ['carnatic', 'sopanam', 'haridasa', 'ghazal', 'enka', 'neoclassical']) ||
                     matchStyle(secondaryStyle, ['carnatic', 'sopanam', 'haridasa', 'ghazal', 'enka', 'neoclassical']);
  const is80s = matchStyle(primaryStyle, ['80s', 'retro', 'disco', 'synthwave', 'city-pop', 'manouche', 'vintage']) ||
                matchStyle(secondaryStyle, ['80s', 'retro', 'disco', 'synthwave', 'city-pop', 'manouche', 'vintage']);
  const isRap = matchStyle(primaryStyle, ['rap', 'hiphop', 'hip-hop', 'trap', 'drill', 'gully', 'rock', 'jrock', 'visual-kei']) ||
                matchStyle(secondaryStyle, ['rap', 'hiphop', 'hip-hop', 'trap', 'drill', 'gully', 'rock', 'jrock', 'visual-kei']);
  const isFolk = matchStyle(primaryStyle, ['folk', 'janapada', 'oggu', 'vanchipattu', 'chenda', 'garba', 'yakshagana', 'country', 'flamenco', 'mariachi']) ||
                 matchStyle(secondaryStyle, ['folk', 'janapada', 'oggu', 'vanchipattu', 'chenda', 'garba', 'yakshagana', 'country', 'flamenco', 'mariachi']);
  const isModern = matchStyle(primaryStyle, ['modern', 'cinema', 'pop', 'anime', 'vocaloid', 'touch', 'afropop']) ||
                   matchStyle(secondaryStyle, ['modern', 'cinema', 'pop', 'anime', 'vocaloid', 'touch', 'afropop']);

  for (let b = 0; b < totalBeats; b++) {
    const time = b * beatSec;
    const barBeat = b % 4;

    // A. Kick / Thavil Bass / Mridangam Thom
    if (isKuthu || isModern) {
      // 4-on-the-floor driving punch with syncopated thavil accents
      playKick(ctx, dest, time, 1.0, 75);
      if (b % 2 === 1) {
        playThavilRoll(ctx, dest, time + beatSec * 0.5, 0.7);
        playThavilRoll(ctx, dest, time + beatSec * 0.75, 0.85);
      }
    } else if (isGaana) {
      // Classic Madras tap chatti groove (beat 1, 2.5, 3.5)
      playKick(ctx, dest, time, 0.9, 85);
      playGaanaChatti(ctx, dest, time + beatSec * 0.5, 0.6);
      playGaanaChatti(ctx, dest, time + beatSec * 0.75, 0.8);
    } else if (isCarnatic) {
      // Mridangam Tha-Dhi-Thom-Nam
      if (barBeat === 0) playMridangamThom(ctx, dest, time, 0.85);
      if (barBeat === 2) playMridangamChapu(ctx, dest, time, 0.8);
      playMridangamNam(ctx, dest, time + beatSec * 0.5, 0.5);
    } else if (is80s) {
      // Vintage 80s Disco / Ilayaraja Drum Groove
      if (barBeat === 0 || barBeat === 2) playKick(ctx, dest, time, 0.9, 90);
      if (barBeat === 1 || barBeat === 3) playSnare(ctx, dest, time, 0.75);
    } else if (isRap) {
      // Trap 808
      if (barBeat === 0) play808Sub(ctx, dest, time, 1.0);
      if (barBeat === 2) playSnare(ctx, dest, time, 0.85);
    } else if (isFolk) {
      // Parai drums & urumee
      playParaiDrum(ctx, dest, time, 0.9);
      playParaiDrum(ctx, dest, time + beatSec * 0.5, 0.65);
    } else {
      // Tamil Melody / Acoustic / 90s Rahman soft tabla
      if (barBeat === 0 || barBeat === 2) playSoftTablaBayya(ctx, dest, time, 0.7);
      playSoftTablaDayya(ctx, dest, time + beatSec * 0.5, 0.45);
    }

    // B. Hi-Hats & Shakers / Manjira
    const stepCount = isRap ? 4 : (isKuthu ? 4 : 2);
    for (let s = 0; s < stepCount; s++) {
      const stepTime = time + (s * beatSec) / stepCount;
      const isAccent = s % 2 === 0;
      playHiHat(ctx, dest, stepTime, isAccent ? 0.35 : 0.2, isKuthu ? 0.04 : 0.06);
    }

    // C. Whistle Drops in Kuthu
    if (isKuthu && b % 16 === 12) {
      playKuthuWhistle(ctx, dest, time);
    }
  }
}

// ==========================================
// LAYER 2: BASSLINE
// ==========================================
function renderBassLayer(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  opts: { primaryStyle: MusicStyleId; secondaryStyle: MusicStyleId | null; bpm: number; beatSec: number; totalBeats: number; scale: number[] }
) {
  const { primaryStyle, secondaryStyle, beatSec, totalBeats, scale } = opts;
  const is80s = matchStyle(primaryStyle, ['80s', 'retro', 'disco', 'synthwave', 'city-pop', 'manouche', 'vintage']) ||
                matchStyle(secondaryStyle, ['80s', 'retro', 'disco', 'synthwave', 'city-pop', 'manouche', 'vintage']);
  const isRap = matchStyle(primaryStyle, ['rap', 'hiphop', 'hip-hop', 'trap', 'drill', 'gully', 'rock', 'jrock', 'visual-kei']) ||
                matchStyle(secondaryStyle, ['rap', 'hiphop', 'hip-hop', 'trap', 'drill', 'gully', 'rock', 'jrock', 'visual-kei']);
  const isKuthu = matchStyle(primaryStyle, ['kuthu', 'mass', 'bhangra', 'teenmaar', 'reggaeton', 'edm', 'pooram', 'kunitha', 'dance']) ||
                  matchStyle(secondaryStyle, ['kuthu', 'mass', 'bhangra', 'teenmaar', 'reggaeton', 'edm', 'pooram', 'kunitha', 'dance']);

  const rootFreq = scale[0] / 4; // C1/C2 region (~65Hz)
  const fifthFreq = scale[3] / 4; // G (~98Hz)
  const fourthFreq = scale[2] / 4; // F / E

  const bassNotes = [rootFreq, rootFreq, fifthFreq, fourthFreq];

  for (let b = 0; b < totalBeats; b++) {
    const time = b * beatSec;
    const noteIdx = Math.floor(b / 4) % bassNotes.length;
    const freq = bassNotes[noteIdx];

    if (is80s) {
      // Slap Bass 16th groove (Ilayaraja style)
      playSlapBass(ctx, dest, time, freq, beatSec * 0.45);
      playSlapBass(ctx, dest, time + beatSec * 0.5, freq * 1.5, beatSec * 0.3);
    } else if (isRap) {
      // 808 Glide Bass
      if (b % 4 === 0) {
        playGlide808(ctx, dest, time, freq, beatSec * 2.5);
      }
    } else if (isKuthu) {
      // Punchy 8th note bass stabs
      playSynthBass(ctx, dest, time, freq, beatSec * 0.4);
      playSynthBass(ctx, dest, time + beatSec * 0.5, freq, beatSec * 0.3);
    } else {
      // Warm Sub Bass for Melodies
      if (b % 2 === 0) {
        playWarmSubBass(ctx, dest, time, freq, beatSec * 1.8);
      }
    }
  }
}

// ==========================================
// LAYER 3: HARMONY & CHORDS
// ==========================================
function renderHarmonyLayer(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  reverbNode: AudioNode,
  opts: { primaryStyle: MusicStyleId; secondaryStyle: MusicStyleId | null; beatSec: number; totalBeats: number; scale: number[] }
) {
  const { primaryStyle, secondaryStyle, beatSec, totalBeats, scale } = opts;
  const isCarnatic = matchStyle(primaryStyle, ['carnatic', 'sopanam', 'haridasa', 'ghazal', 'enka', 'neoclassical', 'devotional']) ||
                     matchStyle(secondaryStyle, ['carnatic', 'sopanam', 'haridasa', 'ghazal', 'enka', 'neoclassical', 'devotional']);
  const is90s = matchStyle(primaryStyle, ['90s', 'rahman', 'keeravani', 'johnson', 'bhavageethe', 'lofi', 'ambient', 'dream']) ||
                matchStyle(secondaryStyle, ['90s', 'rahman', 'keeravani', 'johnson', 'bhavageethe', 'lofi', 'ambient', 'dream']);
  const isMelody = matchStyle(primaryStyle, ['melody', 'romantic', 'chanson', 'acoustic', 'indie', 'rnb', 'soul', 'geetamu', 'folk']) ||
                   matchStyle(secondaryStyle, ['melody', 'romantic', 'chanson', 'acoustic', 'indie', 'rnb', 'soul', 'geetamu', 'folk']);

  if (isCarnatic) {
    // Tanpura Drone in Sa-Pa-Sa (C3, G3, C4) with continuous subtle chorus
    playTanpuraDrone(ctx, dest, reverbNode, scale[0], totalBeats * beatSec);
    return;
  }

  // Chord progression every 4 beats: I - vi - IV - V (or I - IV - vi - V)
  const chordRoots = [scale[0], scale[4] || scale[3], scale[2] || scale[1], scale[3]];

  for (let bar = 0; bar < Math.floor(totalBeats / 4); bar++) {
    const time = bar * 4 * beatSec;
    const root = chordRoots[bar % chordRoots.length];
    const third = root * 1.25; // Major 3rd or ~minor 3rd
    const fifth = root * 1.5; // Perfect 5th

    if (is90s) {
      // Ethereal AR Rahman 90s Lush Pad Swell
      playEtherealPad(ctx, dest, reverbNode, time, [root, third, fifth], beatSec * 4);
    } else if (isMelody) {
      // Acoustic Guitar / Rhodes Arpeggio
      for (let step = 0; step < 8; step++) {
        const arpTime = time + step * (beatSec * 0.5);
        const note = [root, third, fifth, root * 2][step % 4];
        playAcousticPluck(ctx, dest, reverbNode, arpTime, note);
      }
    } else {
      // Brass / Synth Chords
      playSynthChords(ctx, dest, time, [root, third, fifth], beatSec * 1.8);
      playSynthChords(ctx, dest, time + beatSec * 2, [root, third, fifth], beatSec * 1.6);
    }
  }
}

// ==========================================
// LAYER 4: MELODIC LEAD & SIGNATURE HOOKS
// ==========================================
function renderMelodyLayer(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  reverbNode: AudioNode,
  opts: { primaryStyle: MusicStyleId; secondaryStyle: MusicStyleId | null; beatSec: number; totalBeats: number; scale: number[]; duration: number }
) {
  const { primaryStyle, secondaryStyle, beatSec, totalBeats, scale } = opts;
  const isCarnatic = matchStyle(primaryStyle, ['carnatic', 'sopanam', 'haridasa', 'ghazal', 'enka', 'devotional']) ||
                     matchStyle(secondaryStyle, ['carnatic', 'sopanam', 'haridasa', 'ghazal', 'enka', 'devotional']);
  const isMelody = matchStyle(primaryStyle, ['melody', 'romantic', 'chanson', 'acoustic', 'indie', 'rnb', 'soul', 'geetamu']) ||
                   matchStyle(secondaryStyle, ['melody', 'romantic', 'chanson', 'acoustic', 'indie', 'rnb', 'soul', 'geetamu']);
  const is80s = matchStyle(primaryStyle, ['80s', 'retro', 'disco', 'synthwave', 'city-pop', 'vintage']) ||
                matchStyle(secondaryStyle, ['80s', 'retro', 'disco', 'synthwave', 'city-pop', 'vintage']);
  const isKuthu = matchStyle(primaryStyle, ['kuthu', 'mass', 'bhangra', 'teenmaar', 'reggaeton', 'edm', 'pooram', 'kunitha', 'dance']) ||
                  matchStyle(secondaryStyle, ['kuthu', 'mass', 'bhangra', 'teenmaar', 'reggaeton', 'edm', 'pooram', 'kunitha', 'dance']);
  const isGaana = matchStyle(primaryStyle, ['gaana', 'cumbia', 'salsa', 'bachata', 'musette', 'folk']) ||
                  matchStyle(secondaryStyle, ['gaana', 'cumbia', 'salsa', 'bachata', 'musette', 'folk']);

  // Compose a catchy 4-bar phrase repeated with variations
  const phrase = [
    { beat: 0, dur: 1.0, deg: 0 },
    { beat: 1, dur: 0.5, deg: 1 },
    { beat: 1.5, dur: 0.5, deg: 2 },
    { beat: 2, dur: 1.0, deg: 4 },
    { beat: 3, dur: 0.75, deg: 3 },
    { beat: 4, dur: 1.5, deg: 2 },
    { beat: 5.5, dur: 0.5, deg: 3 },
    { beat: 6, dur: 1.0, deg: 4 },
    { beat: 7, dur: 1.0, deg: 5 },
    { beat: 8, dur: 1.5, deg: 4 },
    { beat: 10, dur: 0.5, deg: 3 },
    { beat: 10.5, dur: 0.5, deg: 2 },
    { beat: 11, dur: 1.0, deg: 1 },
    { beat: 12, dur: 2.0, deg: 0 },
  ];

  for (let b = 0; b < totalBeats; b += 16) {
    for (const item of phrase) {
      const noteTime = (b + item.beat) * beatSec;
      if (noteTime >= totalBeats * beatSec - 1) break;

      const deg = item.deg % scale.length;
      const freq = scale[deg] * (item.deg >= scale.length ? 2 : 1);
      const noteDuration = item.dur * beatSec;

      if (isCarnatic) {
        // Veena / Violin with Gamakas (subtle pitch glide & vibrato)
        playVeenaNote(ctx, dest, reverbNode, noteTime, freq, noteDuration);
      } else if (isMelody) {
        // Bansuri Indian Bamboo Flute Lead with breath vibrato
        playBansuriFlute(ctx, dest, reverbNode, noteTime, freq, noteDuration);
      } else if (is80s) {
        // Ilayaraja 80s Strings & Acoustic Flute counterpoint
        play80sViolinLead(ctx, dest, reverbNode, noteTime, freq, noteDuration);
      } else if (isKuthu || isGaana) {
        // Catchy Folk Synth Hook / Nadaswaram style
        playKuthuLeadHook(ctx, dest, reverbNode, noteTime, freq, noteDuration);
      } else {
        // Modern Synth Lead
        playModernCinemaLead(ctx, dest, reverbNode, noteTime, freq, noteDuration);
      }
    }
  }
}

function renderVocalLayer(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  opts: { lyrics: string; beatSec: number; duration: number; scale: number[] }
) {
  const { lyrics, beatSec, duration, scale } = opts;
  if (!lyrics || !lyrics.trim()) return;

  const words = lyrics
    .replace(/[\n\r]+/g, ' ')
    .replace(/[_*#•]/g, ' ')
    .split(/\s+/)
    .map((word) => word.replace(/[^A-Za-z0-9\u0B80-\u0BFF]/g, ''))
    .filter(Boolean);

  if (words.length === 0) return;

  const syllableStep = Math.max(0.38, beatSec * 0.75);
  let timeCursor = 0;

  for (let i = 0; i < words.length && timeCursor < duration - 0.35; i++) {
    const word = words[i];
    const noteIndex = (i * 2) % scale.length;
    const baseFreq = scale[noteIndex] * (1 + ((i % 3) * 0.09));
    const syllables = Math.max(1, Math.min(3, Math.ceil(word.length / 2)));

    for (let s = 0; s < syllables; s++) {
      const syllableTime = timeCursor + s * syllableStep * 0.55;
      if (syllableTime >= duration - 0.2) break;
      const freq = baseFreq * (1 + (s % 2) * 0.06 + (i % 5) * 0.02);
      const dur = Math.min(0.48, beatSec * 0.9 + (s * 0.08));
      playVocalSyllable(ctx, dest, syllableTime, freq, dur);
    }

    timeCursor += beatSec * (i % 2 === 0 ? 0.8 : 1.0);
  }
}

function playVocalSyllable(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  time: number,
  freq: number,
  dur: number
) {
  const bodyOsc = ctx.createOscillator();
  const overtoneOsc = ctx.createOscillator();
  const formantOsc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  const vibrato = ctx.createOscillator();
  const vibratoGain = ctx.createGain();

  bodyOsc.type = 'triangle';
  bodyOsc.frequency.setValueAtTime(freq, time);

  overtoneOsc.type = 'sine';
  overtoneOsc.frequency.setValueAtTime(freq * 2.0, time);

  formantOsc.type = 'sine';
  formantOsc.frequency.setValueAtTime(freq * 3.0, time);

  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(freq * 1.4, time);
  filter.Q.setValueAtTime(3.0, time);

  vibrato.frequency.setValueAtTime(5.2, time);
  vibratoGain.gain.setValueAtTime(freq * 0.019, time);
  vibrato.connect(vibratoGain);
  vibratoGain.connect(bodyOsc.frequency);
  vibratoGain.connect(overtoneOsc.frequency);
  vibratoGain.connect(formantOsc.frequency);

  gain.gain.setValueAtTime(0.001, time);
  gain.gain.linearRampToValueAtTime(0.35, time + 0.04);
  gain.gain.linearRampToValueAtTime(0.26, time + dur * 0.7);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

  bodyOsc.connect(filter);
  overtoneOsc.connect(filter);
  formantOsc.connect(filter);
  filter.connect(gain);
  gain.connect(dest);

  bodyOsc.start(time);
  overtoneOsc.start(time);
  formantOsc.start(time);
  vibrato.start(time);

  bodyOsc.stop(time + dur);
  overtoneOsc.stop(time + dur);
  formantOsc.stop(time + dur);
  vibrato.stop(time + dur);
}

// ==========================================
// INSTRUMENT SYNTHESIS HELPERS
// ==========================================

function playKick(ctx: OfflineAudioContext, dest: AudioNode, time: number, vol = 1.0, startFreq = 80) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(startFreq + 60, time);
  osc.frequency.exponentialRampToValueAtTime(32, time + 0.12);

  gain.gain.setValueAtTime(vol * 0.9, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

  osc.connect(gain);
  gain.connect(dest);

  osc.start(time);
  osc.stop(time + 0.25);
}

function playSnare(ctx: OfflineAudioContext, dest: AudioNode, time: number, vol = 0.8) {
  // Noise buffer for snap
  const bufferSize = ctx.sampleRate * 0.15;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.03));
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(1000, time);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol * 0.7, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(dest);

  noise.start(time);
  noise.stop(time + 0.15);
}

function playHiHat(ctx: OfflineAudioContext, dest: AudioNode, time: number, vol = 0.3, dur = 0.05) {
  const bufferSize = ctx.sampleRate * dur;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.015));
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(7000, time);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(dest);

  noise.start(time);
  noise.stop(time + dur);
}

function playThavilRoll(ctx: OfflineAudioContext, dest: AudioNode, time: number, vol = 0.7) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(320, time);
  osc.frequency.exponentialRampToValueAtTime(120, time + 0.07);

  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + 0.09);
}

function playGaanaChatti(ctx: OfflineAudioContext, dest: AudioNode, time: number, vol = 0.6) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(240, time);
  osc.frequency.exponentialRampToValueAtTime(90, time + 0.09);

  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + 0.11);
}

function playMridangamThom(ctx: OfflineAudioContext, dest: AudioNode, time: number, vol = 0.8) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(130, time);
  osc.frequency.exponentialRampToValueAtTime(65, time + 0.35);

  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + 0.36);
}

function playMridangamChapu(ctx: OfflineAudioContext, dest: AudioNode, time: number, vol = 0.7) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(392, time); // High pitched harmonic ring
  osc.frequency.exponentialRampToValueAtTime(261, time + 0.2);

  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + 0.22);
}

function playMridangamNam(ctx: OfflineAudioContext, dest: AudioNode, time: number, vol = 0.5) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(523, time);

  gain.gain.setValueAtTime(vol * 0.6, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + 0.09);
}

function playSoftTablaBayya(ctx: OfflineAudioContext, dest: AudioNode, time: number, vol = 0.6) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(110, time);
  osc.frequency.exponentialRampToValueAtTime(75, time + 0.25);

  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + 0.32);
}

function playSoftTablaDayya(ctx: OfflineAudioContext, dest: AudioNode, time: number, vol = 0.45) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(293, time);

  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + 0.16);
}

function playParaiDrum(ctx: OfflineAudioContext, dest: AudioNode, time: number, vol = 0.8) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(180, time);
  osc.frequency.exponentialRampToValueAtTime(60, time + 0.18);

  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + 0.22);
}

function playKuthuWhistle(ctx: OfflineAudioContext, dest: AudioNode, time: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1800, time);
  osc.frequency.linearRampToValueAtTime(2600, time + 0.15);
  osc.frequency.linearRampToValueAtTime(2200, time + 0.3);

  gain.gain.setValueAtTime(0.001, time);
  gain.gain.linearRampToValueAtTime(0.35, time + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + 0.36);
}

function play808Sub(ctx: OfflineAudioContext, dest: AudioNode, time: number, vol = 1.0) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(65, time);
  osc.frequency.exponentialRampToValueAtTime(32, time + 0.4);

  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + 0.46);
}

function playSlapBass(ctx: OfflineAudioContext, dest: AudioNode, time: number, freq: number, dur: number) {
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, time);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1200, time);
  filter.frequency.exponentialRampToValueAtTime(220, time + dur);

  gain.gain.setValueAtTime(0.5, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(dest);

  osc.start(time);
  osc.stop(time + dur);
}

function playGlide808(ctx: OfflineAudioContext, dest: AudioNode, time: number, freq: number, dur: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq * 1.5, time);
  osc.frequency.exponentialRampToValueAtTime(freq, time + 0.15);

  gain.gain.setValueAtTime(0.65, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + dur);
}

function playSynthBass(ctx: OfflineAudioContext, dest: AudioNode, time: number, freq: number, dur: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(freq, time);

  gain.gain.setValueAtTime(0.4, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + dur);
}

function playWarmSubBass(ctx: OfflineAudioContext, dest: AudioNode, time: number, freq: number, dur: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, time);

  gain.gain.setValueAtTime(0.55, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + dur);
}

function playTanpuraDrone(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  reverbNode: AudioNode,
  rootFreq: number,
  duration: number
) {
  // Sa (C3) - Pa (G3) - Sa (C4)
  const notes = [rootFreq, rootFreq * 1.5, rootFreq * 2];
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, 0);

    // Subtle LFO shimmer
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(0.2 + idx * 0.1, 0);
    lfoGain.gain.setValueAtTime(freq * 0.015, 0);
    lfo.connect(osc.frequency);
    lfo.start(0);
    lfo.stop(duration);

    // Gentle filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, 0);

    gain.gain.setValueAtTime(0.06, 0);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    gain.connect(reverbNode);

    osc.start(0);
    osc.stop(duration);
  });
}

function playEtherealPad(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  reverbNode: AudioNode,
  time: number,
  chordNotes: number[],
  dur: number
) {
  chordNotes.forEach((freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.08, time + 0.8);
    gain.gain.setValueAtTime(0.08, time + dur - 0.5);
    gain.gain.linearRampToValueAtTime(0.001, time + dur);

    osc.connect(gain);
    gain.connect(dest);
    gain.connect(reverbNode);

    osc.start(time);
    osc.stop(time + dur);
  });
}

function playAcousticPluck(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  reverbNode: AudioNode,
  time: number,
  freq: number
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, time);

  gain.gain.setValueAtTime(0.18, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);

  osc.connect(gain);
  gain.connect(dest);
  gain.connect(reverbNode);

  osc.start(time);
  osc.stop(time + 0.65);
}

function playSynthChords(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  time: number,
  chordNotes: number[],
  dur: number
) {
  chordNotes.forEach((freq) => {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, time);

    gain.gain.setValueAtTime(0.06, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + dur);
  });
}

function playVeenaNote(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  reverbNode: AudioNode,
  time: number,
  freq: number,
  dur: number
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  // Authentic Carnatic gamaka: small pitch curve
  osc.frequency.setValueAtTime(freq * 0.96, time);
  osc.frequency.linearRampToValueAtTime(freq, time + 0.08);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1800, time);
  filter.frequency.exponentialRampToValueAtTime(700, time + dur);

  gain.gain.setValueAtTime(0.18, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  gain.connect(reverbNode);

  osc.start(time);
  osc.stop(time + dur);
}

function playBansuriFlute(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  reverbNode: AudioNode,
  time: number,
  freq: number,
  dur: number
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, time);

  // Flute breath vibrato
  const vibrato = ctx.createOscillator();
  const vibGain = ctx.createGain();
  vibrato.frequency.setValueAtTime(5.2, time);
  vibGain.gain.setValueAtTime(freq * 0.02, time);
  vibrato.connect(osc.frequency);
  vibrato.start(time);
  vibrato.stop(time + dur);

  gain.gain.setValueAtTime(0.001, time);
  gain.gain.linearRampToValueAtTime(0.24, time + 0.06);
  gain.gain.setValueAtTime(0.24, time + dur - 0.08);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

  osc.connect(gain);
  gain.connect(dest);
  gain.connect(reverbNode);

  osc.start(time);
  osc.stop(time + dur);
}

function play80sViolinLead(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  reverbNode: AudioNode,
  time: number,
  freq: number,
  dur: number
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, time);

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(freq * 1.8, time);
  filter.Q.setValueAtTime(2.0, time);

  gain.gain.setValueAtTime(0.001, time);
  gain.gain.linearRampToValueAtTime(0.16, time + 0.05);
  gain.gain.setValueAtTime(0.16, time + dur - 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  gain.connect(reverbNode);

  osc.start(time);
  osc.stop(time + dur);
}

function playKuthuLeadHook(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  reverbNode: AudioNode,
  time: number,
  freq: number,
  dur: number
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(freq, time);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2400, time);

  gain.gain.setValueAtTime(0.2, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  gain.connect(reverbNode);

  osc.start(time);
  osc.stop(time + dur);
}

function playModernCinemaLead(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  reverbNode: AudioNode,
  time: number,
  freq: number,
  dur: number
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, time);

  gain.gain.setValueAtTime(0.18, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

  osc.connect(gain);
  gain.connect(dest);
  gain.connect(reverbNode);

  osc.start(time);
  osc.stop(time + dur);
}

export interface GenerateAudioRequest {
  text?: string;
  lyrics?: string;
  styles: MusicStyleId[];
  language?: string;
  trackLength?: 'clip' | 'full';
  bpm?: number;
  scale?: string;
  mood?: string;
  instruments?: string[];
  title?: string;
}

/**
 * Generates audio using Google Lyria (lyria-3-clip-preview / lyria-3-pro-preview)
 * and seamlessly provides high-fidelity fallback synthesis if Lyria is pending billing.
 */
export async function generateLyriaOrSynthesizedAudio(params: GenerateAudioRequest): Promise<{
  audioBlob: Blob;
  audioUrl: string;
  duration: number;
  modelUsed: 'lyria-3-clip-preview' | 'lyria-3-pro-preview' | 'synthesizer';
}> {
  const chosenModel = params.trackLength === 'full' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview';

  try {
    const controller = new AbortController();
    const fetchTimeout = setTimeout(() => controller.abort(), 1400);

    const res = await fetch('/api/generate-music', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        text: params.text || '',
        lyrics: params.lyrics || '',
        styles: params.styles,
        language: params.language || 'ta',
        trackLength: params.trackLength || 'clip',
        bpm: params.bpm,
        mood: params.mood,
        instruments: params.instruments,
        title: params.title,
      }),
    });
    clearTimeout(fetchTimeout);

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.audioBase64) {
        // Convert base64 to Blob
        const byteCharacters = atob(data.audioBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const mimeType = data.mimeType || 'audio/mp3';
        const audioBlob = new Blob([byteArray], { type: mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);

        return {
          audioBlob,
          audioUrl,
          duration: data.durationSec || (params.trackLength === 'full' ? 120 : 30),
          modelUsed: data.modelUsed || chosenModel,
        };
      }
    }
  } catch (err) {
    console.warn('Lyria API endpoint call returned error, using synthesizer engine:', err);
  }

  // Procedural audio synthesis fallback
  const synthRes = await generateSongAudio({
    styles: params.styles,
    bpm: params.bpm || 110,
    scale: params.scale,
    durationSec: params.trackLength === 'full' ? 60 : 32,
    title: params.title,
    lyrics: params.lyrics || params.text || '',
    language: params.language,
  });

  return {
    audioBlob: synthRes.audioBlob,
    audioUrl: synthRes.audioUrl,
    duration: synthRes.duration,
    modelUsed: 'synthesizer',
  };
}
