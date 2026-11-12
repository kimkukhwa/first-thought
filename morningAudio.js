import { useMemo, useRef } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';

// The finished meditation: opening gong, voice, background music and
// closing gong are all in this one file.
const meditationSource = require('./assets/audio/meditation.mp3');

// Owns the meditation player for the session and exposes simple actions.
// The sequence itself lives in MorningScreen.
export function useMorningAudio() {
  const meditation = useAudioPlayer(meditationSource);
  // True while the user has the session paused.
  const paused = useRef(false);

  return useMemo(
    () => ({
      startSession() {
        meditation.volume = 1;
        // Play even when the iPhone's silent switch is on.
        setAudioModeAsync({ playsInSilentMode: true })
          .catch(() => {})
          .then(() => {
            if (paused.current) return;
            meditation.play();
          });
      },
      pauseAll() {
        paused.current = true;
        meditation.pause();
      },
      resumeAll() {
        paused.current = false;
        meditation.play();
      },
      stopAll() {
        meditation.pause();
      },
      // Exposed so a screen can watch the track's own status (real
      // duration, current position, and when it finishes) rather than
      // guessing timing with a separate timer.
      meditationPlayer: meditation,
    }),
    [meditation]
  );
}
