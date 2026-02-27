import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../src/constants/theme';
import { BIBLE_BOOKS } from '../src/utils/bible';
import {
  getChapterAudioUrl, formatTime, getNextSpeed,
  getVoicePreference, getListenedChapters,
  saveAudioState, markChapterListened, VOICE_OPTIONS,
} from '../src/utils/audio';

export default function AudioChaptersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    book: string;
    currentBook?: string;
    currentChapter?: string;
    isPlaying?: string;
  }>();

  const bookName = params.book || 'Genesis';
  const bookData = BIBLE_BOOKS.find(b => b.name === bookName);
  const totalChapters = bookData?.chapters || 1;
  const activeChapter = parseInt(params.currentChapter || '0');

  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [audioLoading, setAudioLoading] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [currentChapter, setCurrentChapter] = useState(activeChapter || 1);
  const [selectedVoice, setSelectedVoice] = useState('david');
  const [listened, setListened] = useState<number[]>([]);

  useEffect(() => {
    loadData();
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
    });
    return () => { if (sound) sound.unloadAsync(); };
  }, []);

  async function loadData() {
    const voice = await getVoicePreference();
    setSelectedVoice(voice);
    const listenedChapters = await getListenedChapters(bookName);
    setListened(listenedChapters);
  }

  async function playChapter(chapter: number) {
    setAudioLoading(true);
    setCurrentChapter(chapter);

    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
    }

    try {
      const url = await getChapterAudioUrl(bookName, chapter, selectedVoice);
      if (url) {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: true, rate: speed },
          onPlaybackStatusUpdate
        );
        setSound(newSound);
        setIsPlaying(true);
        saveAudioState({
          currentBook: bookName,
          currentChapter: chapter,
          currentVoice: selectedVoice,
        });
        markChapterListened(bookName, chapter);
        setListened(prev => prev.includes(chapter) ? prev : [...prev, chapter]);
      }
    } catch (err) {
      console.error('Error loading audio:', err);
    }
    setAudioLoading(false);
  }

  async function handlePlayPause() {
    if (sound && isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
      return;
    }
    if (sound && !isPlaying) {
      await sound.playAsync();
      setIsPlaying(true);
      return;
    }
    playChapter(currentChapter);
  }

  function onPlaybackStatusUpdate(status: any) {
    if (status.isLoaded) {
      setPositionMs(status.positionMillis || 0);
      setDurationMs(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);
      if (status.didJustFinish) {
        setIsPlaying(false);
        if (currentChapter < totalChapters) {
          playChapter(currentChapter + 1);
        }
      }
    }
  }

  async function handleSpeed() {
    const next = getNextSpeed(speed);
    setSpeed(next);
    if (sound) await sound.setRateAsync(next, true);
  }

  async function handlePrev() {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
    }
    const prev = Math.max(1, currentChapter - 1);
    playChapter(prev);
  }

  async function handleNext() {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
    }
    const next = Math.min(totalChapters, currentChapter + 1);
    playChapter(next);
  }

  const voiceData = VOICE_OPTIONS.find(v => v.id === selectedVoice);
  const chapters = Array.from({ length: totalChapters }, (_, i) => i + 1);

  // Estimate total listening time (~4.5 min per chapter average)
  const estimatedMinutes = totalChapters * 4.5;
  const hours = Math.floor(estimatedMinutes / 60);
  const mins = Math.round(estimatedMinutes % 60);
  const timeStr = hours > 0 ? `~${hours} hr ${mins} min` : `~${mins} min`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gradientTop} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Audio Bible</Text>
        </TouchableOpacity>

        <Text style={styles.chapterTitle}>{bookName}</Text>
        <Text style={styles.chapterSubtitle}>
          {totalChapters} Chapters · {timeStr}
        </Text>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendListened]} />
            <Text style={styles.legendText}>Listened</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendPlaying]} />
            <Text style={styles.legendText}>Playing</Text>
          </View>
        </View>

        {/* Chapter Grid */}
        <View style={styles.chapterGrid}>
          {chapters.map((ch) => {
            const isActive = ch === currentChapter && (isPlaying || audioLoading);
            const isListened = listened.includes(ch) && !isActive;

            return (
              <TouchableOpacity
                key={ch}
                style={[
                  styles.chapterCell,
                  isListened && styles.chapterListened,
                  isActive && styles.chapterActive,
                ]}
                onPress={() => playChapter(ch)}
              >
                {audioLoading && ch === currentChapter ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={[
                    styles.chapterNum,
                    isActive && styles.chapterNumActive,
                    isListened && styles.chapterNumListened,
                  ]}>
                    {ch}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Mini Player */}
        <View style={[styles.miniPlayer, SHADOWS.card]}>
          <View style={styles.mpTop}>
            <View style={styles.mpArt}>
              <Text style={{ fontSize: 18 }}>📖</Text>
            </View>
            <View style={styles.mpInfo}>
              <Text style={styles.mpTitle} numberOfLines={1}>
                {bookName} Chapter {currentChapter}
              </Text>
              <Text style={styles.mpVoice}>Voice: {voiceData?.name || 'David'}</Text>
            </View>
          </View>

          <View style={styles.mpProgress}>
            <View
              style={[
                styles.mpProgressFill,
                { width: durationMs > 0 ? `${(positionMs / durationMs) * 100}%` : '0%' },
              ]}
            />
          </View>
          <View style={styles.mpTimeRow}>
            <Text style={styles.mpTime}>{formatTime(positionMs)}</Text>
            <Text style={styles.mpTime}>{formatTime(durationMs)}</Text>
          </View>

          <View style={styles.mpControls}>
            <TouchableOpacity onPress={handlePrev}>
              <Text style={styles.mpCtrlSm}>⏮</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSpeed}>
              <Text style={styles.mpSpeedBtn}>{speed}x</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mpPlayBtn} onPress={handlePlayPause}>
              {audioLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={{ fontSize: 16 }}>{isPlaying ? '⏸' : '▶️'}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSpeed}>
              <Text style={styles.mpSpeedBtn}>{speed}x</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNext}>
              <Text style={styles.mpCtrlSm}>⏭</Text>
            </TouchableOpacity>
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
  scroll: { padding: SPACING.lg, paddingTop: SPACING.md },

  backBtn: { marginBottom: 12 },
  backText: {
    fontFamily: FONTS.uiSemiBold, fontSize: 12, color: COLORS.primary,
  },
  chapterTitle: {
    fontFamily: FONTS.titleSemiBold, fontSize: 20, color: COLORS.textTitle,
    marginBottom: 4,
  },
  chapterSubtitle: {
    fontFamily: FONTS.uiRegular, fontSize: 12, color: COLORS.textMuted,
    marginBottom: 18,
  },

  // Legend
  legend: {
    flexDirection: 'row', gap: 16, justifyContent: 'center', marginBottom: 16,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendText: { fontFamily: FONTS.uiRegular, fontSize: 10, color: COLORS.textMuted },
  legendDot: {
    width: 10, height: 10, borderRadius: 4, borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  legendListened: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primaryMuted },
  legendPlaying: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },

  // Chapter grid
  chapterGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20,
  },
  chapterCell: {
    width: '18%', aspectRatio: 1,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  chapterListened: {
    backgroundColor: COLORS.primaryLight, borderColor: COLORS.primaryMuted,
  },
  chapterActive: {
    backgroundColor: COLORS.primary, borderColor: COLORS.primary,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  chapterNum: {
    fontFamily: FONTS.uiSemiBold, fontSize: 14, color: COLORS.textTitle,
  },
  chapterNumActive: { color: COLORS.white },
  chapterNumListened: { color: COLORS.primary },

  // Mini player
  miniPlayer: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    padding: 16, marginBottom: 24,
  },
  mpTop: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10,
  },
  mpArt: {
    width: 42, height: 42, borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  mpInfo: { flex: 1 },
  mpTitle: {
    fontFamily: FONTS.uiSemiBold, fontSize: 14, color: COLORS.textDark,
  },
  mpVoice: {
    fontFamily: FONTS.uiRegular, fontSize: 11, color: COLORS.textMuted, marginTop: 1,
  },
  mpProgress: {
    width: '100%', height: 3, backgroundColor: COLORS.cardBorder,
    borderRadius: 2, overflow: 'hidden',
  },
  mpProgressFill: {
    height: '100%', backgroundColor: COLORS.primary, borderRadius: 2,
  },
  mpTimeRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, marginBottom: 10,
  },
  mpTime: { fontFamily: FONTS.uiRegular, fontSize: 10, color: COLORS.textLight },
  mpControls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20,
  },
  mpCtrlSm: { fontSize: 16, opacity: 0.5, color: COLORS.textDark },
  mpPlayBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  mpSpeedBtn: {
    fontFamily: FONTS.uiSemiBold, fontSize: 11, color: COLORS.primary,
    backgroundColor: COLORS.primaryLight, borderRadius: 6,
    paddingVertical: 3, paddingHorizontal: 6, overflow: 'hidden',
  },
});
