import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppState, StyleSheet, View } from 'react-native';
import Fade from './components/Fade';
import HomeScreen from './components/HomeScreen';
import MorningScreen from './components/MorningScreen';
import { colors } from './theme';
import { loadReminderSettings, saveReminderSettings } from './reminderStorage';
import {
  cancelReminder,
  clearLastNotificationResponse,
  hasNotificationPermission,
  isReminderNotification,
  requestNotificationPermission,
  scheduleDailyReminder,
  useLastNotificationResponse,
} from './reminderNotification';

const WAIT_BEFORE_MEDITATION_SECONDS = 5;
const DEFAULT_REMINDER = { hours: 7, minutes: 0, on: false };

export default function App() {
  // The app is always in exactly one of these views: 'home', 'session'.
  const [view, setView] = useState('home');
  const [reminder, setReminder] = useState(DEFAULT_REMINDER);
  // False until saved settings have been read, so the defaults never flash.
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  // True when the reminder is on but iOS isn't allowing notifications.
  const [notificationsBlocked, setNotificationsBlocked] = useState(false);
  // Goes up each time the app comes back to the front, so we re-check
  // permission (the user may have changed it in Settings meanwhile).
  const [appActiveCount, setAppActiveCount] = useState(0);
  // How long to wait, quietly, after the ambient sound starts before the
  // meditation begins. The test button shortens it.
  const [waitSeconds, setWaitSeconds] = useState(WAIT_BEFORE_MEDITATION_SECONDS);

  // Load saved settings once at startup.
  useEffect(() => {
    loadReminderSettings()
      .then((saved) => {
        if (saved) setReminder(saved);
      })
      .catch(() => {})
      .then(() => setSettingsLoaded(true));
  }, []);

  // Save whenever the reminder changes.
  useEffect(() => {
    if (!settingsLoaded) return;
    saveReminderSettings(reminder).catch(() => {});
  }, [settingsLoaded, reminder]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setAppActiveCount((count) => count + 1);
    });
    return () => subscription.remove();
  }, []);

  // Keep the one daily notification in step with the reminder setting:
  // scheduled while it's on, cancelled while it's off.
  useEffect(() => {
    if (!settingsLoaded) return;
    let stale = false;
    async function sync() {
      if (!reminder.on) {
        setNotificationsBlocked(false);
        await cancelReminder();
        return;
      }
      const allowed = await hasNotificationPermission();
      if (stale) return;
      setNotificationsBlocked(!allowed);
      if (allowed) await scheduleDailyReminder(reminder.hours, reminder.minutes);
    }
    sync().catch(() => {});
    return () => {
      stale = true;
    };
  }, [settingsLoaded, reminder.on, reminder.hours, reminder.minutes, appActiveCount]);

  // A tap on the reminder opens the app straight into the session.
  const lastNotificationResponse = useLastNotificationResponse();
  useEffect(() => {
    if (!isReminderNotification(lastNotificationResponse)) return;
    clearLastNotificationResponse();
    setIsEditing(false);
    setView('session');
  }, [lastNotificationResponse]);

  function toggleEditing() {
    setIsEditing((current) => !current);
  }

  async function toggleReminder() {
    if (reminder.on) {
      setReminder((current) => ({ ...current, on: false }));
      return;
    }
    // Only the first time does this show the iOS prompt.
    await requestNotificationPermission().catch(() => false);
    setReminder((current) => ({ ...current, on: true }));
  }

  function handleTimeChange(event, date) {
    if (!date) return;
    setReminder((current) => ({
      ...current,
      hours: date.getHours(),
      minutes: date.getMinutes(),
    }));
  }

  function begin() {
    setIsEditing(false);
    setView('session');
  }

  // Development only: start the session without the short wait.
  function testSkipWait() {
    setWaitSeconds(0);
    begin();
  }

  function finishSession() {
    setWaitSeconds(WAIT_BEFORE_MEDITATION_SECONDS);
    setView('home');
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {!settingsLoaded ? (
        <View style={styles.loading} />
      ) : (
        <Fade screenKey={view}>
          {view === 'session' ? (
            <MorningScreen onDone={finishSession} waitSeconds={waitSeconds} />
          ) : (
            <HomeScreen
              reminder={reminder}
              notificationsBlocked={notificationsBlocked}
              isEditing={isEditing}
              onBegin={begin}
              onToggleEditing={toggleEditing}
              onToggleReminder={toggleReminder}
              onTimeChange={handleTimeChange}
              onTestSkipWait={testSkipWait}
            />
          )}
        </Fade>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Screens fade through this deep color, never through white.
  root: {
    flex: 1,
    backgroundColor: colors.night,
  },
  // Plain dark screen shown for the instant before saved settings arrive.
  loading: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
