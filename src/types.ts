export type MusicStyleId = string;

export interface MusicStyleOption {
  id: MusicStyleId;
  name: string;
  nativeName: string;
  language: string; // 'ta', 'te', 'ml', 'hi', 'kn', 'en', 'es', 'fr', 'ja', 'tanglish', 'global'
  category?: 'tamil' | 'telugu' | 'malayalam' | 'hindi' | 'kannada' | 'english' | 'spanish' | 'french' | 'japanese' | 'tanglish' | 'fusion' | 'global' | string;
  bpmRange: [number, number];
  description: string;
  instruments: string[];
  signatureVibe: string;
  color: string;
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag?: string;
  exampleScript?: string;
}

export interface LyricSection {
  type: 'Pallavi / Chorus' | 'Anupallavi / Verse 1' | 'Charanam / Verse 2' | 'Bridge' | 'Outro' | 'Hook' | string;
  lines: string[];
  timestampSec: number;
}

export interface GeneratedSong {
  id: string;
  title: string;
  nativeTitle?: string;
  idea: string;
  selectedStyles: MusicStyleId[];
  isFusion: boolean;
  styleDisplayName: string;
  language: string;
  languageName: string;
  bpm: number;
  scale: string;
  mood: string;
  instruments: string[];
  lyrics: string;
  sections: LyricSection[];
  audioUrl?: string; // Blob or Data URL (MP3)
  durationSec: number;
  createdAt: number;
  isUserCreated?: boolean;
  trackLength?: 'clip' | 'full';
  modelUsed?: 'lyria-3-clip-preview' | 'lyria-3-pro-preview' | 'synthesizer' | string;
}

export interface GenerateLyricsRequest {
  idea: string;
  styles: MusicStyleId[];
  language: string;
  vocalPreference?: 'male' | 'female' | 'duet' | 'energetic' | 'soft';
  customLyrics?: string;
  mode: 'idea-to-song' | 'lyrics-to-song';
  trackLength?: 'clip' | 'full';
}

export interface GenerateLyricsResponse {
  title: string;
  nativeTitle?: string;
  bpm: number;
  scale: string;
  mood: string;
  fusionDescription?: string;
  instruments: string[];
  sections: LyricSection[];
  fullLyrics: string;
}
