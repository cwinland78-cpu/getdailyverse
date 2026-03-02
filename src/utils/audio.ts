// Bible Brain (Digital Bible Platform v4) Audio Integration
// Free API from Faith Comes By Hearing
// Sign up for API key: https://4.dbt.io/api_key/request

import AsyncStorage from '@react-native-async-storage/async-storage';

// Bible Brain API config
const BIBLE_BRAIN_API = 'https://4.dbt.io/api';
const API_KEY = 'dbce0e77-6c45-4d66-b59c-38a253acacdc';

// KJV Audio filesets from Bible Brain
// Bible Brain splits audio into OT and NT filesets.
// Each "voice" maps to a pair of filesets (OT + NT).
export interface VoiceOption {
  id: string;
  name: string;
  description: string;
  color: string;
  colorEnd: string;
  otFilesetId: string;  // Old Testament fileset
  ntFilesetId: string;  // New Testament fileset
  emoji: string;
}

// Only 2 actual recording styles exist for KJV on Bible Brain:
// Standard narration and Dramatized (with multiple voice actors + sound effects)
export const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'Clear narration',
    color: '#8B5E3C',
    colorEnd: '#A67C52',
    otFilesetId: 'ENGKJVO1DA',
    ntFilesetId: 'ENGKJVN1DA',
    emoji: '📖',
  },
  {
    id: 'dramatized',
    name: 'Dramatized',
    description: 'Multi-voice drama',
    color: '#6B4E8E',
    colorEnd: '#9070B5',
    otFilesetId: 'ENGKJVO2DA',
    ntFilesetId: 'ENGKJVN2DA',
    emoji: '🎭',
  },
];

// Bible Brain book ID mapping (their format uses specific IDs)
export const BOOK_ID_MAP: Record<string, string> = {
  'Genesis': 'GEN', 'Exodus': 'EXO', 'Leviticus': 'LEV', 'Numbers': 'NUM',
  'Deuteronomy': 'DEU', 'Joshua': 'JOS', 'Judges': 'JDG', 'Ruth': 'RUT',
  '1 Samuel': '1SA', '2 Samuel': '2SA', '1 Kings': '1KI', '2 Kings': '2KI',
  '1 Chronicles': '1CH', '2 Chronicles': '2CH', 'Ezra': 'EZR', 'Nehemiah': 'NEH',
  'Esther': 'EST', 'Job': 'JOB', 'Psalms': 'PSA', 'Proverbs': 'PRO',
  'Ecclesiastes': 'ECC', 'Song of Solomon': 'SNG', 'Isaiah': 'ISA', 'Jeremiah': 'JER',
  'Lamentations': 'LAM', 'Ezekiel': 'EZK', 'Daniel': 'DAN', 'Hosea': 'HOS',
  'Joel': 'JOL', 'Amos': 'AMO', 'Obadiah': 'OBA', 'Jonah': 'JON',
  'Micah': 'MIC', 'Nahum': 'NAM', 'Habakkuk': 'HAB', 'Zephaniah': 'ZEP',
  'Haggai': 'HAG', 'Zechariah': 'ZEC', 'Malachi': 'MAL',
  'Matthew': 'MAT', 'Mark': 'MRK', 'Luke': 'LUK', 'John': 'JHN',
  'Acts': 'ACT', 'Romans': 'ROM', '1 Corinthians': '1CO', '2 Corinthians': '2CO',
  'Galatians': 'GAL', 'Ephesians': 'EPH', 'Philippians': 'PHP', 'Colossians': 'COL',
  '1 Thessalonians': '1TH', '2 Thessalonians': '2TH', '1 Timothy': '1TI', '2 Timothy': '2TI',
  'Titus': 'TIT', 'Philemon': 'PHM', 'Hebrews': 'HEB', 'James': 'JAS',
  '1 Peter': '1PE', '2 Peter': '2PE', '1 John': '1JN', '2 John': '2JN',
  '3 John': '3JN', 'Jude': 'JUD', 'Revelation': 'REV',
};

