import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import HomeScreen from './components/HomeScreen';
import MorningScreen from './components/MorningScreen';
import { defaultAlarmTime, nextOccurrence } from './time';
import { colors } from './theme';
import { loadAlarmSettings, saveAlarmSettings } from './alarmStorage';
import {
  cancelAlarmNotification,
  isAlarmNotification,
  requestNotificationPermission,
  scheduleAlarmNotification,
  useLastNotificationResponse,
} from './alarmNotification';

const WAIT_BEFORE_MEDITATION_SECONDS = 5;

export default function App() {
  // The app is always in exactly one of these views: 'home', 'morning'.
  const [view, setView] = useState('home');
  const [alarmTime, setAlarmTime] = useState(defaultAlarmTime);
  const [alarmOn, setAlarmOn] = useState(true);
  // False until saved settings have been read, so the defaults never flash.
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  // How long to wait, quietly, after the ambient sound starts before the
  // meditation begins. The test button shortens it.
  const [waitSeconds, setWaitSeconds] = useState(WAIT_BEFORE_MEDITATION_SECONDS);

  // Load saved settings once at startup.
  useEffect(() => {
    loadAlarmSettings()
      .then((saved) => {
        if (saved) {
          setAlarmTime(saved.alarmTime);
          setAlarmOn(saved.alarmOn);
        }
      })
      .catch(() => {})
      .then(() => setSettingsLoaded(true));
  }, []);

  // Save whenever the alarm time or on/off state changes.
  useEffect(() => {
    if (!settingsLoaded) return;
    saveAlarmSettings({ alarmTime, alarmOn }).catch(() => {});
  }, [settingsLoaded, alarmTime, alarmOn]);

  // Backup alarm: keep one notification scheduled for the alarm time while
  // the alarm is on. Cancel it when the alarm is off, or once the app has
  // reached the morning on its own.
  useEffect(() => {
    if (!settingsLoaded) return;
    if (!alarmOn || view === 'morning') {
      cancelAlarmNotification().catch(() => {});
      return;
    }
    let stale = false;
    requestNotificationPermission()
      .then((allowed) => {
        if (allowed && !stale) return scheduleAlarmNotification(alarmTime);
      })
      .catch(() => {});
    return () => {
      stale = true;
    };
  }, [settingsLoaded, alarmOn, alarmTime, view]);

  // A tap on the backup notification (app closed or in the background)
  // opens the app straight into the morning sequence.
  const lastNotificationResponse = useLastNotificationResponse();
  useEffect(() => {
    if (isAlarmNotification(lastNotificationResponse)) {
      setView('morning');
    }
  }, [lastNotificationResponse]);

  function toggleEditing() {
    setIsEditing((current) => !current);
  }

  function toggleAlarm() {
    if (!alarmOn) {
      setAlarmTime(nextOccurrence(alarmTime));
    }
    setAlarmOn((current) => !current);
  }

  function handleTimeChange(event, selectedDate) {
    if (selectedDate) {
      setAlarmTime(nextOccurrence(selectedDate));
    }
  }

  // Temporary: jump straight into the morning sequence without the wait.
  function testMeditation() {
    setWaitSeconds(0);
    setAlarmOn(true);
    setIsEditing(false);
    setView('morning');
  }

  function finishMorning() {
    setAlarmOn(false);
    setWaitSeconds(WAIT_BEFORE_MEDITATION_SECONDS);
    setView('home');
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {!settingsLoaded ? (
        <View style={styles.loading} />
      ) : view === 'morning' ? (
        <MorningScreen onDone={finishMorning} waitSeconds={waitSeconds} />
      ) : (
        <HomeScreen
          alarmTime={alarmTime}
          alarmOn={alarmOn}
          isEditing={isEditing}
          onToggleEditing={toggleEditing}
          onToggleAlarm={toggleAlarm}
          onTimeChange={handleTimeChange}
          onTestMeditation={testMeditation}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  // Plain dark screen shown for the instant before saved settings arrive.
  loading: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
