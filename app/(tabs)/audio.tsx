import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  FlatList, ActivityIndicator, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';
import { BIBLE_BOOKS, OT_BOOKS, NT_BOOKS } from '../../src/utils/bible';
import {
  VOICE_OPTIONS, VoiceOption,
  formatTime, saveVoicePreference, getVoicePreference,
} from '../../src/utils/audio';
import { audioManager, AudioManagerState } from '../../src/utils/audioManager';

export default function AudioScreen() {
  const router = useRouter();

  // Voice
  const [selectedVoice, setSelectedVoice] = useState<string>('standard');

  // Testament filter
  const [testament, setTestament] = useState<'OT' | 'NT'>('OT');

  // Shared audio state
  const [audioState, setAudioState] = useState<AudioManagerState>(audioManager.getState());

  // Animated bars for playing indicator
  const [bar1] = useState(new Animated.Value(6));
  const [bar2] = useState(new Animated.Value(12));
  const [bar3] = useState(new Animated.Value(8));

  useEffect(() => {
    audioManager.init();
    const unsub = audioManager.subscribe((state) => {
      setAudioState(state);
      setSelectedVoice(state.currentVoice);
    });

    getVoicePreference().then(v => setSelectedVoice(v));

    return unsub;
  }, []);

  useEffect(() => {
    if (audioState.isPlaying) {
      animateBars();
    }
  }, [audioState.isPlaying]);

  function animateBars() {
    const animate = (bar: Animated.Value, toValue: number, duration: number) => {
      Animated.sequence([
        Animated.timing(bar, { toValue, duration, useNativeDriver: false }),
        Animated.timing(bar, { toValue: 4, duration, useNativeDriver: false }),
      ]).start(() => {
        if (audioState.isPlaying) animate(bar, toValue, duration);
      });
    };
    animate(bar1, 14, 400);
    animate(bar2, 18, 300);
    animate(bar3, 12, 500);
  }

  async function selectVoice(voiceId: string) {
    setSelectedVoice(voiceId);
    await saveVoicePreference(voiceId);
    await audioManager.setVoice(voiceId);
  }

  async function handlePlayPause() {
    await audioManager.playPause();
  }

  async function handleNext() {
    await audioManager.playNext();
  }

  async function handlePrev() {
    await audioManager.playPrev();
  }

  async function handleSkipBack() {
    await audioManager.skipBack();
  }

  async function handleSkipForward() {
    await audioManager.skipForward();
  }

  async function handleSpeed() {
    await audioManager.cycleSpeed();
  }

  function handleBookPress(bookName: string) {
    router.push({
      pathname: '/audio-chapters',
      params: {
        book: bookName,
        currentBook: audioState.currentBook,
        currentChapter: audioState.currentChapter.toString(),
        isPlaying: audioState.isPlaying ? '1' : '0',
      },
    });
  }

  const books = testament === 'OT' ? OT_BOOKS : NT_BOOKS;
  const voiceData = VOICE_OPTIONS.find(v => v.id === selectedVoice);
  const currentBookData = BIBLE_BOOKS.find(b => b.name === audioState.currentBook);
  const bookIndex = BIBLE_BOOKS.findIndex(b => b.name === audioState.currentBook) + 1;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gradientTop} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Audio Bible</Text>
          <TouchableOpacity onPress={handleSpeed}>
            <Text style={styles.speedBtnHeader}>{audioState.speed}x</Text>
          </TouchableOpacity>
        </View>

        {/* Voice Selector */}
        <View style={styles.voiceSection}>
          <Text style={styles.sectionLabel}>🎙 Voice</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.voiceScroll}
          >
            {VOICE_OPTIONS.map((voice) => (
              <TouchableOpacity
                key={voice.id}
                style={[
                  styles.voiceCard,
                  selectedVoice === voice.id && styles.voiceCardActive,
                ]}
                onPress={() => selectVoice(voice.id)}
              >
                <View style={[styles.voiceAvatar, { backgroundColor: voice.color }]}>
                  <Text style={{ fontSize: 20 }}>{voice.emoji}</Text>
                </View>
                <Text style={styles.voiceName}>{voice.name}</Text>
                <Text style={styles.voiceDesc}>{voice.description}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Now Playing Card */}
        <View style={[styles.nowPlaying, SHADOWS.card]}>
          <View style={styles.npTop}>
            <View style={styles.npArt}>
              <Text style={{ fontSize: 24 }}>📖</Text>
            </View>
            <View style={styles.npInfo}>
              <Text style={styles.npBook} numberOfLines={1}>
                {audioState.currentBook}
              </Text>
              <Text style={styles.npChapter}>
                Chapter {audioState.currentChapter}
                {currentBookData ? ` of ${currentBookData.chapters}` : ''}
              </Text>
              <Text style={styles.npVoice}>
                Voice: {voiceData?.name || 'David'}
              </Text>
            </View>
          </View>

          {/* Progress */}
          <View style={styles.npProgress}>
            <View
              style={[
                styles.npProgressFill,
                { width: audioState.durationMs > 0 ? `${(audioState.positionMs / audioState.durationMs) * 100}%` : '0%' },
              ]}
            />
          </View>
          <View style={styles.npTimeRow}>
            <Text style={styles.npTime}>{formatTime(audioState.positionMs)}</Text>
            <Text style={styles.npTime}>{formatTime(audioState.durationMs)}</Text>
          </View>

          {/* Controls */}
          <View style={styles.npControls}>
            <TouchableOpacity onPress={handlePrev} style={styles.ctrlBtn}>
              <Text style={styles.ctrlSm}>⏮</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSkipBack} style={styles.ctrlBtn}>
              <Text style={styles.ctrlMd}>⏪</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ctrlPlay}
              onPress={handlePlayPause}
              disabled={audioState.audioLoading}
            >
              {audioState.audioLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.ctrlPlayIcon}>{audioState.isPlaying ? '⏸' : '▶️'}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSkipForward} style={styles.ctrlBtn}>
              <Text style={styles.ctrlMd}>⏩</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNext} style={styles.ctrlBtn}>
              <Text style={styles.ctrlSm}>⏭</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Book Browser */}
        <View style={styles.bookSection}>
          <Text style={styles.sectionLabel}>📚 Books</Text>

          <View style={styles.testamentTabs}>
            <TouchableOpacity
              style={[styles.testamentTab, testament === 'OT' && styles.testamentTabActive]}
              onPress={() => setTestament('OT')}
            >
              <Text style={[
                styles.testamentTabText,
                testament === 'OT' && styles.testamentTabTextActive,
              ]}>
                Old Testament
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.testamentTab, testament === 'NT' && styles.testamentTabActive]}
              onPress={() => setTestament('NT')}
            >
              <Text style={[
                styles.testamentTabText,
                testament === 'NT' && styles.testamentTabTextActive,
              ]}>
                New Testament
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bookGrid}>
            {books.map((book, idx) => {
              const globalIdx = BIBLE_BOOKS.findIndex(b => b.name === book.name) + 1;
              const isCurrentBook = book.name === audioState.currentBook;

              return (
                <TouchableOpacity
                  key={book.name}
                  style={[styles.bookItem, isCurrentBook && styles.bookItemPlaying]}
                  onPress={() => handleBookPress(book.name)}
                >
                  <View style={[styles.bookNum, isCurrentBook && styles.bookNumPlaying]}>
                    <Text style={[styles.bookNumText, isCurrentBook && styles.bookNumTextPlaying]}>
                      {globalIdx}
                    </Text>
                  </View>
                  <View style={styles.bookNameCol}>
                    <Text style={styles.bookName} numberOfLines={1}>{book.name}</Text>
                    <Text style={styles.bookChapters}>{book.chapters} chapters</Text>
                  </View>
                  {isCurrentBook && audioState.isPlaying && (
                    <View style={styles.playingIndicator}>
                      <Animated.View style={[styles.bar, { height: bar1 }]} />
                      <Animated.View style={[styles.bar, { height: bar2 }]} />
                      <Animated.View style={[styles.bar, { height: bar3 }]} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  gradientTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 180,
    backgroundColor: COLORS.backgroundGradientTop, opacity: 0.6,
  },
  scroll: { padding: SPACING.lg, paddingTop: SPACING.xl },

  // Header
  headerRow: {
    flexDirection: 'row', alignItems: 'baseline',
    justifyContent: 'space-between', marginBottom: 20,
  },
  pageTitle: {
    fontFamily: FONTS.titleSemiBold, fontSize: 22, color: COLORS.textTitle,
    letterSpacing: 0.5,
  },
  speedBtnHeader: {
    fontFamily: FONTS.uiSemiBold, fontSize: 11, color: COLORS.primary,
    backgroundColor: COLORS.primaryLight, borderRadius: 6,
    paddingVertical: 4, paddingHorizontal: 8, overflow: 'hidden',
  },

  // Voice selector
  voiceSection: { marginBottom: 20 },
  sectionLabel: {
    fontFamily: FONTS.uiSemiBold, fontSize: 11, color: COLORS.primary,
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10,
  },
  voiceScroll: { gap: 10, paddingRight: 24 },
  voiceCard: {
    width: 100, backgroundColor: COLORS.card,
    borderWidth: 1.5, borderColor: COLORS.cardBorder,
    borderRadius: 12, padding: 12, alignItems: 'center',
  },
  voiceCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  voiceAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  voiceName: {
    fontFamily: FONTS.uiSemiBold, fontSize: 12, color: COLORS.textDark,
    marginBottom: 2,
  },
  voiceDesc: {
    fontFamily: FONTS.uiRegular, fontSize: 10, color: COLORS.textMuted,
    textAlign: 'center', lineHeight: 13,
  },
  previewBtn: { marginTop: 6 },
  previewLabel: {
    fontFamily: FONTS.uiSemiBold, fontSize: 9, color: COLORS.primary,
    letterSpacing: 0.3,
  },

  // Now playing
  nowPlaying: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    padding: 18, marginBottom: 20,
  },
  npTop: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14,
  },
  npArt: {
    width: 52, height: 52, borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  npInfo: { flex: 1 },
  npBook: {
    fontFamily: FONTS.titleSemiBold, fontSize: 15, color: COLORS.textDark,
  },
  npChapter: {
    fontFamily: FONTS.uiRegular, fontSize: 12, color: COLORS.textMuted, marginTop: 2,
  },
  npVoice: {
    fontFamily: FONTS.uiRegular, fontSize: 10, color: COLORS.textLight, marginTop: 1,
  },
  npProgress: {
    width: '100%', height: 4, backgroundColor: COLORS.cardBorder,
    borderRadius: 2, marginBottom: 6, overflow: 'hidden',
  },
  npProgressFill: {
    height: '100%', backgroundColor: COLORS.primary, borderRadius: 2,
  },
  npTimeRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12,
  },
  npTime: {
    fontFamily: FONTS.uiRegular, fontSize: 10, color: COLORS.textLight,
  },
  npControls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24,
  },
  ctrlBtn: { padding: 4 },
  ctrlSm: { fontSize: 18, opacity: 0.5, color: COLORS.textDark },
  ctrlMd: { fontSize: 22, opacity: 0.7, color: COLORS.textDark },
  ctrlPlay: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
  },
  ctrlPlayIcon: { fontSize: 20 },

  // Book browser
  bookSection: { marginBottom: 24 },
  testamentTabs: {
    flexDirection: 'row', backgroundColor: COLORS.cardBorder,
    borderRadius: 8, padding: 3, marginBottom: 14,
  },
  testamentTab: {
    flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6,
  },
  testamentTabActive: {
    backgroundColor: COLORS.card,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  testamentTabText: {
    fontFamily: FONTS.uiSemiBold, fontSize: 12, color: COLORS.textMuted,
  },
  testamentTabTextActive: {
    color: COLORS.primary,
  },
  bookGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  bookItem: {
    width: '48.5%',
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
    borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  bookItemPlaying: {
    borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight,
  },
  bookNum: {
    width: 28, height: 28, borderRadius: 7,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  bookNumPlaying: {
    backgroundColor: COLORS.primary,
  },
  bookNumText: {
    fontFamily: FONTS.uiSemiBold, fontSize: 10, color: COLORS.primary,
  },
  bookNumTextPlaying: {
    color: COLORS.white,
  },
  bookNameCol: { flex: 1 },
  bookName: {
    fontFamily: FONTS.uiSemiBold, fontSize: 12, color: COLORS.textDark,
  },
  bookChapters: {
    fontFamily: FONTS.uiRegular, fontSize: 10, color: COLORS.textMuted, marginTop: 1,
  },
  playingIndicator: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 14,
  },
  bar: {
    width: 3, backgroundColor: COLORS.primary, borderRadius: 1,
  },
});
