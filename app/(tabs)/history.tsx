import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING } from '../../src/constants/theme';

export default function HistoryScreen() {
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  gradientTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 160,
    backgroundColor: COLORS.backgroundGradientTop, opacity: 0.5,
  },
  content: { flex: 1, padding: SPACING.lg, paddingTop: SPACING.xl },
  title: {
    fontFamily: FONTS.titleSemiBold, fontSize: 24, color: COLORS.textTitle,
    letterSpacing: 0.8, marginBottom: 4,
  },
  subtitle: {
    fontFamily: FONTS.uiRegular, fontSize: 14, color: COLORS.textMuted,
    marginBottom: SPACING.xl,
  },
  emptyState: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingBottom: 100,
  },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyTitle: {
    fontFamily: FONTS.titleRegular, fontSize: 20, color: COLORS.textTitle,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontFamily: FONTS.uiRegular, fontSize: 14, color: COLORS.textMuted,
    textAlign: 'center', lineHeight: 22, maxWidth: 280,
  },
});
