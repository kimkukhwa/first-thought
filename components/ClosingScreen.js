import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

// ---- Edit the closing here ----------------------------------------------
// The line follows the part of the day when the session started.
const LINES = {
  morning: 'Let the feeling you chose lead your morning.',
  afternoon: 'Carry this feeling into the rest of your day.',
  evening: 'Let this feeling carry you through the evening.',
  night: 'Let this feeling stay with you as you rest.',
};
// The warm sky, top to bottom: apricot, peach, soft rose.
const GRADIENT = ['#EEC4A0', '#F1B296', '#E2968C'];
const LINE_COLOR = '#603E30';
const TIMING = {
  warmMs: 3000, // the sky warms into the gradient
  lineDelayMs: 1500, // the line starts to appear this long after the end
  lineFadeMs: 1500, // how long the line takes to fade in
  stayMs: 6000, // how long the line stays before going home
  fadeHomeMs: 800, // fade to dark (then the app's usual 0.7s fade into Home)
};
// ---------------------------------------------------------------------------

// A short, warm closing that lies over the finished meditation (whose circle
// dissolves underneath), then returns home by itself. A tap goes home now.
export default function ClosingScreen({ part, onDone }) {
  const warm = useRef(new Animated.Value(0)).current;
  const line = useRef(new Animated.Value(0)).current;
  const toDark = useRef(new Animated.Value(0)).current;
  const finished = useRef(false);

  function finish() {
    if (finished.current) return;
    finished.current = true;
    onDone();
  }
  const finishRef = useRef(finish);
  finishRef.current = finish;

  useEffect(() => {
    const sequence = Animated.parallel([
      Animated.timing(warm, {
        toValue: 1,
        duration: TIMING.warmMs,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(line, {
          toValue: 1,
          delay: TIMING.lineDelayMs,
          duration: TIMING.lineFadeMs,
          useNativeDriver: true,
        }),
        Animated.delay(TIMING.stayMs),
        Animated.timing(toDark, {
          toValue: 1,
          duration: TIMING.fadeHomeMs,
          useNativeDriver: true,
        }),
      ]),
    ]);
    sequence.start(({ finished: done }) => {
      if (done) finishRef.current();
    });
    return () => sequence.stop();
  }, [warm, line, toDark]);

  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={finish} accessibilityLabel="Go home">
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: warm }]}>
        <LinearGradient colors={GRADIENT} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <View pointerEvents="none" style={styles.lineArea}>
        <Animated.Text style={[styles.line, { opacity: line }]}>
          {LINES[part] || LINES.morning}
        </Animated.Text>
      </View>

      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.dark, { opacity: toDark }]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  lineArea: {
    position: 'absolute',
    top: '38%',
    left: 0,
    right: 0,
    paddingHorizontal: 44,
    alignItems: 'center',
  },
  line: {
    color: LINE_COLOR,
    fontSize: 21,
    fontWeight: '200',
    lineHeight: 32,
    textAlign: 'center',
  },
  dark: {
    backgroundColor: colors.night,
  },
});
