import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS, TIMEZONES } from '../../src/constants/theme';
import { getSubscriber, saveSubscriber, SubscriberData } from '../../src/utils/storage';
import { updatePreferences } from '../../src/utils/supabase';
import { formatDeliveryTime } from '../../src/utils/bible';

export default function SettingsScreen() {
  const [subscriber, setSubscriber] = useState<SubscriberData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSubscriber();
  }, []);

  async function loadSubscriber() {
    const sub = await getSubscriber();
    setSubscriber(sub);
  }

  async function updateField(field: string, value: any) {
    if (!subscriber) return;
    setLoading(true);
    try {
      const result = await updatePreferences(subscriber.phone, { [field]: value });
      if (result.success) {
        const updated = { ...subscriber, [field]: value };
        setSubscriber(updated);
        await saveSubscriber(updated);
      } else {
        Alert.alert('Error', 'Failed to update. Please try again.');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong.');
    }
    setLoading(false);
  }

  if (!subscriber) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const tzLabel = TIMEZONES.find(t => t.value === subscriber.timezone)?.label || subscriber.timezone;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gradientTop} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your daily verse delivery</Text>

        {/* Current config summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>YOUR SUBSCRIPTION</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Phone</Text>
            <Text style={styles.rowValue}>{subscriber.phone}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Translation</Text>
            <Text style={styles.rowValue}>{subscriber.translation}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Format</Text>
            <Text style={styles.rowValue}>
              {subscriber.verse_format === 'single' ? 'Single Verse' : 'Short Passage'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Delivery Time</Text>
            <Text style={styles.rowValue}>
              {formatDeliveryTime(subscriber.delivery_hour, subscriber.delivery_minute)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Timezone</Text>
            <Text style={styles.rowValue}>{tzLabel}</Text>
          </View>
        </View>

        {/* Translation Toggle */}
        <Text style={styles.sectionLabel}>BIBLE TRANSLATION</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggle, subscriber.translation === 'KJV' && styles.toggleActive]}
            onPress={() => updateField('translation', 'KJV')}
          >
            <Text style={[styles.toggleText, subscriber.translation === 'KJV' && styles.toggleTextActive]}>
              KJV
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggle, subscriber.translation === 'ASV' && styles.toggleActive]}
            onPress={() => updateField('translation', 'ASV')}
          >
            <Text style={[styles.toggleText, subscriber.translation === 'ASV' && styles.toggleTextActive]}>
              ASV
            </Text>
          </TouchableOpacity>
        </View>

        {/* Verse Format Toggle */}
        <Text style={styles.sectionLabel}>VERSE FORMAT</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggle, subscriber.verse_format === 'single' && styles.toggleActive]}
            onPress={() => updateField('verse_format', 'single')}
          >
            <Text style={[styles.toggleText, subscriber.verse_format === 'single' && styles.toggleTextActive]}>
              Single Verse
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggle, subscriber.verse_format === 'passage' && styles.toggleActive]}
            onPress={() => updateField('verse_format', 'passage')}
          >
            <Text style={[styles.toggleText, subscriber.verse_format === 'passage' && styles.toggleTextActive]}>
              Short Passage
            </Text>
          </TouchableOpacity>
        </View>

        {/* Delivery Time */}
        <Text style={styles.sectionLabel}>DELIVERY TIME</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
          {Array.from({ length: 24 }, (_, i) => i).map((h) => (
            <TouchableOpacity
              key={h}
              style={[styles.timeChip, subscriber.delivery_hour === h && styles.timeChipActive]}
              onPress={() => updateField('delivery_hour', h)}
            >
              <Text style={[styles.timeText, subscriber.delivery_hour === h && styles.timeTextActive]}>
                {formatDeliveryTime(h)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Timezone */}
        <Text style={styles.sectionLabel}>TIMEZONE</Text>
        <View style={styles.tzList}>
          {TIMEZONES.map((tz) => (
            <TouchableOpacity
              key={tz.value}
              style={[styles.tzChip, subscriber.timezone === tz.value && styles.tzChipActive]}
              onPress={() => updateField('timezone', tz.value)}
            >
              <Text style={[styles.tzText, subscriber.timezone === tz.value && styles.tzTextActive]}>
                {tz.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Links */}
        <View style={styles.linksSection}>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Linking.openURL('https://getdailyverse.com')}
          >
            <Text style={styles.linkText}>Visit our website</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Linking.openURL('mailto:support@getdailyverse.com')}
          >
            <Text style={styles.linkText}>Contact support</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.savingOverlay}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.savingText}>Saving...</Text>
          </View>
        )}

        <Text style={styles.version}>The Daily Verse v1.0.0</Text>
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
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: SPACING.lg, paddingTop: SPACING.xl },
  title: {
    fontFamily: FONTS.titleSemiBold, fontSize: 24, color: COLORS.textTitle,
    letterSpacing: 0.8, marginBottom: 4,
  },
  subtitle: {
    fontFamily: FONTS.uiRegular, fontSize: 14, color: COLORS.textMuted,
    marginBottom: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    padding: SPACING.md, marginBottom: SPACING.lg,
  },
  cardTitle: {
    fontFamily: FONTS.uiSemiBold, fontSize: 11, color: COLORS.primary,
    letterSpacing: 1.5, marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 6,
  },
  rowLabel: { fontFamily: FONTS.uiRegular, fontSize: 14, color: COLORS.textMuted },
  rowValue: { fontFamily: FONTS.uiSemiBold, fontSize: 14, color: COLORS.textDark },
  divider: { height: 1, backgroundColor: COLORS.cardBorder, marginVertical: 4 },
  sectionLabel: {
    fontFamily: FONTS.uiSemiBold, fontSize: 11, color: COLORS.primary,
    letterSpacing: 1.5, marginBottom: SPACING.sm, marginTop: SPACING.sm,
  },
  toggleRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  toggle: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.sm,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    paddingVertical: 12, alignItems: 'center',
  },
  toggleActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  toggleText: { fontFamily: FONTS.uiMedium, fontSize: 13, color: COLORS.textDark },
  toggleTextActive: { color: COLORS.white },
  timeScroll: { marginBottom: SPACING.lg },
  timeChip: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.sm,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    paddingVertical: 10, paddingHorizontal: 14, marginRight: SPACING.sm,
  },
  timeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  timeText: { fontFamily: FONTS.uiMedium, fontSize: 12, color: COLORS.textDark },
  timeTextActive: { color: COLORS.white },
  tzList: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  tzChip: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.sm,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    paddingVertical: 10, paddingHorizontal: 14,
  },
  tzChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tzText: { fontFamily: FONTS.uiMedium, fontSize: 13, color: COLORS.textDark },
  tzTextActive: { color: COLORS.white },
  linksSection: {
    borderTopWidth: 1, borderTopColor: COLORS.divider,
    paddingTop: SPACING.md, marginTop: SPACING.md,
  },
  linkRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14,
  },
  linkText: { fontFamily: FONTS.uiMedium, fontSize: 15, color: COLORS.primary },
  linkArrow: { fontFamily: FONTS.uiRegular, fontSize: 18, color: COLORS.primaryMuted },
  savingOverlay: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: SPACING.md,
  },
  savingText: { fontFamily: FONTS.uiMedium, fontSize: 13, color: COLORS.textMuted },
  version: {
    fontFamily: FONTS.uiRegular, fontSize: 12, color: COLORS.textLight,
    textAlign: 'center', marginTop: SPACING.lg, marginBottom: SPACING.xxl,
  },
});
