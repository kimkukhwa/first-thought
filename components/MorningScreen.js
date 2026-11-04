import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAudioPlayerStatus } from 'expo-audio';
import { colors } from '../theme';
import { useMorningAudio } from '../morningAudio';
import MeditationScreen from './MeditationScreen';
import ClosingScreen from './ClosingScreen';

const AMBIENT_FADE_IN_SECONDS = 5;
const AMBIENT_FADE_OUT_SECONDS = 10;

// The morning sequence, in order:
//   'ambient'    ambient fades in, then a quiet wait
//   'meditation' meditation screen and voice track, until the track ends
//   'closing'    ambient fades out, closing line and Done
export default function MorningScreen({ onDone, waitSeconds }) {
  const audio = useMorningAudio();
  const [phase, setPhase] = useState('ambient');
  const meditationStatus = useAudioPlayerStatus(audio.meditationPlayer);

  useEffect(() => {
    if (phase !== 'ambient') return;
    audio.startAmbient(AMBIENT_FADE_IN_SECONDS);
    const delay = (AMBIENT_FADE_IN_SECONDS + waitSeconds) * 1000;
    const timeout = setTimeout(() => setPhase('meditation'), delay);
    return () => clearTimeout(timeout);
  }, [phase, audio, waitSeconds]);

  useEffect(() => {
    if (phase !== 'meditation') return;
    audio.startMeditation();
  }, [phase, audio]);

  // Move on only once the track itself reports that it has finished,
  // so the closing screen never cuts the recording short.
  useEffect(() => {
    if (phase !== 'meditation') return;
    if (meditationStatus.didJustFinish) {
      setPhase('closing');
    }
  }, [phase, meditationStatus.didJustFinish]);

  useEffect(() => {
    if (phase !== 'closing') return;
    audio.stopMeditation();
    audio.fadeOutAmbient(AMBIENT_FADE_OUT_SECONDS);
  }, [phase, audio]);

  function handleDone() {
    audio.stopAll();
    onDone();
  }

  // Lets the meditation screen move straight to closing without waiting
  // for the track to finish on its own.
  function endMeditation() {
    setPhase('closing');
  }

  if (phase === 'meditation') {
    return (
      <MeditationScreen
        player={audio.meditationPlayer}
        onPause={audio.pauseMeditation}
        onResume={audio.resumeMeditation}
        onEnd={endMeditation}
      />
    );
  }

  if (phase === 'closing') {
    return <ClosingScreen onDone={handleDone} />;
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.greeting}>Good morning.</Text>

      <Pressable style={styles.doneButton} onPress={handleDone} hitSlop={12}>
        <Text style={styles.doneText}>Done</Text>
      </Pressable>
    </View>
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
