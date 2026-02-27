import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS, TIMEZONES } from '../src/constants/theme';
import { updatePreferences } from '../src/utils/supabase';
import { saveSubscriber, setOnboarded } from '../src/utils/storage';
import { formatDeliveryTime } from '../src/utils/bible';

export default function PreferencesScreen() {
  const router = useRouter();
  const { phone, subscriberId } = useLocalSearchParams<{ phone: string; subscriberId: string }>();

  const [verseFormat, setVerseFormat] = useState<'single' | 'passage'>('single');
  const [translation, setTranslation] = useState<'KJV' | 'ASV'>('KJV');
  const [verseMode, setVerseMode] = useState<'random' | 'sequential' | 'both'>('random');
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);
  const [timezone, setTimezone] = useState('America/New_York');
  const [loading, setLoading] = useState(false);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  async function handleSave() {
    setLoading(true);
    try {
      const result = await updatePreferences(phone!, {
        translation,
        verse_format: verseFormat,
        verse_mode: verseMode,
        delivery_hour: hour,
        delivery_minute: minute,
        timezone,
      });

      if (result.success) {
        await saveSubscriber({
          id: subscriberId!,
          phone: phone!,
          translation,
          verse_format: verseFormat,
          verse_mode: verseMode,
          delivery_hour: hour,
          delivery_minute: minute,
          timezone,
        });
        await setOnboarded(true);
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', 'Failed to save preferences. Please try again.');
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong.');
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gradientTop} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Your Preferences</Text>
        <Text style={styles.subtitle}>Customize how you receive your daily verse.</Text>

        {/* Bible Translation */}
        <Text style={styles.sectionLabel}>BIBLE TRANSLATION</Text>
        <View style={styles.optionRow}>
          <TouchableOpacity
            style={[styles.optionCard, translation === 'KJV' && styles.optionCardActive]}
            onPress={() => setTranslation('KJV')}
          >
            <Text style={styles.optionEmoji}>📖</Text>
            <Text style={[styles.optionTitle, translation === 'KJV' && styles.optionTitleActive]}>
              KJV
            </Text>
            <Text style={styles.optionDesc}>King James Version</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionCard, translation === 'ASV' && styles.optionCardActive]}
            onPress={() => setTranslation('ASV')}
          >
            <Text style={styles.optionEmoji}>📖</Text>
            <Text style={[styles.optionTitle, translation === 'ASV' && styles.optionTitleActive]}>
              ASV
            </Text>
            <Text style={styles.optionDesc}>American Standard</Text>
          </TouchableOpacity>
        </View>

        {/* Verse Format */}
        <Text style={styles.sectionLabel}>VERSE FORMAT</Text>
        <View style={styles.optionRow}>
          <TouchableOpacity
            style={[styles.optionCard, verseFormat === 'single' && styles.optionCardActive]}
            onPress={() => setVerseFormat('single')}
          >
            <Text style={styles.optionEmoji}>1️⃣</Text>
            <Text style={[styles.optionTitle, verseFormat === 'single' && styles.optionTitleActive]}>
              Single Verse
            </Text>
            <Text style={styles.optionDesc}>One powerful verse</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionCard, verseFormat === 'passage' && styles.optionCardActive]}
            onPress={() => setVerseFormat('passage')}
          >
            <Text style={styles.optionEmoji}>📜</Text>
            <Text style={[styles.optionTitle, verseFormat === 'passage' && styles.optionTitleActive]}>
              Short Passage
            </Text>
            <Text style={styles.optionDesc}>3-5 verses for context</Text>
          </TouchableOpacity>
        </View>

        {/* Delivery Time */}
        <Text style={styles.sectionLabel}>VERSE MODE</Text>
        <View style={[styles.optionRow, { flexDirection: 'column', gap: SPACING.sm }]}>
          <TouchableOpacity
            style={[styles.optionCard, { flexDirection: 'row', alignItems: 'center', padding: 14 }, verseMode === 'random' && styles.optionCardActive]}
            onPress={() => setVerseMode('random')}
          >
            <Text style={{ fontSize: 22, marginRight: 12 }}>🎲</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionTitle, verseMode === 'random' && styles.optionTitleActive]}>Random</Text>
              <Text style={styles.optionDesc}>A surprise verse every day</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionCard, { flexDirection: 'row', alignItems: 'center', padding: 14 }, verseMode === 'sequential' && styles.optionCardActive]}
            onPress={() => setVerseMode('sequential')}
          >
            <Text style={{ fontSize: 22, marginRight: 12 }}>📚</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionTitle, verseMode === 'sequential' && styles.optionTitleActive]}>Cover to Cover</Text>
              <Text style={styles.optionDesc}>Genesis to Revelation, in order</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionCard, { flexDirection: 'row', alignItems: 'center', padding: 14 }, verseMode === 'both' && styles.optionCardActive]}
            onPress={() => setVerseMode('both')}
          >
            <Text style={{ fontSize: 22, marginRight: 12 }}>✨</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionTitle, verseMode === 'both' && styles.optionTitleActive]}>Both</Text>
              <Text style={styles.optionDesc}>Random verse + reading plan each day</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Delivery Time (original) */}
        <Text style={styles.sectionLabel}>DELIVERY TIME</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
          {hours.map((h) => (
            <TouchableOpacity
              key={h}
              style={[styles.timeChip, hour === h && styles.timeChipActive]}
              onPress={() => setHour(h)}
            >
              <Text style={[styles.timeChipText, hour === h && styles.timeChipTextActive]}>
                {formatDeliveryTime(h)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Timezone */}
        <Text style={styles.sectionLabel}>YOUR TIMEZONE</Text>
        <View style={styles.tzList}>
          {TIMEZONES.map((tz) => (
            <TouchableOpacity
              key={tz.value}
              style={[styles.tzChip, timezone === tz.value && styles.tzChipActive]}
              onPress={() => setTimezone(tz.value)}
            >
              <Text style={[styles.tzText, timezone === tz.value && styles.tzTextActive]}>
                {tz.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Your daily verse</Text>
          <Text style={styles.summaryText}>
            {verseFormat === 'single' ? 'A single verse' : 'A short passage (3-5 verses)'} will be
            texted to you every day at {formatDeliveryTime(hour, minute)}{' '}
            {TIMEZONES.find((t) => t.value === timezone)?.label}.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.buttonText}>Start Receiving Verses</Text>
          )}
        </TouchableOpacity>
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
  scroll: { padding: SPACING.lg, paddingTop: SPACING.xxl },
  title: {
    fontFamily: FONTS.titleSemiBold, fontSize: 26, color: COLORS.textTitle,
    letterSpacing: 0.5, marginBottom: SPACING.xs,
  },
  subtitle: {
    fontFamily: FONTS.uiRegular, fontSize: 15, color: COLORS.textMuted,
    marginBottom: SPACING.xl,
  },
  sectionLabel: {
    fontFamily: FONTS.uiSemiBold, fontSize: 11, color: COLORS.primary,
    letterSpacing: 1.5, marginBottom: SPACING.sm, marginTop: SPACING.md,
  },
  optionRow: { flexDirection: 'row', gap: SPACING.sm },
  optionCard: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    padding: SPACING.md, alignItems: 'center', gap: SPACING.xs,
  },
  optionCardActive: {
    borderColor: COLORS.primary, backgroundColor: '#FFF8EE',
  },
  optionEmoji: { fontSize: 24 },
  optionTitle: {
    fontFamily: FONTS.uiSemiBold, fontSize: 13, color: COLORS.textDark,
  },
  optionTitleActive: { color: COLORS.primary },
  optionDesc: {
    fontFamily: FONTS.uiRegular, fontSize: 11, color: COLORS.textMuted, textAlign: 'center',
  },
  timeScroll: { marginBottom: SPACING.md },
  timeChip: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.sm,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    paddingVertical: 10, paddingHorizontal: 16, marginRight: SPACING.sm,
  },
  timeChipActive: {
    backgroundColor: COLORS.primary, borderColor: COLORS.primary,
  },
  timeChipText: {
    fontFamily: FONTS.uiMedium, fontSize: 13, color: COLORS.textDark,
  },
  timeChipTextActive: { color: COLORS.white },
  tzList: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  tzChip: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.sm,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    paddingVertical: 10, paddingHorizontal: 14,
  },
  tzChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tzText: { fontFamily: FONTS.uiMedium, fontSize: 13, color: COLORS.textDark },
  tzTextActive: { color: COLORS.white },
  summaryCard: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    padding: SPACING.md, marginTop: SPACING.md, marginBottom: SPACING.lg,
  },
  summaryTitle: {
    fontFamily: FONTS.uiSemiBold, fontSize: 13, color: COLORS.primary, marginBottom: SPACING.xs,
  },
  summaryText: {
    fontFamily: FONTS.verseRegular, fontSize: 14, color: COLORS.textDark, lineHeight: 22,
  },
  button: {
    backgroundColor: COLORS.primary, paddingVertical: 16,
    borderRadius: RADIUS.md, alignItems: 'center', marginBottom: SPACING.xxl,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    fontFamily: FONTS.titleSemiBold, fontSize: 15, color: COLORS.white, letterSpacing: 1.2,
  },
});
