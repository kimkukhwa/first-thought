import { useEffect, useMemo, useRef } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';

const ambientSource = require('./assets/audio/ambient.wav');
const meditationSource = require('./assets/audio/meditation.m4a');

// Owns the two sound players for the morning sequence and exposes
// simple actions. The sequence timing itself lives in MorningScreen.
export function useMorningAudio() {
  const ambient = useAudioPlayer(ambientSource);
  const meditation = useAudioPlayer(meditationSource);
  const fadeInterval = useRef(null);

  // Make sure no fade keeps running after the screen goes away.
  useEffect(() => () => clearInterval(fadeInterval.current), []);

  return useMemo(() => {
    // Moves the ambient volume from where it is to `target` over `seconds`.
    function fadeAmbient(target, seconds, onDone) {
      clearInterval(fadeInterval.current);
      const stepMs = 100;
      const totalSteps = (seconds * 1000) / stepMs;
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
      startAmbient(fadeSeconds) {
        ambient.loop = true;
        ambient.volume = 0;
        // Play even when the iPhone's silent switch is on.
        setAudioModeAsync({ playsInSilentMode: true })
          .catch(() => {})
          .then(() => {
            ambient.play();
            fadeAmbient(1, fadeSeconds);
          });
      },
      fadeOutAmbient(seconds) {
        fadeAmbient(0, seconds, () => ambient.pause());
      },
      startMeditation() {
        meditation.play();
      },
      stopMeditation() {
        meditation.pause();
      },
      pauseMeditation() {
        meditation.pause();
      },
      resumeMeditation() {
        meditation.play();
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
