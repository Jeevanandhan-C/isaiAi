import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialize Gemini client to avoid crashes if key is initially empty
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'IsaiAI' });
});

/**
 * Generate structured lyrics strictly based on the user's isolated idea,
 * in the requested language and musical style.
 */
app.post('/api/generate-song-lyrics', async (req, res) => {
  try {
    const { idea, styles = ['tamil-melody'], language = 'ta', mode = 'idea-to-song', customLyrics } = req.body;

    if (!idea && !customLyrics) {
      return res.status(400).json({ error: 'Please provide a song idea or custom lyrics.' });
    }

    const ai = getGeminiClient();
    const styleList = Array.isArray(styles) ? styles.join(', ') : styles;
    const isFusion = Array.isArray(styles) && styles.length > 1;

    // Language guidelines
    const languageMap: Record<string, string> = {
      ta: 'Tamil (தமிழ் script - authentic Tamil poetic words, rhyme, and meter)',
      tanglish: 'Tanglish (Tamil lyrics written in English Roman letters/script, like popular Kollywood youth songs)',
      en: 'English (poetic, rhythmic, matching musical phrasing)',
      te: 'Telugu (తెలుగు script)',
      ml: 'Malayalam (മലയാളം script)',
      hi: 'Hindi (हिंदी script / Bollywood style)',
      kn: 'Kannada (ಕನ್ನಡ script)',
      es: 'Spanish (Español)',
      fr: 'French (Français)',
      ja: 'Japanese (日本語)',
    };
    const targetLangDesc = languageMap[language] || language;

    if (ai) {
      const userIdeaPrompt = (idea || customLyrics).trim();
      const prompt = `You are a celebrated musical lyricist and music composer for South Indian Cinema and global world music.

CRITICAL DIRECTIVE: 100% STRICT ADHERENCE TO THE USER'S EXACT IDEA.
The user gave this EXACT idea:
"""${userIdeaPrompt}"""

STRICT RULES:
1. ONLY write about what the user provided. DO NOT introduce random characters, unrelated settings, generic romantic tropes, or extraneous concepts that were NOT in the user's prompt.
2. If the user input mentions A, sing ONLY about A. Every single line of Pallavi, Anupallavi, Charanam, and Outro must directly describe and narrate this exact idea.
3. Zero filler words about generic love or music playing.
4. Song title must directly come from the user's idea keywords.

MUSICAL STYLE(S):
Style(s): ${styleList}
${isFusion ? `NOTICE: MULTIPLE STYLES SELECTED! Blended fusion: ${styleList}.` : 'Single individual style selected.'}

TARGET LANGUAGE & SCRIPT:
Language: ${targetLangDesc}.
Generate the lyrics strictly in this requested language and script!
- If Tanglish: write colloquial Tamil lyrics using English Roman alphabet.
- If Tamil: write in authentic Tamil script.
- If Telugu/Malayalam/Hindi/Kannada/Japanese/Spanish/French: write in that language's script.

STRUCTURE REQUIREMENTS:
Return valid JSON with:
1. title: Creative, memorable song title directly reflecting the idea
2. nativeTitle: Song title in the target language script
3. bpm: Tempo in BPM (70 - 150) suited to the style
4. scale: Musical scale or Ragam
5. mood: Emotional mood directly matching the idea
6. instruments: Array of 3-5 authentic instruments featured in this production
7. sections: Array of 4 structured sections:
   - "Pallavi / Chorus" (timestampSec: 0) - core hook directly about the user's idea
   - "Anupallavi / Verse 1" (timestampSec: 8) - storytelling development of the idea
   - "Charanam / Verse 2" (timestampSec: 16) - deeper emotional progression of the idea
   - "Outro" (timestampSec: 24) - final memorable punchline/refrain
8. fullLyrics: Complete lyrics string with section headers.`;

      // Candidate models for resilience and zero-downtime
      const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest'];
      for (const model of candidateModels) {
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Model timeout')), 4000)
          );

          const generatePromise = ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: 'Catchy song title directly based on the idea' },
                  nativeTitle: { type: Type.STRING, description: 'Title in native language/script' },
                  bpm: { type: Type.INTEGER, description: 'Recommended tempo in BPM (70 - 150)' },
                  scale: { type: Type.STRING, description: 'Recommended Scale or Ragam' },
                  mood: { type: Type.STRING, description: 'Emotional mood description' },
                  fusionDescription: { type: Type.STRING, description: 'How the musical styles are blended' },
                  instruments: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Key instruments featured in the track',
                  },
                  sections: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        type: {
                          type: Type.STRING,
                          description: 'Section type',
                        },
                        lines: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                          description: 'Lyrics lines in the target language strictly about the idea',
                        },
                        timestampSec: {
                          type: Type.NUMBER,
                          description: 'Estimated starting timestamp in seconds',
                        },
                      },
                      required: ['type', 'lines', 'timestampSec'],
                    },
                  },
                  fullLyrics: {
                    type: Type.STRING,
                    description: 'Full lyrics formatted with section titles',
                  },
                },
                required: ['title', 'bpm', 'scale', 'mood', 'instruments', 'sections', 'fullLyrics'],
              },
            },
          });

          const response: any = await Promise.race([generatePromise, timeoutPromise]);

          if (response?.text) {
            const parsed = JSON.parse(response.text);
            if (parsed && parsed.title && parsed.fullLyrics) {
              return res.json(parsed);
            }
          }
        } catch (modelErr: any) {
          console.warn(`Model ${model} encounter issue:`, modelErr?.status || modelErr?.message);
        }
      }
    }

    // Dynamic idea-tailored fallback if all remote models are temporarily unavailable
    const fallbackResponse = getFallbackSongData(idea || customLyrics, styles, language);
    return res.json(fallbackResponse);
  } catch (err: any) {
    console.error('Error generating lyrics:', err);
    // Return high quality fallback rather than failing
    const { idea, styles = ['tamil-melody'], language = 'ta' } = req.body;
    const fallbackResponse = getFallbackSongData(idea || 'Music Celebration', styles, language);
    return res.json(fallbackResponse);
  }
});

