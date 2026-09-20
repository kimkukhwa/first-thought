import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme';
import { formatTime } from '../time';

export default function NightScreen({ onTap }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const [now, setNow] = useState(new Date());

  // Fade in slowly when this screen appears.
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  // Keep the clock current.
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Animated.View style={[styles.screen, { opacity }]}>
      <Pressable style={styles.touchArea} onPress={onTap}>
        <Text style={styles.clock}>{formatTime(now)}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Cover the whole screen, on top of whatever is underneath.
  screen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.night,
  },
  touchArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Same size and weight as the alarm time on Home, just dim.
  clock: {
    color: colors.dim,
    fontSize: 64,
    fontWeight: '200',
    letterSpacing: 1,
  },
});
