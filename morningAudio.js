import { useEffect, useMemo, useRef } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';

const ambientSource = require('./assets/audio/ambient.wav');
const meditationSource = require('./assets/audio/meditation.m4a');

// Owns the two sound players for the session and exposes simple actions.
// The sequence itself lives in MorningScreen.
export function useMorningAudio() {
  const ambient = useAudioPlayer(ambientSource);
  const meditation = useAudioPlayer(meditationSource);
  const fadeInterval = useRef(null);
  const ambientFadeInSeconds = useRef(0);
  // True while the user has the session paused.
  const paused = useRef(false);

  // Make sure no fade keeps running after the screen goes away.
  useEffect(() => () => clearInterval(fadeInterval.current), []);

  return useMemo(() => {
    // Moves the ambient volume from where it is to `target` over `seconds`.
    function fadeAmbient(target, seconds, onDone) {
      clearInterval(fadeInterval.current);
      const stepMs = 100;
      const totalSteps = Math.max(1, (seconds * 1000) / stepMs);
      const start = ambient.volume;
      let step = 0;
      fadeInterval.current = setInterval(() => {
        step += 1;
        ambient.volume = start + (target - start) * Math.min(1, step / totalSteps);
        if (step >= totalSteps) {
          clearInterval(fadeInterval.current);
          if (onDone) onDone();
        }
      }, stepMs);
    }

    return {
      // Ambient fades in and the meditation voice starts, together.
      startSession(fadeInSeconds) {
        ambientFadeInSeconds.current = fadeInSeconds;
        ambient.loop = true;
        ambient.volume = 0;
        meditation.volume = 1;
        // Play even when the iPhone's silent switch is on.
        setAudioModeAsync({ playsInSilentMode: true })
          .catch(() => {})
          .then(() => {
            if (paused.current) return;
            ambient.play();
            meditation.play();
            fadeAmbient(1, fadeInSeconds);
          });
      },
      pauseAll() {
        paused.current = true;
        clearInterval(fadeInterval.current);
        ambient.pause();
        meditation.pause();
      },
      resumeAll() {
        paused.current = false;
        ambient.play();
        meditation.play();
        // If the session was paused during the fade-in, finish it.
        if (ambient.volume < 1) {
          fadeAmbient(1, (1 - ambient.volume) * ambientFadeInSeconds.current);
        }
      },
      fadeOutAmbient(seconds) {
        fadeAmbient(0, seconds, () => ambient.pause());
      },
      stopAll() {
        clearInterval(fadeInterval.current);
        ambient.pause();
        meditation.pause();
      },
      // Exposed so a screen can watch the track's own status (real
      // duration, current position, and when it finishes) rather than
      // guessing timing with a separate timer.
      meditationPlayer: meditation,
    };
  }, [ambient, meditation]);
}