// OT books for determining which fileset to use
const OT_BOOK_IDS = new Set([
  'GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT','1SA','2SA','1KI','2KI',
  '1CH','2CH','EZR','NEH','EST','JOB','PSA','PRO','ECC','SNG','ISA','JER',
  'LAM','EZK','DAN','HOS','JOL','AMO','OBA','JON','MIC','NAM','HAB','ZEP',
  'HAG','ZEC','MAL',
]);

// Get audio URL for a specific chapter
export async function getChapterAudioUrl(
  bookName: string,
  chapter: number,
  voiceId: string = 'standard'
): Promise<string | null> {
  const voice = VOICE_OPTIONS.find(v => v.id === voiceId);
  if (!voice) return null;

  const bookId = BOOK_ID_MAP[bookName];
  if (!bookId) return null;

  // Pick OT or NT fileset based on book
  const filesetId = OT_BOOK_IDS.has(bookId) ? voice.otFilesetId : voice.ntFilesetId;
  const chapterStr = chapter.toString();

  try {
    const response = await fetch(
      `${BIBLE_BRAIN_API}/bibles/filesets/${filesetId}/${bookId}/${chapterStr}?key=${API_KEY}&v=4`
    );
    const data = await response.json();

    if (data?.data && data.data.length > 0) {
      return data.data[0].path;
    }
    return null;
  } catch (error) {
    console.error('Error fetching audio URL:', error);
    return null;
  }
}

// Audio player state
export interface AudioState {
  isPlaying: boolean;
  isLoaded: boolean;
  isBuffering: boolean;
  positionMs: number;
  durationMs: number;
  currentBook: string;
  currentChapter: number;
  currentVoice: string;
  playbackSpeed: number;
}

const AUDIO_STATE_KEY = '@audio_state';
const LISTENED_KEY = '@listened_chapters';

// Save/load audio progress
export async function saveAudioState(state: Partial<AudioState>) {
  try {
    const existing = await loadAudioState();
    const merged = { ...existing, ...state };
    await AsyncStorage.setItem(AUDIO_STATE_KEY, JSON.stringify(merged));
  } catch (e) {
    console.error('Error saving audio state:', e);
  }
}

export async function loadAudioState(): Promise<Partial<AudioState>> {
  try {
    const data = await AsyncStorage.getItem(AUDIO_STATE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
}

// Track listened chapters
export async function markChapterListened(book: string, chapter: number) {
  try {
    const data = await AsyncStorage.getItem(LISTENED_KEY);
    const listened: Record<string, number[]> = data ? JSON.parse(data) : {};
    if (!listened[book]) listened[book] = [];
    if (!listened[book].includes(chapter)) {
      listened[book].push(chapter);
    }
    await AsyncStorage.setItem(LISTENED_KEY, JSON.stringify(listened));
  } catch (e) {
    console.error('Error marking chapter listened:', e);
  }
}

export async function getListenedChapters(book: string): Promise<number[]> {
  try {
    const data = await AsyncStorage.getItem(LISTENED_KEY);
    const listened: Record<string, number[]> = data ? JSON.parse(data) : {};
    return listened[book] || [];
  } catch (e) {
    return [];
  }
}

// Save selected voice preference
export async function saveVoicePreference(voiceId: string) {
  await AsyncStorage.setItem('@selected_voice', voiceId);
}

export async function getVoicePreference(): Promise<string> {
  const voice = await AsyncStorage.getItem('@selected_voice');
  return voice || 'standard';
}

// Playback speed options
export const SPEED_OPTIONS = [0.75, 1.0, 1.25, 1.5, 2.0];

export function getNextSpeed(current: number): number {
  const idx = SPEED_OPTIONS.indexOf(current);
  if (idx === -1 || idx === SPEED_OPTIONS.length - 1) return SPEED_OPTIONS[0];
  return SPEED_OPTIONS[idx + 1];
}

// Format milliseconds to mm:ss
export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
