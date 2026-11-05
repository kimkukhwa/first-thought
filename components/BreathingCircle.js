import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors } from '../theme';

// One breath during the meditation, in milliseconds. Change these to tune
// the pace. 4s in, 1s hold, 6s out, 1s rest = 12 seconds, 5 breaths a minute.
const BREATH = { inhale: 4000, hold: 1000, exhale: 6000, rest: 1000 };
// The slow, small breath on the home screen.
const RESTING_BREATH_MS = 16000;

const SMALLEST = 0.6; // meditation size at the bottom of the breath
const RESTING_SIZES = [0.52, 0.58]; // home size range (smaller, barely moving)
const PAUSED_DIM = 0.6; // how bright the circle stays while paused
const CUE_SECONDS = 60; // "breathe in / out" words fade away after this
export const HANDOFF_MS = 1200; // home -> meditation grow-and-move
const DISSOLVE_MS = 2000; // closing: shrink and fade away

// How strong each layer of the glow is. "home" is a brighter resting glow
// (dark text sits on it), "dawn" is the soft white glow on the dark sky,
// "day" is the warm glow, stronger so it stays visible on the pale sky.
const HOME = { color: colors.glowSoft, halo: 0.22, core: 0.8, ring: 0.26 };
const DAWN = { color: colors.glowSoft, halo: 0.24, core: 0.54, ring: 0.2 };
const DAY = { color: colors.glowWarm, halo: 0.4, core: 0.92, ring: 0.45 };

// --- Breath timing, as points along one 0..1 cycle -----------------------
const TOTAL = BREATH.inhale + BREATH.hold + BREATH.exhale + BREATH.rest;
const at = (ms) => ms / TOTAL;
const IN_END = at(BREATH.inhale);
const HOLD_END = at(BREATH.inhale + BREATH.hold);
const OUT_END = at(BREATH.inhale + BREATH.hold + BREATH.exhale);

// The native animation driver can't take an easing curve inside an
// interpolation, so we trace smooth curves with small steps.
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
// Resting breath: one smooth swell and settle per loop.
const restUp = easedSegment(0, 0.5, 0, 1);
const restDown = easedSegment(0.5, 1, 1, 0);
const REST_INPUT = [...restUp.input, ...restDown.input.slice(1)];
const REST_OUTPUT = [...restUp.output, ...restDown.output.slice(1)];

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