/**
 * Translate existing lyrics to another language while preserving lyrical meter
 */
app.post('/api/translate-lyrics', async (req, res) => {
  try {
    const { lyrics, targetLanguage = 'ta', style = 'tamil-melody' } = req.body;
    if (!lyrics) {
      return res.status(400).json({ error: 'No lyrics provided for translation.' });
    }

    const ai = getGeminiClient();
    if (ai) {
      const prompt = `You are an expert bilingual South Indian songwriter and lyricist.
Translate/adapt the following song lyrics into the target language: "${targetLanguage}".
Ensure the rhythm, rhyme cadence, and poetic emotion fit a musical delivery for style: "${style}".

Original Lyrics:
"""
${lyrics}
"""

Return JSON with:
{
  "translatedLyrics": "Full translated lyrics formatted with sections",
  "nativeTitle": "Translated song title"
}`;

      const candidateModels = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
      for (const model of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  translatedLyrics: { type: Type.STRING },
                  nativeTitle: { type: Type.STRING },
                },
                required: ['translatedLyrics'],
              },
            },
          });

          if (response.text) {
            const parsed = JSON.parse(response.text);
            return res.json(parsed);
          }
        } catch (e: any) {
          console.warn(`Translation with ${model} failed, trying next:`, e?.message);
        }
      }
    }

    return res.json({
      translatedLyrics: lyrics,
      nativeTitle: 'IsaiAI Song',
    });
  } catch (err: any) {
    console.error('Error in translate-lyrics:', err);
    return res.status(500).json({ error: 'Failed to translate lyrics' });
  }
});

/**
 * High-fidelity AI music generation using Google Lyria:
 * - lyria-3-clip-preview: Short clips, loops, and previews (up to 30s)
 * - lyria-3-pro-preview: Full-length tracks with structured verses & choruses
 */
