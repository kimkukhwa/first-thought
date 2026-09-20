import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import HomeScreen from './components/HomeScreen';
import NightScreen from './components/NightScreen';
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

const IDLE_SECONDS = 10;
const MEDITATION_SECONDS = 10 * 60;
const WAIT_BEFORE_MEDITATION_SECONDS = 60;
// Our own keep-awake tag, so we never release the one Expo Go uses in development.
const KEEP_AWAKE_TAG = 'first-thought-alarm';

export default function App() {
  // The app is always in exactly one of these views: 'home', 'night', 'morning'.
  const [view, setView] = useState('home');
  const [alarmTime, setAlarmTime] = useState(defaultAlarmTime);
  const [alarmOn, setAlarmOn] = useState(true);
  // False until saved settings have been read, so the defaults never flash.
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [lastTouch, setLastTouch] = useState(Date.now());
  // Lengths used by the morning sequence. The test button shortens them.
  const [meditationSeconds, setMeditationSeconds] = useState(MEDITATION_SECONDS);
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

  // Keep the screen on while the alarm is armed.
  useEffect(() => {
    if (alarmOn) {
      activateKeepAwakeAsync(KEEP_AWAKE_TAG);
    } else {
      deactivateKeepAwake(KEEP_AWAKE_TAG);
    }
    return () => deactivateKeepAwake(KEEP_AWAKE_TAG);
  }, [alarmOn]);

  // Home -> Night after a period of no touches, only while the alarm is on.
  useEffect(() => {
    if (view !== 'home' || !alarmOn) return;
    const timeout = setTimeout(() => setView('night'), IDLE_SECONDS * 1000);
    return () => clearTimeout(timeout);
  }, [view, alarmOn, lastTouch]);

  // Home or Night -> Morning when the alarm time arrives.
  useEffect(() => {
    if (!alarmOn || view === 'morning') return;
    const interval = setInterval(() => {
      if (Date.now() >= alarmTime.getTime()) {
        setView('morning');
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [alarmOn, alarmTime, view]);

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

  function noteTouch() {
    setLastTouch(Date.now());
    return false; // let the touch continue to whatever was tapped
  }

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

  function testIn10s() {
    setAlarmTime(new Date(Date.now() + 10 * 1000));
    setAlarmOn(true);
    setIsEditing(false);
  }

  // Temporary: jump straight into the morning sequence with a short meditation.
  function testMeditation() {
    setMeditationSeconds(30);
    setWaitSeconds(0);
    setAlarmOn(true);
    setIsEditing(false);
    setView('morning');
  }

  function finishMorning() {
    setAlarmOn(false);
    setMeditationSeconds(MEDITATION_SECONDS);
    setWaitSeconds(WAIT_BEFORE_MEDITATION_SECONDS);
    setView('home');
  }

  return (
    <View style={styles.root} onStartShouldSetResponderCapture={noteTouch}>
      <StatusBar style="light" hidden={view === 'night'} />

      {!settingsLoaded ? (
        <View style={styles.loading} />
      ) : view === 'morning' ? (
        <MorningScreen
          onDone={finishMorning}
          meditationSeconds={meditationSeconds}
          waitSeconds={waitSeconds}
        />
      ) : (
        <HomeScreen
          alarmTime={alarmTime}
          alarmOn={alarmOn}
          isEditing={isEditing}
          onToggleEditing={toggleEditing}
          onToggleAlarm={toggleAlarm}
          onTimeChange={handleTimeChange}
          onTestIn10s={testIn10s}
          onTestMeditation={testMeditation}
        />
      )}

      {view === 'night' && <NightScreen onTap={() => setView('home')} />}
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
