import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useAudioPlayerStatus } from 'expo-audio';
import { colors } from '../theme';

// Sunrise: near-black with a hint of deep blue -> dusty blue-grey ->
// faint warm haze -> soft pale morning light.
const SKY_STOPS = [0, 0.4, 0.75, 1];
const SKY_COLORS = ['#06090F', '#2C3646', '#8C8086', '#F3EDE4'];
// The time indicator stays just barely visible against each sky color.
const INDICATOR_COLORS = ['#1A2130', '#414B5C', '#A59AA0', '#CFC7BC'];

// One breath, in milliseconds. Change these to tune the pace.
// 4s in, 1s hold, 6s out, 1s rest = 12 seconds, 5 breaths a minute.
const BREATH = { inhale: 4000, hold: 1000, exhale: 6000, rest: 1000 };

const CIRCLE_WIDTH = 0.6; // full size, as a share of the screen width
const CIRCLE_TOP = 0.46; // circle center, as a share of the screen height
const SMALLEST = 0.6; // size at the bottom of the breath
const WARM_FROM = 0.6; // share of the session after which the glow turns warm
const CUE_SECONDS = 60; // "breathe in / out" words fade away after this

// How strong each layer of the glow is. "dawn" is the soft white glow on
// the dark sky; "day" is the warm glow, a little stronger so it stays
// visible on the pale sky.
const DAWN = { color: colors.glowSoft, halo: 0.24, core: 0.54, ring: 0.2 };
const DAY = { color: colors.glowWarm, halo: 0.4, core: 0.92, ring: 0.45 };

// --- Breath timing, as points along one 0..1 cycle -----------------------
const TOTAL = BREATH.inhale + BREATH.hold + BREATH.exhale + BREATH.rest;
const at = (ms) => ms / TOTAL;
const IN_END = at(BREATH.inhale);
const HOLD_END = at(BREATH.inhale + BREATH.hold);
const OUT_END = at(BREATH.inhale + BREATH.hold + BREATH.exhale);

// The native animation driver can't take an easing curve inside an
// interpolation, so we trace a smooth ease-in-out curve with small steps.
const STEPS = 12;
const ease = (x) => 0.5 - 0.5 * Math.cos(Math.PI * x);
function easedSegment(from, to, startValue, endValue) {
  const input = [];
  const output = [];
  for (let i = 0; i <= STEPS; i++) {
    input.push(from + ((to - from) * i) / STEPS);
    output.push(startValue + (endValue - startValue) * ease(i / STEPS));
  }
  return { input, output };
}
const inhale = easedSegment(0, IN_END, 0, 1);
const exhale = easedSegment(HOLD_END, OUT_END, 1, 0);
const BREATH_INPUT = [...inhale.input, ...exhale.input, 1];
const BREATH_OUTPUT = [...inhale.output, ...exhale.output, 0];

// --- Glow drawing ---------------------------------------------------------
function rgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function radialGlow(hex, alpha) {
  return `radial-gradient(circle closest-side, ${rgba(hex, alpha)} 0%, ${rgba(
    hex,
    alpha * 0.45
  )} 45%, ${rgba(hex, 0)} 100%)`;
}

// A round layer of `size`, centered inside a box of `boxSize`.
function centeredCircle(size, boxSize) {
  const offset = (boxSize - size) / 2;
  return { position: 'absolute', width: size, height: size, left: offset, top: offset, borderRadius: size / 2 };
}

// One full glow: a wide faint halo, a bright soft core, and a thin ring.
function Glow({ size, look }) {
  return (
    <>
      <View
        style={[centeredCircle(size * 2.3, size), { backgroundImage: radialGlow(look.color, look.halo) }]}
      />
      <View
        style={[centeredCircle(size * 1.05, size), { backgroundImage: radialGlow(look.color, look.core) }]}
      />
      <View
        style={[centeredCircle(size, size), { borderWidth: 1, borderColor: rgba(look.color, look.ring) }]}
      />
    </>
  );
}

function formatRemaining(totalSeconds) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

