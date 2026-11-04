import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAudioPlayerStatus } from 'expo-audio';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme';

// Sunrise: near-black with a hint of deep blue -> dusty blue-grey ->
// faint warm haze -> soft pale morning light.
const SKY_STOPS = [0, 0.4, 0.75, 1];
const SKY_COLORS = ['#06090F', '#2C3646', '#8C8086', '#F3EDE4'];
// The time indicator, and the waveform, stay just barely visible against
// each sky color.
const INDICATOR_COLORS = ['#1A2130', '#414B5C', '#A59AA0', '#CFC7BC'];

// A gentle sine wave, drawn once per keyframe below, that rises and
// falls on a slow, continuous loop.
const WAVE_WIDTH = 240;
const WAVE_HEIGHT = 64;
const WAVE_CYCLES = 2;
const WAVE_POINTS = 32;
const WAVE_AMPLITUDE = 16;
const WAVE_LOOP_MS = 4000;
const AnimatedPath = Animated.createAnimatedComponent(Path);

function buildWavePath(phaseOffset) {
  let d = '';
  for (let i = 0; i <= WAVE_POINTS; i++) {
    const x = (i / WAVE_POINTS) * WAVE_WIDTH;
    const angle = (i / WAVE_POINTS) * Math.PI * 2 * WAVE_CYCLES + phaseOffset;
    const y = WAVE_HEIGHT / 2 + WAVE_AMPLITUDE * Math.sin(angle);
    d += `${i === 0 ? 'M' : ' L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return d;
}

// Five evenly spaced phases across one full cycle (0 to 2*PI). The first
// and last are identical, so the loop has no visible seam.
const WAVE_KEYFRAMES = [0, 1, 2, 3, 4].map((step) => buildWavePath((step * Math.PI * 2) / 4));

function formatRemaining(totalSeconds) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

export default function MeditationScreen({ player, onPause, onResume, onEnd }) {
  const status = useAudioPlayerStatus(player);
  const progress = useRef(new Animated.Value(0)).current;
  const animationStarted = useRef(false);
  const wavePhase = useRef(new Animated.Value(0)).current;

  // The track's real duration isn't known until it has loaded. Start the
  // one slow, linear sky animation as soon as we learn it, timed to match.
  useEffect(() => {
    if (animationStarted.current) return;
    if (!status.isLoaded || !status.duration) return;
    animationStarted.current = true;
    Animated.timing(progress, {
      toValue: 1,
      duration: status.duration * 1000,
      easing: Easing.linear,
      useNativeDriver: false, // colors cannot be animated natively
    }).start();
  }, [progress, status.isLoaded, status.duration]);

  // The waveform breathes on its own slow loop, independent of playback
  // position, for as long as this screen is showing.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(wavePhase, {
        toValue: 1,
        duration: WAVE_LOOP_MS,
        easing: Easing.linear,
        useNativeDriver: false, // animating an SVG path string
      })
    );
    loop.start();
    return () => loop.stop();
  }, [wavePhase]);

  const remaining = status.duration ? status.duration - status.currentTime : 0;

  const backgroundColor = progress.interpolate({
    inputRange: SKY_STOPS,
    outputRange: SKY_COLORS,
  });
  const indicatorColor = progress.interpolate({
    inputRange: SKY_STOPS,
    outputRange: INDICATOR_COLORS,
  });
  const waveD = wavePhase.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: WAVE_KEYFRAMES,
  });

  function handlePauseResume() {
    if (status.playing) {
      onPause();
    } else {
      onResume();
    }
  }

  return (
    <Animated.View style={[styles.screen, { backgroundColor }]}>
      <Animated.Text style={[styles.indicator, { color: indicatorColor }]}>
        {formatRemaining(remaining)}
      </Animated.Text>

      <View style={styles.waveWrap}>
        <Svg width={WAVE_WIDTH} height={WAVE_HEIGHT} viewBox={`0 0 ${WAVE_WIDTH} ${WAVE_HEIGHT}`}>
          <AnimatedPath
            d={waveD}
            stroke={indicatorColor}
            strokeWidth={1.5}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </View>

      <View style={styles.controls}>
        <Pressable style={styles.controlButton} onPress={handlePauseResume} hitSlop={12}>
          <Text style={styles.controlText}>{status.playing ? 'Pause' : 'Resume'}</Text>
        </Pressable>
        <Pressable style={styles.controlButton} onPress={onEnd} hitSlop={12}>
          <Text style={styles.controlText}>End</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    position: 'absolute',
    top: 56,
    right: 24,
    fontSize: 12,
    fontWeight: '300',
    letterSpacing: 1,
  },
  waveWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: 48,
    flexDirection: 'row',
  },
  controlButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  controlText: {
    color: colors.muted,
    fontSize: 14,
    letterSpacing: 1,
  },
});
