import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS, QUICK_PICK_BOOKS } from '../../src/constants/theme';
import { BIBLE_BOOKS, OT_BOOKS, NT_BOOKS, parseReference } from '../../src/utils/bible';

export default function BrowseScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'ot' | 'nt'>('all');

  function handleSearch() {
    const ref = parseReference(search);
    if (ref) {
      router.push({
        pathname: '/reader',
        params: {
          book: ref.book,
          chapter: ref.chapter.toString(),
          verse: ref.verse?.toString() || '',
        },
      });
    }
  }

  function openBook(bookName: string) {
    router.push({
      pathname: '/reader',
      params: { book: bookName, chapter: '1' },
    });
  }

  const displayBooks = activeTab === 'ot' ? OT_BOOKS : activeTab === 'nt' ? NT_BOOKS : BIBLE_BOOKS;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gradientTop} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Browse</Text>
        <Text style={styles.subtitle}>Search any verse or explore by book</Text>

        {/* Search bar */}
        <View style={[styles.searchContainer, SHADOWS.soft]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="John 3:16, Psalm 23, Romans 8:28..."
            placeholderTextColor={COLORS.textLight}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            autoCapitalize="words"
          />
        </View>

        {/* Quick picks */}
        <Text style={styles.sectionLabel}>POPULAR BOOKS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll}>
          {QUICK_PICK_BOOKS.map((book) => (
            <TouchableOpacity
              key={book}
              style={styles.quickPick}
              onPress={() => openBook(book)}
            >
              <Text style={styles.quickPickText}>{book}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Testament tabs */}
        <View style={styles.tabRow}>
          {(['all', 'ot', 'nt'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'all' ? 'All Books' : tab === 'ot' ? 'Old Testament' : 'New Testament'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Book list */}
        <View style={styles.bookGrid}>
          {displayBooks.map((book) => (
            <TouchableOpacity
              key={book.name}
              style={[styles.bookCard, SHADOWS.soft]}
              onPress={() => openBook(book.name)}
            >
              <Text style={styles.bookName}>{book.name}</Text>
              <Text style={styles.bookChapters}>{book.chapters} ch.</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  gradientTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 160,
    backgroundColor: COLORS.backgroundGradientTop, opacity: 0.5,
  },
  scroll: { padding: SPACING.lg, paddingTop: SPACING.xl },
  title: {
    fontFamily: FONTS.titleSemiBold, fontSize: 24, color: COLORS.textTitle,
    letterSpacing: 0.8, marginBottom: 4,
  },
  subtitle: {
    fontFamily: FONTS.uiRegular, fontSize: 14, color: COLORS.textMuted,
    marginBottom: SPACING.lg,
  },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
    borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, marginBottom: SPACING.lg,
  },
  searchIcon: { fontSize: 16, opacity: 0.5 },
  searchInput: {
    flex: 1, fontFamily: FONTS.uiRegular, fontSize: 15, color: COLORS.textDark,
    paddingVertical: 14,
  },
  sectionLabel: {
    fontFamily: FONTS.uiSemiBold, fontSize: 11, color: COLORS.primary,
    letterSpacing: 1.5, marginBottom: SPACING.sm,
  },
  quickScroll: { marginBottom: SPACING.lg },
  quickPick: {
    backgroundColor: COLORS.primaryLight, borderRadius: 20,
    paddingVertical: 8, paddingHorizontal: 16, marginRight: SPACING.sm,
  },
  quickPickText: {
    fontFamily: FONTS.uiMedium, fontSize: 13, color: COLORS.primary,
  },
  tabRow: {
    flexDirection: 'row', gap: SPACING.xs, marginBottom: SPACING.md,
  },
  tab: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontFamily: FONTS.uiMedium, fontSize: 12, color: COLORS.textMuted },
  tabTextActive: { color: COLORS.white },
  bookGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.xxl,
  },
  bookCard: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.sm,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    paddingVertical: 12, paddingHorizontal: 14,
    width: '48%',
  },
  bookName: {
    fontFamily: FONTS.uiSemiBold, fontSize: 13, color: COLORS.textDark,
  },
  bookChapters: {
    fontFamily: FONTS.uiRegular, fontSize: 11, color: COLORS.textLight, marginTop: 2,
  },
});