// The breathing glow. Takes a square box of `size` (its full size at the top
// of a meditation breath); the parent decides where that box sits.
//   mode 'resting'  slow, small breath for the home screen
//   mode 'handoff'  grows from resting into the start of a meditation breath
//   mode 'session'  the meditation breath
// `paused` holds the session breath still and dims it, with "paused" below.
// `warmth` (an Animated.Value 0..1) turns the glow from soft white to peach.
// `showCues` shows "breathe in / out" below for the first minute.
// `dissolve` shrinks and fades the circle away (the closing).
export default function BreathingCircle({
  size,
  mode = 'session',
  paused = false,
  warmth,
  showCues = false,
  dissolve = false,
}) {
  // Position within one meditation breath, 0..1.
  const cycle = useRef(new Animated.Value(0)).current;
  // Position within one resting breath, 0..1.
  const rest = useRef(new Animated.Value(0)).current;
  // 1 = resting look and size, 0 = meditation look and size.
  const restWeight = useRef(new Animated.Value(mode === 'session' ? 0 : 1)).current;
  const pausedLook = useRef(new Animated.Value(0)).current;
  const cues = useRef(new Animated.Value(1)).current;
  const dissolved = useRef(new Animated.Value(0)).current;
  const noWarmth = useRef(new Animated.Value(0)).current;
  const warm = warmth || noWarmth;
  const breathing = useRef(null);

  // Breathes from `from` (a point in the breath, 0..1) to the end of that
  // breath, then keeps looping whole breaths.
  function breatheFrom(from) {
    const finishBreath = Animated.timing(cycle, {
      toValue: 1,
      duration: (1 - from) * TOTAL,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    breathing.current = finishBreath;
    finishBreath.start(({ finished }) => {
      if (!finished) return;
      cycle.setValue(0);
      const loop = Animated.loop(
        Animated.timing(cycle, {
          toValue: 1,
          duration: TOTAL,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      breathing.current = loop;
      loop.start();
    });
  }

  // Meditation breath: runs in session mode; holds still exactly where it
  // is when paused or dissolving, and carries on from there on resume.
  useEffect(() => {
    if (mode !== 'session') return;
    if (paused || dissolve) {
      if (breathing.current) breathing.current.stop();
      cycle.stopAnimation();
      return;
    }
    cycle.stopAnimation((value) => breatheFrom(value));
    return () => {
      if (breathing.current) breathing.current.stop();
    };
    // breatheFrom only uses refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, paused, dissolve, cycle]);

  // Resting breath on the home screen.
  useEffect(() => {
    if (mode !== 'resting') return;
    const loop = Animated.loop(
      Animated.timing(rest, {
        toValue: 1,
        duration: RESTING_BREATH_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [mode, rest]);

  // Handoff: from the resting look and size into the start of a session.
  useEffect(() => {
    const animation = Animated.timing(restWeight, {
      toValue: mode === 'resting' ? 1 : 0,
      duration: mode === 'handoff' ? HANDOFF_MS : 0,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [mode, restWeight]);

  // The breath words fade away for good after the first minute.
  useEffect(() => {
    if (mode !== 'session' || !showCues) return;
    const fadeCues = Animated.timing(cues, {
      toValue: 0,
      delay: CUE_SECONDS * 1000,
      duration: 2000,
      useNativeDriver: true,
    });
    fadeCues.start();
    return () => fadeCues.stop();
  }, [mode, showCues, cues]);

  useEffect(() => {
    const animation = Animated.timing(pausedLook, {
      toValue: paused ? 1 : 0,
      duration: 500,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [paused, pausedLook]);

  useEffect(() => {
    if (!dissolve) return;
    const animation = Animated.timing(dissolved, {
      toValue: 1,
      duration: DISSOLVE_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [dissolve, dissolved]);

  // --- Combine everything into size, brightness and look -----------------
  const sessionWeight = restWeight.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const breath = cycle.interpolate({ inputRange: BREATH_INPUT, outputRange: BREATH_OUTPUT });
  const restBreath = rest.interpolate({ inputRange: REST_INPUT, outputRange: REST_OUTPUT });

  const sessionScale = breath.interpolate({ inputRange: [0, 1], outputRange: [SMALLEST, 1] });
  const restScale = restBreath.interpolate({ inputRange: [0, 1], outputRange: RESTING_SIZES });
  const dissolveScale = dissolved.interpolate({ inputRange: [0, 1], outputRange: [1, 0.75] });
  const scale = Animated.multiply(
    Animated.add(
      Animated.multiply(restWeight, restScale),
      Animated.multiply(sessionWeight, sessionScale)
    ),
    dissolveScale
  );

  // A little brighter at the top of each meditation breath; steady at rest.
  const sessionBrightness = breath.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] });
  const brightness = Animated.add(restWeight, Animated.multiply(sessionWeight, sessionBrightness));
  const pauseDim = pausedLook.interpolate({ inputRange: [0, 1], outputRange: [1, PAUSED_DIM] });
  const remaining = dissolved.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const opacity = Animated.multiply(Animated.multiply(brightness, pauseDim), remaining);

  const coolness = warm.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const dawnOpacity = Animated.multiply(sessionWeight, coolness);
  const dayOpacity = Animated.multiply(sessionWeight, warm);

  // Each word fades in at the start of its half of the breath and out at the end.
  const running = pausedLook.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
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
  const cueInOpacity = Animated.multiply(Animated.multiply(cueIn, cues), running);
  const cueOutOpacity = Animated.multiply(Animated.multiply(cueOut, cues), running);

  return (
    <View pointerEvents="none" style={{ width: size, height: size }}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity, transform: [{ scale }] }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: restWeight }]}>
          <Glow size={size} look={HOME} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: dawnOpacity }]}>
          <Glow size={size} look={DAWN} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: dayOpacity }]}>
          <Glow size={size} look={DAY} />
        </Animated.View>
      </Animated.View>

      {mode === 'session' && (
        <View style={[styles.wordsArea, { top: size + 40, left: -size, right: -size }]}>
          {showCues && (
            <>
              <Animated.Text style={[styles.word, { opacity: cueInOpacity }]}>breathe in</Animated.Text>
              <Animated.Text style={[styles.word, { opacity: cueOutOpacity }]}>breathe out</Animated.Text>
            </>
          )}
          <Animated.Text style={[styles.word, { opacity: pausedLook }]}>paused</Animated.Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wordsArea: {
    position: 'absolute',
    alignItems: 'center',
  },
  word: {
    position: 'absolute',
    color: colors.muted,
    fontSize: 12,
    fontWeight: '300',
    letterSpacing: 2,
  },
});
