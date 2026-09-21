import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'nara-baby.serverUrl';
const DEFAULT_API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

let cachedUrl: string | null = null;

export function getDefaultApiBaseUrl(): string {
  return DEFAULT_API_BASE_URL;
}

export async function getApiBaseUrl(): Promise<string> {
  if (cachedUrl) return cachedUrl;
  let resolved: string = DEFAULT_API_BASE_URL;
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    resolved = stored || DEFAULT_API_BASE_URL;
  } catch {
    resolved = DEFAULT_API_BASE_URL;
  }
  cachedUrl = resolved;
  return resolved;
}

export async function setApiBaseUrl(url: string): Promise<void> {
  const trimmed = url.trim().replace(/\/+$/, '');
  cachedUrl = trimmed;
  await AsyncStorage.setItem(STORAGE_KEY, trimmed);
}

export async function resetApiBaseUrl(): Promise<void> {
  cachedUrl = DEFAULT_API_BASE_URL;
  await AsyncStorage.removeItem(STORAGE_KEY);
}
