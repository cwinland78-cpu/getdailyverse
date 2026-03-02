import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Share, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';
import { getRandomVerse, getChapter } from '../../src/utils/supabase';
import { getSubscriber } from '../../src/utils/storage';
import { formatDeliveryTime } from '../../src/utils/bible';
import { formatTime, VOICE_OPTIONS } from '../../src/utils/audio';
import { audioManager, AudioManagerState } from '../../src/utils/audioManager';

interface Verse {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export default function TodayScreen() {
  const router = useRouter();
  const [verse, setVerse] = useState<Verse | null>(null);
  const [passageVerses, setPassageVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliveryTime, setDeliveryTime] = useState('8:00 AM');
  const [copied, setCopied] = useState(false);

  // Audio state from shared manager
  const [audioState, setAudioState] = useState<AudioManagerState>(audioManager.getState());

  useEffect(() => {
    loadData();
    audioManager.init();
    const unsub = audioManager.subscribe(setAudioState);
    return unsub;
  }, []);

  async function loadData() {
    try {
      const sub = await getSubscriber();
      if (sub) {
        setDeliveryTime(formatDeliveryTime(sub.delivery_hour, sub.delivery_minute));
      }
      const v = await getRandomVerse();
      setVerse(v);

      if (v) {
        const chapterData = await getChapter(v.book, v.chapter);
        if (chapterData) {
          const verseIdx = chapterData.findIndex((cv: Verse) => cv.verse === v.verse);
          const start = Math.max(0, verseIdx - 2);
          const end = Math.min(chapterData.length, verseIdx + 4);
          setPassageVerses(chapterData.slice(start, end));
        }
      }
    } catch (err) {
      console.error('Error loading verse:', err);
    }
    setLoading(false);
  }

  function getReference() {
    if (!verse) return '';
    return `${verse.book} ${verse.chapter}:${verse.verse}`;
  }

  async function handleShare() {
    if (!verse) return;
    const message = `📖 ${getReference()} (KJV)\n\n"${verse.text}"\n\nSent via The Daily Verse`;
    await Share.share({ message });
  }

