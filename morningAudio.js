import { useEffect, useMemo, useRef } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';

const ambientSource = require('./assets/audio/ambient.wav');
const meditationSource = require('./assets/audio/meditation.m4a');

// Owns the two sound players for the morning sequence and exposes
// simple actions. The sequence timing itself lives in MorningScreen.
export function useMorningAudio() {
  const ambient = useAudioPlayer(ambientSource);
  const meditation = useAudioPlayer(meditationSource);
  // One running volume fade per player, so a new fade replaces the old one.
  const fades = useRef({ ambient: null, meditation: null });

  // Make sure no fade keeps running after the screen goes away.
  useEffect(
    () => () => {
      clearInterval(fades.current.ambient);
      clearInterval(fades.current.meditation);
    },
    []
  );

  return useMemo(() => {
    // Moves `player`'s volume from where it is to `target` over `seconds`.
    function fade(name, player, target, seconds, onDone) {
      clearInterval(fades.current[name]);
      const stepMs = 100;
      const totalSteps = Math.max(1, (seconds * 1000) / stepMs);
      const start = player.volume;
      let step = 0;
      fades.current[name] = setInterval(() => {
        step += 1;
        player.volume = start + (target - start) * Math.min(1, step / totalSteps);
        if (step >= totalSteps) {
          clearInterval(fades.current[name]);
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
            fade('ambient', ambient, 1, fadeSeconds);
          });
      },
      fadeOutAmbient(seconds) {
        fade('ambient', ambient, 0, seconds, () => ambient.pause());
      },
      startMeditation() {
        meditation.volume = 1;
        meditation.play();
      },
      // A gentle ending: the voice fades away instead of cutting off.
      fadeOutMeditation(seconds) {
        fade('meditation', meditation, 0, seconds, () => meditation.pause());
      },
      pauseMeditation() {
        meditation.pause();
      },
      resumeMeditation() {
        meditation.play();
      },
      stopAll() {
        clearInterval(fades.current.ambient);
        clearInterval(fades.current.meditation);
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
