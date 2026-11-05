import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAudioPlayerStatus } from 'expo-audio';
import { useMorningAudio } from '../morningAudio';
import { partOfDay } from '../time';
import MeditationScreen from './MeditationScreen';
import ClosingScreen from './ClosingScreen';

const AMBIENT_FADE_IN_SECONDS = 5;
const AMBIENT_FADE_OUT_SECONDS = 8;

// The session, in order:
//   'meditation' ambient fades in under the voice; the breathing circle
//                shows until the recording ends
//   'closing'    the circle dissolves, ambient fades out, and the warm
//                closing lies over the meditation, then returns home
// Pausing and tapping the house icon leaves early and skips the closing.
export default function MorningScreen({ onDone }) {
  const audio = useMorningAudio();
  const [phase, setPhase] = useState('meditation');
  const meditationStatus = useAudioPlayerStatus(audio.meditationPlayer);
  // The closing line follows the part of the day when the session started.
  const [startPart] = useState(() => partOfDay());

  // Start both sounds as soon as the session opens.
  useEffect(() => {
    audio.startSession(AMBIENT_FADE_IN_SECONDS);
  }, [audio]);

  // Move on only once the recording itself reports that it has finished.
  useEffect(() => {
    if (phase !== 'meditation') return;
    if (meditationStatus.didJustFinish) {
      setPhase('closing');
    }
  }, [phase, meditationStatus.didJustFinish]);

  useEffect(() => {
    if (phase !== 'closing') return;
    audio.fadeOutAmbient(AMBIENT_FADE_OUT_SECONDS);
  }, [phase, audio]);

  function leave() {
    audio.stopAll();
    onDone();
  }

  return (
    <View style={styles.fill}>
      <MeditationScreen
        player={audio.meditationPlayer}
        onPause={audio.pauseAll}
        onResume={audio.resumeAll}
        onHome={leave}
        ending={phase === 'closing'}
      />
      {phase === 'closing' && <ClosingScreen part={startPart} onDone={leave} />}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
