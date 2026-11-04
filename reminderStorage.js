import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'reminderSettings';
// v1 saved the alarm under this key. We read it once so the time carries over.
const OLD_ALARM_KEY = 'alarmSettings';

// Stored as { hours, minutes, on }. Only the clock time matters, because the
// reminder repeats every day.
export async function saveReminderSettings({ hours, minutes, on }) {
  await AsyncStorage.setItem(KEY, JSON.stringify({ hours, minutes, on }));
}

// Returns { hours, minutes, on } or null if nothing has been saved yet.
export async function loadReminderSettings() {
  const raw = await AsyncStorage.getItem(KEY);
  if (raw) return JSON.parse(raw);

  // First launch of V2: carry over the v1 alarm time, with the reminder off
  // so the notification permission is only asked when it's switched on.
  const oldRaw = await AsyncStorage.getItem(OLD_ALARM_KEY);
  if (!oldRaw) return null;
  const old = JSON.parse(oldRaw);
  const migrated = { hours: old.hours, minutes: old.minutes, on: false };
  await saveReminderSettings(migrated);
  await AsyncStorage.removeItem(OLD_ALARM_KEY);
  return migrated;
}
