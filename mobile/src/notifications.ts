import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { URGENCY_THRESHOLDS } from './theme';

const STORAGE_KEY = 'nara-baby.reminderIds';

export type ReminderCategory = keyof typeof URGENCY_THRESHOLDS; // 'feeding' | 'pump' | 'diaper'

const CATEGORY_LABEL: Record<ReminderCategory, string> = {
  feeding: 'feeding',
  pump: 'pump session',
  diaper: 'diaper change',
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let channelReady = false;
async function ensureChannel() {
  if (Platform.OS !== 'android' || channelReady) return;
  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'Feeding & care reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
  channelReady = true;
}

async function requestPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function loadIds(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveIds(ids: Record<string, string>) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // best-effort; reminders are a nice-to-have, never block the save flow
  }
}

function keyFor(category: ReminderCategory, babyId: string) {
  return `${category}:${babyId}`;
}

export async function cancelReminder(category: ReminderCategory, babyId: string) {
  const ids = await loadIds();
  const key = keyFor(category, babyId);
  const existingId = ids[key];
  if (existingId) {
    await Notifications.cancelScheduledNotificationAsync(existingId).catch(() => {});
    delete ids[key];
    await saveIds(ids);
  }
}

export async function scheduleReminder(
  category: ReminderCategory,
  babyId: string,
  babyName: string,
  fromIso: string
) {
  await cancelReminder(category, babyId);

  const granted = await requestPermission();
  if (!granted) return;
  await ensureChannel();

  const overdueMinutes = URGENCY_THRESHOLDS[category].overdue;
  const fireAt = new Date(fromIso).getTime() + overdueMinutes * 60000;
  const secondsUntil = Math.round((fireAt - Date.now()) / 1000);
  if (secondsUntil <= 0) return;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `${babyName} might be due for a ${CATEGORY_LABEL[category]}`,
      body: `It's been about ${Math.round(overdueMinutes / 60)}h since the last one.`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: secondsUntil,
    },
  });

  const ids = await loadIds();
  ids[keyFor(category, babyId)] = id;
  await saveIds(ids);
}
