import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

// Sunrise: near-black with a hint of deep blue -> dusty blue-grey ->
// faint warm haze -> soft pale morning light.
const SKY_STOPS = [0, 0.4, 0.75, 1];
const SKY_COLORS = ['#06090F', '#2C3646', '#8C8086', '#F3EDE4'];
// The time indicator stays just barely visible against each sky color.
const INDICATOR_COLORS = ['#1A2130', '#414B5C', '#A59AA0', '#CFC7BC'];

function formatRemaining(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

export default function MeditationScreen({ seconds }) {
  const progress = useRef(new Animated.Value(0)).current;
  const [remaining, setRemaining] = useState(seconds);

  // One slow, linear animation across the whole meditation.
  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: seconds * 1000,
      easing: Easing.linear,
      useNativeDriver: false, // colors cannot be animated natively
    }).start();
  }, [progress, seconds]);

  // Count down once a second.
  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const backgroundColor = progress.interpolate({
    inputRange: SKY_STOPS,
    outputRange: SKY_COLORS,
  });
  const indicatorColor = progress.interpolate({
    inputRange: SKY_STOPS,
    outputRange: INDICATOR_COLORS,
  });

  return (
    <Animated.View style={[styles.screen, { backgroundColor }]}>
      <Animated.Text style={[styles.indicator, { color: indicatorColor }]}>
        {formatRemaining(remaining)}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  indicator: {
    position: 'absolute',
    top: 56,
    right: 24,
    fontSize: 12,
    fontWeight: '300',
    letterSpacing: 1,
  },
});