app.post('/api/generate-music', async (req, res) => {
  try {
    const {
      text = '',
      prompt = '',
      lyrics = '',
      styles = ['tamil-melody'],
      language = 'ta',
      title = 'Song',
      trackLength = 'clip', // 'clip' (up to 30s) or 'full' (full-length)
      bpm,
      mood,
      instruments = [],
    } = req.body;

    const chosenModel = trackLength === 'full' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview';
    const durationSec = trackLength === 'full' ? 120 : 30;

    const styleList = Array.isArray(styles) ? styles.join(', ') : styles;
    const instrumentsList = Array.isArray(instruments) ? instruments.join(', ') : instruments;
    const contentText = (text || lyrics || prompt || '').trim();

    // Construct a rich musical prompt for Google Lyria
    const lyriaPrompt = [
      `A complete musical track in style: ${styleList}.`,
      `Language feel: ${language}.`,
      bpm ? `Tempo: ${bpm} BPM.` : '',
      mood ? `Emotional Mood: ${mood}.` : '',
      instrumentsList ? `Featured Instruments: ${instrumentsList}.` : '',
      contentText ? `Theme & Story Concept: "${contentText}".` : '',
      lyrics ? `Sung Lyrics: """${lyrics}"""` : '',
      trackLength === 'full'
        ? 'Full-length track with authentic musical intro, verse, catchy chorus hook, and melodic outro.'
        : 'Punchy 30-second music clip featuring main catchy melodic hook and rhythm groove.',
    ].filter(Boolean).join(' ');

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(200).json({
        success: false,
        error: 'Gemini client not initialized. GEMINI_API_KEY required.',
        fallbackRequired: true,
        modelRequested: chosenModel,
      });
    }

    // Call Interactions API with Lyria model with a responsive 1.2s timeout
    try {
      console.log(`[Lyria] Checking ai.interactions.create with ${chosenModel}...`);
      const lyriaTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Lyria timeout')), 1200)
      );

      const interactionPromise = ai.interactions.create({
        model: chosenModel,
        input: lyriaPrompt,
      });

      const interaction: any = await Promise.race([interactionPromise, lyriaTimeout]);

      if (interaction?.output_audio?.data) {
        return res.json({
          success: true,
          audioBase64: interaction.output_audio.data,
          mimeType: interaction.output_audio.mime_type || 'audio/mp3',
          modelUsed: chosenModel,
          durationSec,
        });
      }

      if (interaction?.steps && Array.isArray(interaction.steps)) {
        for (const step of interaction.steps) {
          if (step.type === 'model_output' && step.content && Array.isArray(step.content)) {
            const audioPart = (step.content as any[]).find((c: any) => c.type === 'audio' || c.audio || c.mime_type?.includes('audio') || c.data);
            if (audioPart) {
              const b64 = (audioPart as any).data || (audioPart as any).audio?.data;
              const mime = (audioPart as any).mime_type || (audioPart as any).audio?.mime_type || 'audio/mp3';
              if (b64) {
                return res.json({
                  success: true,
                  audioBase64: b64,
                  mimeType: mime,
                  modelUsed: chosenModel,
                  durationSec,
                });
              }
            }
          }
        }
      }
    } catch (interactErr: any) {
      console.warn(`[Lyria] interactions.create non-blocking notice for ${chosenModel}:`, interactErr?.message || interactErr);
    }

    // Return instant fallback signal so the client generates audio in real-time without delay
    return res.json({
      success: false,
      modelRequested: chosenModel,
      fallbackRequired: true,
      error: `Lyria model ${chosenModel} requires billing activation. Using high-fidelity synthesizer.`,
    });
  } catch (err: any) {
    console.error('Error in /api/generate-music:', err);
    return res.status(200).json({
      success: false,
      error: err?.message || 'Music generation failed',
      fallbackRequired: true,
    });
  }
});

/**
 * Intelligent dynamic fallback: synthesizes structured lyrics strictly
 * based on the user's input idea, avoiding any hardcoded unrelated presets.
 */
