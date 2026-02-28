import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
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

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [splashHidden, setSplashHidden] = useState(false);

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
        // Continue with default (not onboarded)
      }
      setAppReady(true);
    }
    prepare();
  }, []);

  // Force hide splash after 3 seconds no matter what
  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
      setSplashHidden(true);
      setAppReady(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const fontsReady = fontsLoaded || fontError;

  // Hide splash as soon as everything is ready
  useEffect(() => {
    if (fontsReady && appReady && !splashHidden) {
      SplashScreen.hideAsync().catch(() => {});
      setSplashHidden(true);
    }
  }, [fontsReady, appReady, splashHidden]);

  if (!splashHidden && !fontsReady && !appReady) {
    return <View style={{ flex: 1, backgroundColor: '#1a1208' }} />;
  }

  return (
    <View style={{ flex: 1 }}>
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
