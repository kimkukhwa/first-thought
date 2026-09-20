import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme';
import { useMorningAudio } from '../morningAudio';
import MeditationScreen from './MeditationScreen';
import ClosingScreen from './ClosingScreen';

const ALARM_SECONDS = 30;
const AMBIENT_FADE_IN_SECONDS = 5;
const AMBIENT_FADE_OUT_SECONDS = 10;

// The morning sequence, in order:
//   'alarm'      chime plays until a tap or 30 seconds
//   'ambient'    ambient fades in, then a quiet wait
//   'meditation' meditation screen and voice track
//   'closing'    ambient fades out, closing line and Done
export default function MorningScreen({ onDone, meditationSeconds, waitSeconds }) {
  const audio = useMorningAudio();
  const [phase, setPhase] = useState('alarm');

  useEffect(() => {
    if (phase !== 'alarm') return;
    audio.playAlarm();
    const timeout = setTimeout(() => setPhase('ambient'), ALARM_SECONDS * 1000);
    return () => clearTimeout(timeout);
  }, [phase, audio]);

  useEffect(() => {
    if (phase !== 'ambient') return;
    audio.stopAlarm();
    audio.startAmbient(AMBIENT_FADE_IN_SECONDS);
    const delay = (AMBIENT_FADE_IN_SECONDS + waitSeconds) * 1000;
    const timeout = setTimeout(() => setPhase('meditation'), delay);
    return () => clearTimeout(timeout);
  }, [phase, audio, waitSeconds]);

  useEffect(() => {
    if (phase !== 'meditation') return;
    audio.startMeditation();
    const timeout = setTimeout(() => setPhase('closing'), meditationSeconds * 1000);
    return () => clearTimeout(timeout);
  }, [phase, audio, meditationSeconds]);

  useEffect(() => {
    if (phase !== 'closing') return;
    audio.stopMeditation();
    audio.fadeOutAmbient(AMBIENT_FADE_OUT_SECONDS);
  }, [phase, audio]);

  function handleTap() {
    if (phase === 'alarm') setPhase('ambient');
  }

  function handleDone() {
    audio.stopAll();
    onDone();
  }

  if (phase === 'meditation') {
    return <MeditationScreen seconds={meditationSeconds} />;
  }

  if (phase === 'closing') {
    return <ClosingScreen onDone={handleDone} />;
  }

  return (
    // The whole screen is tappable: any tap stops the alarm.
    <Pressable style={styles.screen} onPress={handleTap}>
      <Text style={styles.greeting}>Good morning.</Text>

      <Pressable style={styles.doneButton} onPress={handleDone} hitSlop={12}>
        <Text style={styles.doneText}>Done</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  greeting: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  doneButton: {
    position: 'absolute',
    bottom: 48,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  doneText: {
    color: colors.muted,
    fontSize: 14,
    letterSpacing: 1,
  },
});
