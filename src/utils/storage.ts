import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  SUBSCRIBER: '@tdv_subscriber',
  ONBOARDED: '@tdv_onboarded',
};

export interface SubscriberData {
  id: string;
  phone: string;
  translation: string;
  verse_format: 'single' | 'passage';
  verse_mode: 'random' | 'sequential' | 'both';
  delivery_hour: number;
  delivery_minute: number;
  timezone: string;
}

export async function saveSubscriber(data: SubscriberData) {
  await AsyncStorage.setItem(KEYS.SUBSCRIBER, JSON.stringify(data));
}

export async function getSubscriber(): Promise<SubscriberData | null> {
  const raw = await AsyncStorage.getItem(KEYS.SUBSCRIBER);
  return raw ? JSON.parse(raw) : null;
}

export async function clearSubscriber() {
  await AsyncStorage.removeItem(KEYS.SUBSCRIBER);
}

export async function setOnboarded(value: boolean) {
  await AsyncStorage.setItem(KEYS.ONBOARDED, JSON.stringify(value));
}

export async function isOnboarded(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(KEYS.ONBOARDED);
  return raw ? JSON.parse(raw) : false;
}
