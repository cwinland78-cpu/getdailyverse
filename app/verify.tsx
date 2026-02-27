import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS } from '../src/constants/theme';
import { sendVerification, verifyPhone } from '../src/utils/supabase';

export default function VerifyScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const codeInputRef = useRef<TextInput>(null);

  // Format phone as user types: (555) 555-5555
  function formatPhone(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  async function handleSendCode() {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit US phone number.');
      return;
    }

    setLoading(true);
    try {
      const result = await sendVerification(digits);
      if (result.success) {
        setStep('code');
        setTimeout(() => codeInputRef.current?.focus(), 300);
      } else {
        Alert.alert('Error', result.error || 'Failed to send verification code.');
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
    setLoading(false);
  }

  async function handleVerifyCode() {
    if (code.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit code.');
      return;
    }

    const digits = phone.replace(/\D/g, '');
    setLoading(true);
    try {
      const result = await verifyPhone(digits, code);
      if (result.verified) {
        // Save subscriber data and go to preferences
        router.replace({
          pathname: '/preferences',
          params: { phone: digits, subscriberId: result.subscriber?.id },
        });
      } else {
        Alert.alert('Invalid Code', 'The code is incorrect or expired. Please try again.');
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gradientTop} />
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.center}>
          <Text style={styles.title}>
            {step === 'phone' ? 'Your Number' : 'Enter Code'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'phone'
              ? "We'll send a verification code to confirm your number."
              : `We sent a 6-digit code to ${phone}`}
          </Text>

          {step === 'phone' ? (
            <>
              <View style={styles.inputWrapper}>
                <Text style={styles.countryCode}>+1</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={(t) => setPhone(formatPhone(t))}
                  placeholder="(555) 555-5555"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="phone-pad"
                  autoFocus
                  maxLength={14}
                />
              </View>
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSendCode}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.buttonText}>Send Code</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TextInput
                ref={codeInputRef}
                style={styles.codeInput}
                value={code}
                onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                placeholderTextColor={COLORS.textLight}
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
              />
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleVerifyCode}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.buttonText}>Verify</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setStep('phone'); setCode(''); }}
                style={styles.resendBtn}
              >
                <Text style={styles.resendText}>Resend code</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  gradientTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 180,
    backgroundColor: COLORS.backgroundGradientTop, opacity: 0.5,
  },
  content: { flex: 1, paddingHorizontal: SPACING.lg },
  backBtn: { marginTop: SPACING.md },
  backText: {
    fontFamily: FONTS.uiMedium, fontSize: 15, color: COLORS.primary,
  },
  center: { flex: 1, justifyContent: 'center', marginTop: -60 },
  title: {
    fontFamily: FONTS.titleSemiBold, fontSize: 28, color: COLORS.textTitle,
    letterSpacing: 0.5, marginBottom: SPACING.sm,
  },
  subtitle: {
    fontFamily: FONTS.uiRegular, fontSize: 15, color: COLORS.textMuted,
    lineHeight: 22, marginBottom: SPACING.xl,
  },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    paddingHorizontal: SPACING.md, marginBottom: SPACING.lg,
  },
  countryCode: {
    fontFamily: FONTS.uiSemiBold, fontSize: 18, color: COLORS.textDark,
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1, fontFamily: FONTS.uiRegular, fontSize: 20, color: COLORS.textDark,
    paddingVertical: 18,
  },
  codeInput: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    fontFamily: FONTS.titleSemiBold, fontSize: 32, color: COLORS.textDark,
    paddingVertical: 18, letterSpacing: 12, marginBottom: SPACING.lg,
  },
  button: {
    backgroundColor: COLORS.primary, paddingVertical: 16,
    borderRadius: RADIUS.md, alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    fontFamily: FONTS.titleSemiBold, fontSize: 15, color: COLORS.white,
    letterSpacing: 1.2,
  },
  resendBtn: { marginTop: SPACING.md, alignItems: 'center' },
  resendText: {
    fontFamily: FONTS.uiMedium, fontSize: 14, color: COLORS.primary,
  },
});
