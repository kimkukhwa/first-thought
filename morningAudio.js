import { useEffect, useMemo, useRef } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';

// Drop real files with the same names into assets/audio to replace these.
const alarmSource = require('./assets/audio/alarm.wav');
const ambientSource = require('./assets/audio/ambient.wav');
const meditationSource = require('./assets/audio/meditation.wav');

// Owns the three sound players for the morning sequence and exposes
// simple actions. The sequence timing itself lives in MorningScreen.
export function useMorningAudio() {
  const alarm = useAudioPlayer(alarmSource);
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
      playAlarm() {
        setAudioModeAsync({ playsInSilentMode: true })
          .catch(() => {})
          .then(() => alarm.play());
      },
      stopAlarm() {
        alarm.pause();
      },
      startAmbient(fadeSeconds) {
        ambient.loop = true;
        ambient.volume = 0;
        ambient.play();
        fadeAmbient(1, fadeSeconds);
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
      stopAll() {
        clearInterval(fadeInterval.current);
        alarm.pause();
        ambient.pause();
        meditation.pause();
      },
    };
  }, [alarm, ambient, meditation]);
}
