import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { colors, quiet } from '../theme';

const LINE_DELAY_MS = 1000;
const LINE_FADE_MS = 1500;

export default function ClosingScreen({ onDone }) {
  const lineOpacity = useRef(new Animated.Value(0)).current;

  // A short pause on the empty screen, then the line slowly appears.
  useEffect(() => {
    const appear = Animated.timing(lineOpacity, {
      toValue: 1,
      delay: LINE_DELAY_MS,
      duration: LINE_FADE_MS,
      useNativeDriver: true,
    });
    appear.start();
    return () => appear.stop();
  }, [lineOpacity]);

  return (
    <View style={styles.screen}>
      <Animated.Text style={[styles.line, { opacity: lineOpacity }]}>
        Your day begins now.
      </Animated.Text>

      <Animated.View style={[styles.doneArea, { opacity: lineOpacity }]}>
        <Pressable style={quiet.button} onPress={onDone} hitSlop={12}>
          <Animated.Text style={quiet.text}>Done</Animated.Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  line: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '300',
    lineHeight: 30,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  doneArea: {
    position: 'absolute',
    bottom: quiet.bottom,
  },
});
