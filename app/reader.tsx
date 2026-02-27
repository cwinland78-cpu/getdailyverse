import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Share,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { COLORS, FONTS, SPACING, RADIUS } from '../src/constants/theme';
import { getChapter } from '../src/utils/supabase';
import { BIBLE_BOOKS } from '../src/utils/bible';

interface Verse {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export default function ReaderScreen() {
  const router = useRouter();
  const { book, chapter, verse: highlightVerse } = useLocalSearchParams<{
    book: string;
    chapter: string;
    verse?: string;
  }>();

  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentChapter, setCurrentChapter] = useState(parseInt(chapter || '1'));
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const bookInfo = BIBLE_BOOKS.find((b) => b.name === book);
  const totalChapters = bookInfo?.chapters || 1;

  useEffect(() => {
    loadChapter();
  }, [currentChapter]);

  async function loadChapter() {
    setLoading(true);
    setSelectedVerse(null);
    try {
      const data = await getChapter(book!, currentChapter);
      setVerses(data || []);
    } catch (err) {
      console.error('Error loading chapter:', err);
    }
    setLoading(false);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  function handleVersePress(v: Verse) {
    setSelectedVerse(selectedVerse?.id === v.id ? null : v);
  }

  async function handleShareVerse(v: Verse) {
    const ref = `${v.book} ${v.chapter}:${v.verse}`;
    const message = `📖 ${ref} (KJV)\n\n"${v.text}"\n\nSent via The Daily Verse`;
    await Share.share({ message });
  }

  async function handleCopyVerse(v: Verse) {
    const ref = `${v.book} ${v.chapter}:${v.verse}`;
    await Clipboard.setStringAsync(`${ref} (KJV) - "${v.text}"`);
  }

  const highlightNum = highlightVerse ? parseInt(highlightVerse) : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gradientTop} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {book} {currentChapter}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Chapter navigation */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chapterNav}>
        {Array.from({ length: totalChapters }, (_, i) => i + 1).map((ch) => (
          <TouchableOpacity
            key={ch}
            style={[styles.chapterChip, currentChapter === ch && styles.chapterChipActive]}
            onPress={() => setCurrentChapter(ch)}
          >
            <Text style={[styles.chapterNum, currentChapter === ch && styles.chapterNumActive]}>
              {ch}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Verses */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.versesContainer}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          verses.map((v) => {
            const isHighlighted = highlightNum === v.verse;
            const isSelected = selectedVerse?.id === v.id;

            return (
              <View key={v.id}>
                <TouchableOpacity
                  style={[
                    styles.verseLine,
                    isHighlighted && styles.verseHighlighted,
                    isSelected && styles.verseSelected,
                  ]}
                  onPress={() => handleVersePress(v)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.verseNum}>{v.verse}</Text>
                  <Text style={styles.verseText}>{v.text}</Text>
                </TouchableOpacity>

                {isSelected && (
                  <View style={styles.verseActions}>
                    <TouchableOpacity
                      style={styles.verseActionBtn}
                      onPress={() => handleShareVerse(v)}
                    >
                      <Text style={styles.actionIcon}>📤</Text>
                      <Text style={styles.actionLabel}>Share</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.verseActionBtn}
                      onPress={() => handleCopyVerse(v)}
                    >
                      <Text style={styles.actionIcon}>📋</Text>
                      <Text style={styles.actionLabel}>Copy</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}

        {/* Prev / Next chapter buttons */}
        {!loading && (
          <View style={styles.navRow}>
            {currentChapter > 1 && (
              <TouchableOpacity
                style={styles.navBtn}
                onPress={() => setCurrentChapter(currentChapter - 1)}
              >
                <Text style={styles.navBtnText}>← Chapter {currentChapter - 1}</Text>
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }} />
            {currentChapter < totalChapters && (
              <TouchableOpacity
                style={styles.navBtn}
                onPress={() => setCurrentChapter(currentChapter + 1)}
              >
                <Text style={styles.navBtnText}>Chapter {currentChapter + 1} →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  gradientTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 120,
    backgroundColor: COLORS.backgroundGradientTop, opacity: 0.4,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
  },
  closeBtn: { width: 60 },
  closeText: { fontFamily: FONTS.uiMedium, fontSize: 15, color: COLORS.primary },
  headerTitle: {
    fontFamily: FONTS.titleSemiBold, fontSize: 18, color: COLORS.textTitle,
    letterSpacing: 0.5, textAlign: 'center', flex: 1,
  },
  chapterNav: {
    paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  chapterChip: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 6, backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  chapterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chapterNum: { fontFamily: FONTS.uiMedium, fontSize: 13, color: COLORS.textDark },
  chapterNumActive: { color: COLORS.white },
  versesContainer: { padding: SPACING.lg, paddingBottom: 100 },
  loadingWrap: { height: 300, justifyContent: 'center', alignItems: 'center' },
  verseLine: {
    flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 4,
    borderRadius: RADIUS.sm,
  },
  verseHighlighted: { backgroundColor: 'rgba(155, 107, 62, 0.1)' },
  verseSelected: { backgroundColor: 'rgba(155, 107, 62, 0.08)' },
  verseNum: {
    fontFamily: FONTS.uiSemiBold, fontSize: 11, color: COLORS.primary,
    width: 28, paddingTop: 3,
  },
  verseText: {
    flex: 1, fontFamily: FONTS.verseRegular, fontSize: 16, lineHeight: 26,
    color: COLORS.textDark,
  },
  verseActions: {
    flexDirection: 'row', gap: SPACING.sm,
    paddingLeft: 28, paddingBottom: SPACING.sm,
  },
  verseActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.sm,
    paddingVertical: 6, paddingHorizontal: 10,
  },
  actionIcon: { fontSize: 12 },
  actionLabel: { fontFamily: FONTS.uiMedium, fontSize: 11, color: COLORS.primary },
  navRow: {
    flexDirection: 'row', marginTop: SPACING.xl, paddingTop: SPACING.md,
    borderTopWidth: 1, borderTopColor: COLORS.divider,
  },
  navBtn: {
    backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.sm,
    paddingVertical: 10, paddingHorizontal: 16,
  },
  navBtnText: { fontFamily: FONTS.uiMedium, fontSize: 13, color: COLORS.primary },
});
