import { useEffect, useRef, useState } from 'react';
import { Animated, AppState, Easing, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useAudioPlayerStatus } from 'expo-audio';
import { colors } from '../theme';
import BreathingCircle from './BreathingCircle';
import HomeIcon from './HomeIcon';

// Sunrise: near-black with a hint of deep blue -> dusty blue-grey ->
// faint warm haze -> soft pale morning light.
const SKY_STOPS = [0, 0.4, 0.75, 1];
const SKY_COLORS = [colors.skyStart, '#2C3646', '#8C8086', '#F3EDE4'];

// Where the circle sits. Home uses the same numbers for its handoff.
export const CIRCLE_WIDTH = 0.6; // full size, as a share of the screen width
export const CIRCLE_TOP = 0.46; // circle center, as a share of the screen height
const WARM_FROM = 0.6; // share of the session after which the glow turns warm

// The meditation: the sunrise, the breathing circle, and nothing else.
// Tapping the circle pauses and resumes. While paused, a house icon leads home.
// `ending` is set when the recording has finished: the circle dissolves and
// the screen no longer reacts to taps.
export default function MeditationScreen({ player, onPause, onResume, onHome, ending = false }) {
  const status = useAudioPlayerStatus(player);
  const { width, height } = useWindowDimensions();

  // Sky: 0 at the start of the recording, 1 at the end.
  const progress = useRef(new Animated.Value(0)).current;
  // Glow color: 0 = soft white, 1 = warm peach.
  const warmth = useRef(new Animated.Value(0)).current;
  // 0 while running, 1 while paused (the house icon).
  const pausedLook = useRef(new Animated.Value(0)).current;

  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const endingRef = useRef(ending);
  endingRef.current = ending;

  function pause() {
    if (pausedRef.current || endingRef.current) return;
    pausedRef.current = true;
    setPaused(true);
    onPause();
  }

  function resume() {
    if (!pausedRef.current) return;
    pausedRef.current = false;
    setPaused(false);
    onResume();
  }

  function togglePause() {
    if (pausedRef.current) {
      resume();
    } else {
      pause();
    }
  }

  // iOS stops the sound when the app goes to the background (Home button,
  // lock screen), so show the session as paused when the user comes back.
  const pauseRef = useRef(pause);
  pauseRef.current = pause;
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background') pauseRef.current();
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const animation = Animated.timing(pausedLook, {
      toValue: paused ? 1 : 0,
      duration: 500,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [paused, pausedLook]);

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

  const backgroundColor = progress.interpolate({ inputRange: SKY_STOPS, outputRange: SKY_COLORS });

  const size = width * CIRCLE_WIDTH;
  const centerY = height * CIRCLE_TOP;
  const circleBox = { left: (width - size) / 2, top: centerY - size / 2, width: size, height: size };

  return (
    <Animated.View style={[styles.screen, { backgroundColor }]}>
      <View pointerEvents="none" style={[styles.circleSpot, circleBox]}>
        <BreathingCircle
          size={size}
          mode="session"
          paused={paused}
          warmth={warmth}
          showCues
          dissolve={ending}
        />
      </View>

      {/* The whole circle area, at its full size, pauses and resumes. */}
      {!ending && (
        <Pressable
          style={[styles.circleSpot, circleBox]}
          onPress={togglePause}
          accessibilityRole="button"
          accessibilityLabel={paused ? 'Resume' : 'Pause'}
        />
      )}

      <Animated.View
        pointerEvents={paused && !ending ? 'auto' : 'none'}
        style={[styles.homeArea, { opacity: pausedLook }]}
      >
        <Pressable
          style={styles.homeButton}
          onPress={onHome}
          accessibilityRole="button"
          accessibilityLabel="Home"
        >
          <HomeIcon size={28} color={colors.muted} />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  circleSpot: {
    position: 'absolute',
  },
  homeArea: {
    position: 'absolute',
    top: 40,
    right: 12,
  },
  // 52 x 52: comfortably more than the 44pt minimum touch area.
  homeButton: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