export default function MeditationScreen({ player, onPause, onResume, onEnd }) {
  const status = useAudioPlayerStatus(player);
  const { width, height } = useWindowDimensions();

  // Sky: 0 at the start of the recording, 1 at the end.
  const progress = useRef(new Animated.Value(0)).current;
  // Glow color: 0 = soft white, 1 = warm peach.
  const warmth = useRef(new Animated.Value(0)).current;
  // Position within one breath, looping 0..1.
  const cycle = useRef(new Animated.Value(0)).current;
  // The breath words: 1 = shown, 0 = gone for good.
  const cues = useRef(new Animated.Value(1)).current;

  // The breathing never stops while this screen is showing.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(cycle, {
        toValue: 1,
        duration: TOTAL,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    const fadeCues = Animated.timing(cues, {
      toValue: 0,
      delay: CUE_SECONDS * 1000,
      duration: 2000,
      useNativeDriver: true,
    });
    fadeCues.start();
    return () => {
      loop.stop();
      fadeCues.stop();
    };
  }, [cycle, cues]);

  // The sky and the glow color follow the recording: they move while it
  // plays and hold still while it's paused. Each time playback (re)starts,
  // pick up from the track's real position.
  useEffect(() => {
    if (!status.playing || !status.duration) return;
    const total = status.duration * 1000;
    const done = Math.min(status.currentTime * 1000, total);
    const left = total - done;
    const fraction = done / total;
    const warmStart = WARM_FROM * total;

    progress.setValue(fraction);
    warmth.setValue(Math.max(0, (done - warmStart) / (total - warmStart)));

    const sky = Animated.timing(progress, {
      toValue: 1,
      duration: left,
      easing: Easing.linear,
      useNativeDriver: false, // colors cannot be animated natively
    });
    const waitBeforeWarm = Math.max(0, warmStart - done);
    const warm = Animated.timing(warmth, {
      toValue: 1,
      delay: waitBeforeWarm,
      duration: left - waitBeforeWarm,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    sky.start();
    warm.start();
    return () => {
      sky.stop();
      warm.stop();
    };
    // currentTime is read once, at the moment playback starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.playing, status.duration, progress, warmth]);

  const remaining = status.duration ? status.duration - status.currentTime : 0;

  const backgroundColor = progress.interpolate({ inputRange: SKY_STOPS, outputRange: SKY_COLORS });
  const indicatorColor = progress.interpolate({ inputRange: SKY_STOPS, outputRange: INDICATOR_COLORS });

  const breath = cycle.interpolate({ inputRange: BREATH_INPUT, outputRange: BREATH_OUTPUT });
  const scale = breath.interpolate({ inputRange: [0, 1], outputRange: [SMALLEST, 1] });
  const brightness = breath.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] });
  const dawnOpacity = warmth.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  // Each word fades in at the start of its half of the breath and out at the end.
  const cueIn = cycle.interpolate({
    inputRange: [0, at(500), IN_END - at(300), IN_END + at(200)],
    outputRange: [0, 1, 1, 0],
    extrapolate: 'clamp',
  });
  const cueOut = cycle.interpolate({
    inputRange: [HOLD_END, HOLD_END + at(500), OUT_END - at(300), OUT_END + at(200)],
    outputRange: [0, 1, 1, 0],
    extrapolate: 'clamp',
  });

  const size = width * CIRCLE_WIDTH;
  const centerY = height * CIRCLE_TOP;
  const circleBox = { left: (width - size) / 2, top: centerY - size / 2, width: size, height: size };
  const cueTop = centerY + size / 2 + 40;

  function handlePauseResume() {
    if (status.playing) {
      onPause();
    } else {
      onResume();
    }
  }

  return (
    <Animated.View style={[styles.screen, { backgroundColor }]}>
      <Animated.View
        pointerEvents="none"
        style={[styles.circle, circleBox, { opacity: brightness, transform: [{ scale }] }]}
      >
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: dawnOpacity }]}>
          <Glow size={size} look={DAWN} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: warmth }]}>
          <Glow size={size} look={DAY} />
        </Animated.View>
      </Animated.View>

      <View pointerEvents="none" style={[styles.cueArea, { top: cueTop }]}>
        <Animated.Text style={[styles.cue, { opacity: Animated.multiply(cueIn, cues) }]}>
          breathe in
        </Animated.Text>
        <Animated.Text style={[styles.cue, { opacity: Animated.multiply(cueOut, cues) }]}>
          breathe out
        </Animated.Text>
      </View>

      <Animated.Text style={[styles.indicator, { color: indicatorColor }]}>
        {formatRemaining(remaining)}
      </Animated.Text>

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
  },
  circle: {
    position: 'absolute',
  },
  cueArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  cue: {
    position: 'absolute',
    color: colors.muted,
    fontSize: 12,
    fontWeight: '300',
    letterSpacing: 2,
  },
  indicator: {
    position: 'absolute',
    top: 56,
    right: 24,
    fontSize: 12,
    fontWeight: '300',
    letterSpacing: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
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
