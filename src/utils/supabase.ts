import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Edge function helpers
const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

export async function sendVerification(phone: string) {
  const res = await fetch(`${FUNCTIONS_URL}/send-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  return res.json();
}

export async function verifyPhone(phone: string, code: string) {
  const res = await fetch(`${FUNCTIONS_URL}/verify-phone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code }),
  });
  return res.json();
}

export async function updatePreferences(phone: string, prefs: {
  translation?: string;
  verse_format?: string;
  verse_mode?: string;
  delivery_hour?: number;
  delivery_minute?: number;
  timezone?: string;
}) {
  const res = await fetch(`${FUNCTIONS_URL}/update-preferences`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, ...prefs }),
  });
  return res.json();
}

export async function deleteAccount(phone: string) {
  try {
    const res = await fetch(`${FUNCTIONS_URL}/delete-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    return res.json();
  } catch {
    return { success: false, error: 'Network error' };
  }
}

// Direct verse queries (read from the public verses table)
// All queries accept an optional translation parameter (defaults to 'KJV')

export async function getVerseByReference(book: string, chapter: number, verse: number, translation = 'KJV') {
  const { data, error } = await supabase
    .from('verses')
    .select('*')
    .eq('book', book)
    .eq('chapter', chapter)
    .eq('verse', verse)
    .eq('translation', translation)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getChapter(book: string, chapter: number, translation = 'KJV') {
  const { data, error } = await supabase
    .from('verses')
    .select('*')
    .eq('book', book)
    .eq('chapter', chapter)
    .eq('translation', translation)
    .order('verse', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function searchVerses(query: string, translation = 'KJV', limit = 20) {
  const { data, error } = await supabase
    .from('verses')
    .select('*')
    .eq('translation', translation)
    .textSearch('text', query)
    .limit(limit);
  
  if (error) throw error;
  return data;
}

export async function getBookChapters(book: string, translation = 'KJV') {
  const { data, error } = await supabase
    .from('verses')
    .select('chapter')
    .eq('book', book)
    .eq('translation', translation)
    .order('chapter', { ascending: true });
  
  if (error) throw error;
  const chapters = [...new Set(data?.map(v => v.chapter))];
  return chapters;
}

export async function getRandomVerse(translation = 'KJV') {
  const { count } = await supabase
    .from('verses')
    .select('*', { count: 'exact', head: true })
    .eq('translation', translation);
  
  if (!count) throw new Error('No verses found');
  
  const randomOffset = Math.floor(Math.random() * count);
  const { data, error } = await supabase
    .from('verses')
    .select('*')
    .eq('translation', translation)
    .range(randomOffset, randomOffset)
    .single();
  
  if (error) throw error;
  return data;
}
