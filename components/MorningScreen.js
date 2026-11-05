import { useEffect, useState } from 'react';
import { useAudioPlayerStatus } from 'expo-audio';
import { useMorningAudio } from '../morningAudio';
import Fade from './Fade';
import MeditationScreen from './MeditationScreen';
import ClosingScreen from './ClosingScreen';

const AMBIENT_FADE_IN_SECONDS = 5;
const AMBIENT_FADE_OUT_SECONDS = 10;

// The session, in order:
//   'meditation' ambient fades in under the voice; the breathing circle
//                shows until the recording ends
//   'closing'    ambient fades out, closing line and Done
// Pausing and tapping "home" leaves early and skips the closing.
export default function MorningScreen({ onDone }) {
  const audio = useMorningAudio();
  const [phase, setPhase] = useState('meditation');
  const meditationStatus = useAudioPlayerStatus(audio.meditationPlayer);

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

  const content =
    phase === 'closing' ? (
      <ClosingScreen onDone={leave} />
    ) : (
      <MeditationScreen
        player={audio.meditationPlayer}
        onPause={audio.pauseAll}
        onResume={audio.resumeAll}
        onHome={leave}
      />
    );

  return <Fade screenKey={phase}>{content}</Fade>;
}
