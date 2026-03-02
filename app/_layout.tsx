import { useEffect, useState, useRef } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreenModule from 'expo-splash-screen';
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
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { isOnboarded } from '../src/utils/storage';

// Keep native splash visible while we load
SplashScreenModule.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const splashHidden = useRef(false);

  const [fontsLoaded, fontError] = useFonts({
    Cinzel_400Regular,
    Cinzel_600SemiBold,
    Cinzel_700Bold,
    Lora_400Regular,
    Lora_400Regular_Italic,
    Lora_600SemiBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  // Load app state
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
  }, []);

  // Single place to hide splash - fires when both fonts and app state are ready
  useEffect(() => {
    if ((fontsLoaded || fontError) && appReady && !splashHidden.current) {
      splashHidden.current = true;
      SplashScreenModule.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError, appReady]);

  // Absolute failsafe - hide after 4 seconds no matter what
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!splashHidden.current) {
        splashHidden.current = true;
        SplashScreenModule.hideAsync().catch(() => {});
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // Don't render anything until ready - the native splash stays visible
  if (!fontsLoaded && !fontError) {
    return null;
  }
  if (!appReady) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#1a1208' }}>
      <StatusBar style="light" />
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
