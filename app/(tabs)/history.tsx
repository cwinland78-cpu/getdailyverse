import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';
import { getSubscriber, saveSubscriber } from '../../src/utils/storage';
import { supabase } from '../../src/utils/supabase';

interface SentVerse {
  id: string;
  sent_at: string;
  verse: {
    book: string;
    chapter: number;
    verse: number;
    text: string;
    translation?: string;
  };
}

const PAGE_SIZE = 20;

export default function HistoryScreen() {
  const [verses, setVerses] = useState<SentVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [subscriberId, setSubscriberId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInitial();
  }, []);

  async function loadInitial() {
    setLoading(true);
    setError(null);
    try {
      const sub = await getSubscriber();
      if (!sub) {
        setLoading(false);
        return;
      }

      // Look up the real subscriber_id from the database by phone
      // Local storage may have a stale ID from an earlier signup attempt
      let subId = sub.id;
      try {
        const { data: dbSub } = await supabase
          .from('subscribers')
          .select('id')
          .eq('phone', sub.phone)
          .single();
        if (dbSub && dbSub.id) {
          subId = dbSub.id;
          // Update local storage if it was stale
          if (subId !== sub.id) {
            await saveSubscriber({ ...sub, id: subId });
          }
        }
      } catch (_) {
        // Fall back to local ID if lookup fails
      }

      setSubscriberId(subId);
      await fetchVerses(subId, false);
    } catch (e) {
      console.error('Error loading history:', e);
      setError('Could not load history. Pull down to retry.');
    }
    setLoading(false);
  }

  async function fetchVerses(subId: string, append: boolean) {
    try {
      let query = supabase
        .from('sent_verses')
        .select(`
          id,
          sent_at,
          verse:verse_id (
            book,
            chapter,
            verse,
            text,
            translation
          )
        `)
        .eq('subscriber_id', subId)
        .order('sent_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (append && verses.length > 0) {
        const lastDate = verses[verses.length - 1].sent_at;
        query = query.lt('sent_at', lastDate);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Fetch error:', fetchError);
        setError('Could not load verses.');
        return;
      }

      // Supabase returns joined fields as arrays; normalize to single objects
      const valid = (data || [])
        .filter((d: any) => d.verse)
        .map((d: any) => ({
          id: d.id,
          sent_at: d.sent_at,
          verse: Array.isArray(d.verse) ? d.verse[0] : d.verse,
        }))
        .filter((d: any) => d.verse) as SentVerse[];

      if (valid.length < PAGE_SIZE) {
        setHasMore(false);
      }

      if (append) {
        setVerses(prev => [...prev, ...valid]);
      } else {
        setVerses(valid);
        setHasMore(valid.length >= PAGE_SIZE);
      }
    } catch (e) {
      console.error('fetchVerses error:', e);
      setError('Something went wrong loading history.');
    }
  }

  const onRefresh = useCallback(async () => {
    if (!subscriberId) return;
    setRefreshing(true);
    setHasMore(true);
    await fetchVerses(subscriberId, false);
    setRefreshing(false);
  }, [subscriberId]);

  async function loadMore() {
    if (!subscriberId || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      await fetchVerses(subscriberId, true);
    } catch (e) { console.error('loadMore error:', e); }
    setLoadingMore(false);
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }

  function fmtTime(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  function renderVerse({ item }: { item: SentVerse }) {
    const v = item.verse;
    const reference = `${v.book} ${v.chapter}:${v.verse}`;
    const tag = v.translation || 'KJV';

    return (
      <View style={[styles.verseCard, SHADOWS.soft]}>
        <View style={styles.verseHeader}>
          <Text style={styles.verseRef}>{reference}</Text>
          <Text style={styles.verseTag}>{tag}</Text>
        </View>
        <Text style={styles.verseText}>"{v.text}"</Text>
        <View style={styles.verseMeta}>
          <Text style={styles.verseDate}>{formatDate(item.sent_at)}</Text>
          <Text style={styles.verseDot}>·</Text>
          <Text style={styles.verseTime}>{fmtTime(item.sent_at)}</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.gradientTop} />
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!subscriberId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.gradientTop} />
        <View style={styles.content}>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>Your past verses will appear here</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyTitle}>No account found</Text>
            <Text style={styles.emptyText}>
              Set up SMS delivery to start receiving daily verses. They'll all be saved here for you to revisit.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (verses.length === 0 && !error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.gradientTop} />
        <View style={styles.content}>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>Your past verses will appear here</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyTitle}>No verses yet</Text>
            <Text style={styles.emptyText}>
              Once you start receiving daily texts, every verse will be saved here for you to revisit.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gradientTop} />
      <FlatList
        data={verses}
        keyExtractor={(item) => item.id}
        renderItem={renderVerse}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.title}>History</Text>
            <Text style={styles.subtitle}>
              {verses.length} verse{verses.length !== 1 ? 's' : ''} received
            </Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          error ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>⚠️</Text>
              <Text style={styles.emptyTitle}>{error}</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  gradientTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 160,
    backgroundColor: COLORS.backgroundGradientTop, opacity: 0.5,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, padding: SPACING.lg, paddingTop: SPACING.xl },
  listContent: { padding: SPACING.lg, paddingTop: SPACING.xl },
  listHeader: { marginBottom: SPACING.md },
  title: {
    fontFamily: FONTS.titleSemiBold, fontSize: 24, color: COLORS.textTitle,
    letterSpacing: 0.8, marginBottom: 4,
  },
  subtitle: {
    fontFamily: FONTS.uiRegular, fontSize: 14, color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  verseCard: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    padding: SPACING.md, marginBottom: 12,
  },
  verseHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  verseRef: {
    fontFamily: FONTS.titleSemiBold, fontSize: 14, color: COLORS.primary,
    letterSpacing: 0.3,
  },
  verseTag: {
    fontFamily: FONTS.uiSemiBold, fontSize: 10, color: COLORS.primaryMuted,
    backgroundColor: COLORS.primaryLight, borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2, overflow: 'hidden',
  },
  verseText: {
    fontFamily: FONTS.verseRegular, fontSize: 15, color: COLORS.textDark,
    lineHeight: 24, marginBottom: 10,
  },
  verseMeta: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  verseDate: {
    fontFamily: FONTS.uiRegular, fontSize: 11, color: COLORS.textLight,
  },
  verseDot: {
    fontFamily: FONTS.uiRegular, fontSize: 11, color: COLORS.textLight,
  },
  verseTime: {
    fontFamily: FONTS.uiRegular, fontSize: 11, color: COLORS.textLight,
  },
  footerLoader: { paddingVertical: SPACING.lg },
  emptyState: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingBottom: 100, paddingTop: 60,
  },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyTitle: {
    fontFamily: FONTS.titleRegular, fontSize: 20, color: COLORS.textTitle,
    marginBottom: SPACING.sm, textAlign: 'center',
  },
  emptyText: {
    fontFamily: FONTS.uiRegular, fontSize: 14, color: COLORS.textMuted,
    textAlign: 'center', lineHeight: 22, maxWidth: 280,
  },
});
