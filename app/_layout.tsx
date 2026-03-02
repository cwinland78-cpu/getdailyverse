import { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Cinzel_400Regular,
  Cinzel_600SemiBold,
  Cinzel_700Bold,
} from '@expo-google-fonts/cinzel';
import {
  Lora_400Regular,
  Lora_400Regular_Italic,
  Lora_600SemiBold,
} from '@expo-google-fonts/lora';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
} from '@expo-google-fonts/dm-sans';
import { isOnboarded } from '../src/utils/storage';

// Use expo-router's SplashScreen (not expo-splash-screen directly).
// expo-router manages its own internal splash lock via _internal_preventAutoHideAsync.
// We must use expo-router's exported SplashScreen to stay in sync with that system.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Cinzel_400Regular,
    Cinzel_600SemiBold,
    Cinzel_700Bold,
    Lora_400Regular,
    Lora_400Regular_Italic,
    Lora_600SemiBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  useEffect(() => {
    async function prepare() {
      try {
        const onboarded = await isOnboarded();
        setHasOnboarded(onboarded);
      } catch (e) {
        // Default to not onboarded
      }
      setAppReady(true);
    }
    prepare();

    // Failsafe: force ready after 3 seconds no matter what
    const failsafe = setTimeout(() => {
      setAppReady(true);
    }, 3000);

    return () => clearTimeout(failsafe);
  }, []);

  // Once everything is loaded, hide the splash screen
  const onLayoutReady = useCallback(async () => {
    if ((fontsLoaded || fontError) && appReady) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, appReady]);

  // Also trigger hide via effect as backup
  useEffect(() => {
    if ((fontsLoaded || fontError) && appReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, appReady]);

  // Absolute nuclear failsafe: hide splash after 5 seconds regardless of state
  useEffect(() => {
    const nuclear = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 5000);
    return () => clearTimeout(nuclear);
  }, []);

  // Show loading while fonts load
  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1a1208', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#9B6B3E" />
      </View>
    );
  }

  if (!appReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1a1208', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#9B6B3E" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutReady}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{ headerShown: false }}
        initialRouteName={hasOnboarded ? '(tabs)' : 'onboarding'}
      >
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="verify" />
        <Stack.Screen name="preferences" />
        <Stack.Screen name="reader" options={{ presentation: 'modal' }} />
      </Stack>
    </View>
  );
}