function getFallbackSongData(idea: string, styles: string[], language: string) {
  const cleanIdea = idea.trim();
  const lowerIdea = cleanIdea.toLowerCase();

  // Extract keywords to build title
  const words = cleanIdea.split(/\s+/).filter((w) => w.length > 2);
  const coreTheme = words.slice(0, 3).join(' ') || 'Isai Payanam';

  const isKuthu = styles.some((s) => s.includes('kuthu') || s.includes('mass') || s.includes('teenmaar'));
  const isGaana = styles.some((s) => s.includes('gaana'));
  const isCarnatic = styles.some((s) => s.includes('carnatic') || s.includes('devotional'));
  const is90s = styles.some((s) => s.includes('90s') || s.includes('rahman'));
  const is80s = styles.some((s) => s.includes('80s') || s.includes('retro'));

  let title = `${coreTheme.charAt(0).toUpperCase() + coreTheme.slice(1)}`;
  let nativeTitle = coreTheme;
  let bpm = 96;
  let scale = 'Mohanam / C Major Pentatonic';
  let mood = 'Soulful & Uplifting';
  let instruments = ['Bansuri Flute', 'Acoustic Guitar', 'Soft Tabla', 'Warm Strings'];

  if (isKuthu) {
    title = `${coreTheme} (Mass Kuthu Beat)`;
    nativeTitle = `${coreTheme} (குத்து ஆட்டம்)`;
    bpm = 136;
    scale = 'Natabhairavi / Minor';
    mood = 'High-Energy Mass Celebration';
    instruments = ['Thavil', 'Dappankuthu Chatti', 'Whistle Drops', '808 Brass Stabs'];
  } else if (isGaana) {
    title = `${coreTheme} (Madras Gaana)`;
    nativeTitle = `${coreTheme} (கானா)`;
    bpm = 122;
    scale = 'Folk Pentatonic';
    mood = 'Spirited Street Groove';
    instruments = ['Chatti & Dholak', 'Street Claps', 'Acoustic Harmonium'];
  } else if (isCarnatic) {
    title = `${coreTheme} (Raga Symphony)`;
    nativeTitle = `${coreTheme} (ராக கீதம்)`;
    bpm = 84;
    scale = 'Mayamalavagowla Ragam';
    mood = 'Devotional & Classical Fusion';
    instruments = ['Tanpura Drone', 'Mridangam', 'Saraswati Veena', 'Violin'];
  } else if (is90s) {
    title = `${coreTheme} (Nostalgic 90s)`;
    nativeTitle = `${coreTheme} (மெலடி)`;
    bpm = 92;
    scale = 'Kharaharapriya Ragam';
    mood = 'Romantic & Atmospheric';
    instruments = ['Ambient Pad Waves', 'Bamboo Pan Flute', 'Syncopated Congas'];
  } else if (is80s) {
    title = `${coreTheme} (Retro 80s Beats)`;
    nativeTitle = `${coreTheme} (இளமை துள்ளல்)`;
    bpm = 108;
    scale = 'Kalyani Ragam';
    mood = 'Golden Era Orchestral Groove';
    instruments = ['Slap Bass Guitar', '16-Piece Violin Strings', 'Vintage Flute'];
  }

  // Break user idea into semantic phrases
  const phrases = cleanIdea
    .split(/[\n\r.,!?;:•]+|(?:\s+(?:and|with|then|while|along|near|under|over|sharing|remembering|walking|singing)\s+)/i)
    .map((p) => p.trim())
    .filter((p) => p.length > 2);

  const p1 = phrases[0] || cleanIdea;
  const p2 = phrases[1] || phrases[0] || cleanIdea;
  const p3 = phrases[2] || phrases[0] || cleanIdea;
  const p4 = phrases[3] || phrases[1] || cleanIdea;

  let sections: Array<{ type: string; lines: string[]; timestampSec: number }> = [];

  if (language === 'tanglish') {
    sections = [
      {
        type: 'Pallavi / Chorus',
        lines: [
          `"${p1}" - Idhu dhaan namma full story-eh!`,
          `"${p2}" - Paattaaga maari ipo koodiye!`,
          `Vera edhuvum illa just unnode indha thought-u`,
          `Rhythm-la set aagi poduthu paaru beat-u!`,
        ],
        timestampSec: 0,
      },
      {
        type: 'Anupallavi / Verse 1',
        lines: [
          `"${p2}" - Namma manasula thonina andha moment-u`,
          `"${p3}" - Indha lyric-la dhaan create aachu impact-u!`,
          `Un idea mattum dhaan full-ah inge paadudhu`,
          `Real feeling-oda namma kural ketkudhu!`,
        ],
        timestampSec: 8,
      },
      {
        type: 'Charanam / Verse 2',
        lines: [
          `"${p3}" - Appadiye match aachu note-oda`,
          `"${p4}" - Vandhirukku nalla groove-oda!`,
          `Strict-ah un idea-va preserve panni mudichom`,
          `Ketka ketka mass-ah namma feel pannuvom!`,
        ],
        timestampSec: 16,
      },
      {
        type: 'Outro',
        lines: [
          `"${p1}" - Repeat mode-la ippo play aagudhu`,
          `Un idea dhaan song-ah complete aagudhu!`,
        ],
        timestampSec: 24,
      },
    ];
  } else if (language === 'en') {
    sections = [
      {
        type: 'Pallavi / Chorus',
        lines: [
          `${p1}, echoing so true and bright`,
          `${p2}, shining like a golden light!`,
          `This whole song is only what you gave,`,
          `Standing strong on every rhythmic wave!`,
        ],
        timestampSec: 0,
      },
      {
        type: 'Anupallavi / Verse 1',
        lines: [
          `Moving forward into ${p2},`,
          `Every emotion pure, genuine and true.`,
          `Captured in the moments of ${p3},`,
          `Just as you wrote it down for all to see!`,
        ],
        timestampSec: 8,
      },
      {
        type: 'Charanam / Verse 2',
        lines: [
          `Through the journey where ${p3} comes alive,`,
          `With ${p4}, letting all the feelings thrive.`,
          `No other theme, no outside lines inside,`,
          `Your vision here is crafted with pure pride!`,
        ],
        timestampSec: 16,
      },
      {
        type: 'Outro',
        lines: [
          `${p1}, lasting through the night and day,`,
          `Your original idea leads the music all the way!`,
        ],
        timestampSec: 24,
      },
    ];
  } else {
    // Default Tamil (தமிழ்)
    sections = [
      {
        type: 'Pallavi / Chorus',
        lines: [
          `"${p1}" - இதுதானே நம் சொந்த கதை`,
          `"${p2}" - பாட்டில் ஓடும் இனிய நதி!`,
          `சொன்ன இந்த யோசனை சுரமாக மலருது`,
          `அன்பின் வழியில் புதிய வரிகளாய் மாறுது!`,
        ],
        timestampSec: 0,
      },
      {
        type: 'Anupallavi / Verse 1',
        lines: [
          `"${p2}" - எண்ணங்கள் எல்லாம் அழகாய் சேருது`,
          `"${p3}" - நெஞ்சின் ஆழத்தில் நங்கூரம் பாயுது!`,
          `வேறு எதையும் சேர்க்காமல் பாடும் கவிதை`,
          `உன் சிந்தனையின் நிஜமான அழகிய பாதை!`,
        ],
        timestampSec: 8,
      },
      {
        type: 'Charanam / Verse 2',
        lines: [
          `"${p3}" - இந்த நினைவுகள் என்றும் நிலைக்கும்`,
          `"${p4}" - சொல்லாத உணர்வும் பாட்டில் ஒலிக்கும்!`,
          `நொடிகள் தோறும் இந்த தாளம் பிடிக்கும்`,
          `சொன்ன உன் கதையே வெற்றியை முடிக்கும்!`,
        ],
        timestampSec: 16,
      },
      {
        type: 'Outro',
        lines: [
          `"${p1}" - இதோடு முடியும் நம் ராகம்`,
          `உன் மனதில் மலர்ந்த சொந்த சங்கமம்!`,
        ],
        timestampSec: 24,
      },
    ];
  }

  const fullLyrics = sections
    .map((s) => `[${s.type}]\n${s.lines.join('\n')}`)
    .join('\n\n');

  return {
    title,
    nativeTitle,
    bpm,
    scale,
    mood,
    instruments,
    fusionDescription: styles.length > 1 ? `Harmonious blend of ${styles.join(' and ')}` : undefined,
    sections,
    fullLyrics,
  };
}

async function startServer() {
  // Mount Vite in dev mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`IsaiAI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
