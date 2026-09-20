import AsyncStorage from '@react-native-async-storage/async-storage';
import { nextOccurrence } from './time';

const KEY = 'alarmSettings';

// We store the clock time (hour and minute), not a full date, so that on
// the next launch the alarm is rebuilt for its next real occurrence.
export async function saveAlarmSettings({ alarmTime, alarmOn }) {
  const settings = {
    hours: alarmTime.getHours(),
    minutes: alarmTime.getMinutes(),
    on: alarmOn,
  };
  await AsyncStorage.setItem(KEY, JSON.stringify(settings));
}

// Returns { alarmTime, alarmOn } or null if nothing has been saved yet.
export async function loadAlarmSettings() {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  const settings = JSON.parse(raw);
  const date = new Date();
  date.setHours(settings.hours, settings.minutes, 0, 0);
  return { alarmTime: nextOccurrence(date), alarmOn: settings.on };
}