  async function handleCopy() {
    if (!verse) return;
    const text = `${getReference()} (KJV) - "${verse.text}"`;
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handlePlayPause() {
    if (!verse) return;

    // If nothing is loaded or different chapter, load this verse's chapter
    if (!audioState.isLoaded ||
        audioState.currentBook !== verse.book ||
        audioState.currentChapter !== verse.chapter) {
      await audioManager.loadAndPlay(verse.book, verse.chapter);
      return;
    }

    await audioManager.playPause();
  }

  async function handleSpeed() {
    await audioManager.cycleSpeed();
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gradientTop} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.date}>{today}</Text>
        <Text style={styles.title}>The Daily Verse</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : verse ? (
          <>
            {/* Daily Verse Card */}
            <View style={[styles.verseCard, SHADOWS.card]}>
              <View style={styles.crossSmall}>
                <View style={styles.crossV} />
                <View style={styles.crossH} />
              </View>

              <Text style={styles.verseRef}>{getReference()} · KJV</Text>
              <Text style={styles.verseText}>"{verse.text}"</Text>

              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
                  <Text style={styles.actionIcon}>📤</Text>
                  <Text style={styles.actionLabel}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={handleCopy}>
                  <Text style={styles.actionIcon}>{copied ? '✅' : '📋'}</Text>
                  <Text style={styles.actionLabel}>{copied ? 'Copied' : 'Copy'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Full Passage Section */}
            {passageVerses.length > 0 && (
              <View style={[styles.passageSection, SHADOWS.soft]}>
                <View style={styles.passageHeader}>
                  <Text style={styles.passageTitle}>📖 Full Passage</Text>
                  <Text style={styles.passageChapter}>
                    {verse.book} {verse.chapter}
                  </Text>
                </View>

                {passageVerses.map((pv) => (
                  <View
                    key={pv.id}
                    style={[
                      styles.passageVerseRow,
                      pv.verse === verse.verse && styles.passageHighlighted,
                    ]}
                  >
                    <Text style={styles.passageText}>
                      <Text style={styles.verseNum}>{pv.verse} </Text>
                      {pv.text}
                    </Text>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.readFullBtn}
                  onPress={() =>
                    router.push({
                      pathname: '/reader',
                      params: { book: verse.book, chapter: verse.chapter.toString() },
                    })
                  }
                >
                  <Text style={styles.readFullLabel}>Read Full Chapter →</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Audio Mini Player */}
            <View style={[styles.audioSection, SHADOWS.soft]}>
              <View style={styles.audioHeader}>
                <View style={styles.audioIconWrap}>
                  <Text style={{ fontSize: 18 }}>🎧</Text>
                </View>
                <View style={styles.audioTitleGroup}>
                  <Text style={styles.audioTitle}>Listen to the Bible</Text>
                  <Text style={styles.audioSubtitle}>Audio KJV · 66 Books</Text>
                </View>
              </View>

              <View style={styles.audioPlayer}>
                <TouchableOpacity
                  style={styles.audioPlayBtn}
                  onPress={handlePlayPause}
                  disabled={audioState.audioLoading}
                >
                  {audioState.audioLoading ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.playIcon}>{audioState.isPlaying ? '⏸' : '▶️'}</Text>
                  )}
                </TouchableOpacity>
                <View style={styles.audioTrackInfo}>
                  <Text style={styles.audioTrackName}>
                    {verse.book} Chapter {verse.chapter}
                  </Text>
                  <Text style={styles.audioTrackDetail}>
                    Starts at today's verse
                  </Text>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: audioState.durationMs > 0 ? `${(audioState.positionMs / audioState.durationMs) * 100}%` : '0%' },
                      ]}
                    />
                  </View>
                  <View style={styles.timeRow}>
                    <Text style={styles.timeText}>{formatTime(audioState.positionMs)}</Text>
                    <Text style={styles.timeText}>{formatTime(audioState.durationMs)}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.audioControls}>
                <TouchableOpacity onPress={handleSpeed}>
                  <Text style={styles.speedBtn}>{audioState.speed}x</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.openListenBtn}
                  onPress={() => router.push('/(tabs)/audio')}
                >
                  <Text style={styles.openListenLabel}>Open Full Player →</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.verseCard}>
            <Text style={styles.errorText}>Could not load verse. Pull down to refresh.</Text>
          </View>
        )}

        <View style={styles.deliveryRow}>
          <View style={styles.deliveryDot} />
          <Text style={styles.deliveryText}>Next text: {deliveryTime}</Text>
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
  date: {
    fontFamily: FONTS.uiMedium, fontSize: 12, color: COLORS.textMuted,
    letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4,
  },
  title: {
    fontFamily: FONTS.titleSemiBold, fontSize: 24, color: COLORS.textTitle,
    letterSpacing: 0.8, marginBottom: SPACING.lg,
  },
  loadingContainer: {
    height: 200, justifyContent: 'center', alignItems: 'center',
  },
  verseCard: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    padding: SPACING.lg, marginBottom: SPACING.md,
  },
  crossSmall: {
    width: 22, height: 22, marginBottom: SPACING.sm, opacity: 0.2,
  },
  crossV: {
    position: 'absolute', left: 10, width: 1.5, height: 22,
    backgroundColor: COLORS.primary,
  },
  crossH: {
    position: 'absolute', top: 6, width: 16, height: 1.5,
    backgroundColor: COLORS.primary, left: 3,
  },
  verseRef: {
    fontFamily: FONTS.uiSemiBold, fontSize: 11, color: COLORS.primary,
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: SPACING.sm,
  },
  verseText: {
    fontFamily: FONTS.verseItalic, fontSize: 18, lineHeight: 30,
    color: COLORS.textDark,
  },
  actions: {
    flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md,
    paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.cardBorder,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.sm,
    paddingVertical: 8, paddingHorizontal: 12,
  },
  actionIcon: { fontSize: 14 },
  actionLabel: {
    fontFamily: FONTS.uiMedium, fontSize: 12, color: COLORS.primary,
  },
  errorText: {
    fontFamily: FONTS.uiRegular, fontSize: 14, color: COLORS.textMuted,
    textAlign: 'center',
  },
  passageSection: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    padding: SPACING.lg, marginBottom: SPACING.md,
  },
  passageHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 14,
  },
  passageTitle: {
    fontFamily: FONTS.uiSemiBold, fontSize: 11, color: COLORS.primary,
    letterSpacing: 1, textTransform: 'uppercase',
  },
  passageChapter: {
    fontFamily: FONTS.uiMedium, fontSize: 11, color: COLORS.textMuted,
  },
  passageVerseRow: {
    marginBottom: 8,
  },
  passageHighlighted: {
    backgroundColor: 'rgba(155, 107, 62, 0.08)',
    borderLeftWidth: 2.5,
    borderLeftColor: COLORS.primary,
    paddingLeft: 12,
    paddingVertical: 4,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    marginLeft: -12,
  },
  passageText: {
    fontFamily: FONTS.verseRegular, fontSize: 14.5, lineHeight: 24,
    color: COLORS.textDark,
  },
  verseNum: {
    fontFamily: FONTS.uiSemiBold, fontSize: 10,
    color: COLORS.primary, opacity: 0.7,
  },
  readFullBtn: {
    alignItems: 'center', marginTop: 12, paddingVertical: 10,
    backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.sm,
  },
  readFullLabel: {
    fontFamily: FONTS.uiSemiBold, fontSize: 12, color: COLORS.primary,
    letterSpacing: 0.3,
  },
  audioSection: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    padding: 18, marginBottom: SPACING.md,
  },
  audioHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14,
  },
  audioIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  audioTitleGroup: { flex: 1 },
  audioTitle: {
    fontFamily: FONTS.uiSemiBold, fontSize: 14, color: COLORS.textDark,
  },
  audioSubtitle: {
    fontFamily: FONTS.uiRegular, fontSize: 11, color: COLORS.textMuted, marginTop: 1,
  },
  audioPlayer: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.searchBg, borderRadius: 10, padding: 12,
    marginBottom: 10,
  },
  audioPlayBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  playIcon: { fontSize: 16 },
  audioTrackInfo: { flex: 1 },
  audioTrackName: {
    fontFamily: FONTS.uiSemiBold, fontSize: 13, color: COLORS.textDark,
  },
  audioTrackDetail: {
    fontFamily: FONTS.uiRegular, fontSize: 11, color: COLORS.textMuted, marginTop: 2,
  },
  progressBar: {
    width: '100%', height: 3, backgroundColor: COLORS.divider,
    borderRadius: 2, marginTop: 8, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: COLORS.primary, borderRadius: 2,
  },
  timeRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 4,
  },
  timeText: {
    fontFamily: FONTS.uiRegular, fontSize: 10, color: COLORS.textLight,
  },
  audioControls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  speedBtn: {
    fontFamily: FONTS.uiSemiBold, fontSize: 11, color: COLORS.primary,
    backgroundColor: COLORS.primaryLight, borderRadius: 6,
    paddingVertical: 4, paddingHorizontal: 8,
    overflow: 'hidden',
  },
  openListenBtn: {
    paddingVertical: 4,
  },
  openListenLabel: {
    fontFamily: FONTS.uiSemiBold, fontSize: 12, color: COLORS.primary,
  },
  deliveryRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginBottom: SPACING.xl,
  },
  deliveryDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, opacity: 0.4,
  },
  deliveryText: {
    fontFamily: FONTS.uiRegular, fontSize: 12, color: COLORS.textMuted,
  },
});
