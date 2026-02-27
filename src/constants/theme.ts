// Design system for The Daily Verse
// Warm earth tones + Cinzel title font

export const COLORS = {
  // Primary palette
  background: '#F5EDE0',
  backgroundGradientTop: '#E8D5BC',
  card: '#FFFCF6',
  cardBorder: '#E8D5BC',
  
  // Accent
  primary: '#9B6B3E',
  primaryLight: '#F0E6D6',
  primaryMuted: '#bba88e',
  
  // Text
  textDark: '#3a2a1a',
  textTitle: '#5a3e28',
  textMuted: '#a08c72',
  textLight: '#bba88e',
  
  // UI
  divider: '#E0D0BA',
  searchBg: '#F5EDE0',
  searchBorder: '#E0D0BA',
  quickPick: '#F0E6D6',
  
  // Status
  success: '#4a7c59',
  error: '#c0392b',
  white: '#FFFCF6',
};

export const FONTS = {
  // Title font (app name, headers)
  titleRegular: 'Cinzel_400Regular',
  titleSemiBold: 'Cinzel_600SemiBold',
  titleBold: 'Cinzel_700Bold',
  
  // Verse body font
  verseRegular: 'Lora_400Regular',
  verseItalic: 'Lora_400Regular_Italic',
  verseSemiBold: 'Lora_600SemiBold',
  
  // UI font
  uiRegular: 'DMSans_400Regular',
  uiMedium: 'DMSans_500Medium',
  uiSemiBold: 'DMSans_600SemiBold',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 36,
};

export const SHADOWS = {
  card: {
    shadowColor: 'rgba(90,62,40,0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 4,
  },
  soft: {
    shadowColor: 'rgba(90,62,40,0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },
};

// US timezone options for the delivery time picker
export const TIMEZONES = [
  { label: 'Eastern (ET)', value: 'America/New_York' },
  { label: 'Central (CT)', value: 'America/Chicago' },
  { label: 'Mountain (MT)', value: 'America/Denver' },
  { label: 'Pacific (PT)', value: 'America/Los_Angeles' },
  { label: 'Alaska (AKT)', value: 'America/Anchorage' },
  { label: 'Hawaii (HT)', value: 'America/Honolulu' },
];

// Bible translations (V1 = KJV only, but structured for future additions)
export const TRANSLATIONS = [
  { label: 'King James Version', value: 'KJV', available: true },
  { label: 'New International Version', value: 'NIV', available: false },
  { label: 'English Standard Version', value: 'ESV', available: false },
  { label: 'New Living Translation', value: 'NLT', available: false },
];

// Quick pick books for the Browse screen
export const QUICK_PICK_BOOKS = [
  'Psalms', 'Proverbs', 'John', 'Romans', 'Genesis', 
  'Isaiah', 'Matthew', 'Philippians', 'Hebrews', 'James',
];
