import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS } from '../src/constants/theme';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gradientTop} />

      <View style={styles.content}>
        {/* Cross icon */}
        <View style={styles.crossContainer}>
          <View style={styles.crossVertical} />
          <View style={styles.crossHorizontal} />
        </View>

        <Text style={styles.title}>The Daily{'\n'}Verse</Text>
        <Text style={styles.subtitle}>
          Scripture delivered to your phone.{'\n'}
          Every day. By text message.
        </Text>

        <View style={styles.features}>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>📱</Text>
            <Text style={styles.featureText}>Real SMS, not a notification</Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>⏰</Text>
            <Text style={styles.featureText}>You pick the time</Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>📖</Text>
            <Text style={styles.featureText}>31,102 verses from the KJV Bible</Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>🆓</Text>
            <Text style={styles.featureText}>Completely free</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/verify')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Standard messaging rates may apply.{'\n'}
          Reply STOP at any time to unsubscribe.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    backgroundColor: COLORS.backgroundGradientTop,
    opacity: 0.7,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crossContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    opacity: 0.25,
  },
  crossVertical: {
    position: 'absolute',
    width: 2,
    height: 48,
    backgroundColor: COLORS.primary,
  },
  crossHorizontal: {
    position: 'absolute',
    width: 30,
    height: 2,
    backgroundColor: COLORS.primary,
    top: 14,
  },
  title: {
    fontFamily: FONTS.titleSemiBold,
    fontSize: 38,
    color: COLORS.textTitle,
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 48,
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontFamily: FONTS.verseItalic,
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  features: {
    alignSelf: 'stretch',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  featureIcon: {
    fontSize: 20,
    width: 32,
    textAlign: 'center',
  },
  featureText: {
    fontFamily: FONTS.uiRegular,
    fontSize: 15,
    color: COLORS.textDark,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: RADIUS.md,
    width: width - 80,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  buttonText: {
    fontFamily: FONTS.titleSemiBold,
    fontSize: 16,
    color: COLORS.white,
    letterSpacing: 1.5,
  },
  disclaimer: {
    fontFamily: FONTS.uiRegular,
    fontSize: 11,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 16,
  },
});
