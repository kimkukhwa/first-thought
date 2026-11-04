import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAudioPlayerStatus } from 'expo-audio';
import { colors, quiet } from '../theme';
import { useMorningAudio } from '../morningAudio';
import Fade from './Fade';
import MeditationScreen from './MeditationScreen';
import ClosingScreen from './ClosingScreen';

const AMBIENT_FADE_IN_SECONDS = 5;
const AMBIENT_FADE_OUT_SECONDS = 10;
const VOICE_FADE_OUT_SECONDS = 2;

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
    // If the session was ended early, the voice fades away gently.
    audio.fadeOutMeditation(VOICE_FADE_OUT_SECONDS);
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

  let content;
  if (phase === 'meditation') {
    content = (
      <MeditationScreen
        player={audio.meditationPlayer}
        onPause={audio.pauseMeditation}
        onResume={audio.resumeMeditation}
        onEnd={endMeditation}
      />
    );
  } else if (phase === 'closing') {
    content = <ClosingScreen onDone={handleDone} />;
  } else {
    content = (
      <View style={styles.screen}>
        <Text style={styles.greeting}>Good morning.</Text>

        <Pressable style={styles.doneButton} onPress={handleDone} hitSlop={12}>
          <Text style={quiet.text}>Done</Text>
        </Pressable>
      </View>
    );
  }

  return <Fade screenKey={phase}>{content}</Fade>;
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
    ...quiet.button,
    position: 'absolute',
    bottom: quiet.bottom,
  },
});
