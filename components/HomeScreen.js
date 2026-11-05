import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  AppState,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, quiet } from '../theme';
import { dateAt, formatTime, partOfDay } from '../time';
import BreathingCircle, { HANDOFF_MS } from './BreathingCircle';
import { CIRCLE_TOP, CIRCLE_WIDTH } from './MeditationScreen';

const HOME_CIRCLE_TOP = 0.57; // circle center on Home, as a share of the height
const TEXT_FADE_MS = 900; // the words fade while the circle moves up

// "The circle is the door": a greeting, one line, and the resting circle.
// Tapping the circle grows it into the meditation.
export default function HomeScreen({
  reminder,
  notificationsBlocked,
  isEditing,
  onBegin,
  onToggleEditing,
  onToggleReminder,
  onTimeChange,
}) {
  const { width, height } = useWindowDimensions();

  // The greeting follows the time of day; refresh it whenever the app
  // comes back to the front.
  const [part, setPart] = useState(() => partOfDay());
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setPart(partOfDay());
    });
    return () => subscription.remove();
  }, []);

  // The handoff into the meditation.
  const [leaving, setLeaving] = useState(false);
  const words = useRef(new Animated.Value(1)).current; // 1 shown, 0 gone
  const move = useRef(new Animated.Value(0)).current; // 0 home spot, 1 meditation spot
  const sky = useRef(new Animated.Value(0)).current; // background: home -> sunrise start

  function startSession() {
    if (leaving) return;
    setLeaving(true);
    Animated.parallel([
      Animated.timing(words, { toValue: 0, duration: TEXT_FADE_MS, useNativeDriver: true }),
      Animated.timing(move, {
        toValue: 1,
        duration: HANDOFF_MS,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(sky, { toValue: 1, duration: HANDOFF_MS, useNativeDriver: false }),
    ]).start(({ finished }) => {
      if (finished) onBegin();
    });
  }

  const size = width * CIRCLE_WIDTH;
  // The circle box sits where the meditation puts it, then is shifted down
  // to its Home spot; the handoff slides it back up.
  const circleBox = {
    left: (width - size) / 2,
    top: height * CIRCLE_TOP - size / 2,
    width: size,
    height: size,
  };
  const translateY = move.interpolate({
    inputRange: [0, 1],
    outputRange: [(HOME_CIRCLE_TOP - CIRCLE_TOP) * height, 0],
  });
  const backgroundColor = sky.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.background, colors.skyStart],
  });
  const tapSize = size * 0.6;
  const tapBox = {
    width: tapSize,
    height: tapSize,
    borderRadius: tapSize / 2,
    left: (size - tapSize) / 2,
    top: (size - tapSize) / 2,
  };

  return (
    <Animated.View style={[styles.screen, { backgroundColor }]}>
      <Animated.Text style={[styles.greeting, { top: height * 0.19, opacity: words }]}>
        good {part}
      </Animated.Text>
      <Animated.Text style={[styles.line, { top: height * 0.235, opacity: words }]}>
        Choose how you want to feel today and begin there.
      </Animated.Text>

      <Animated.View style={[styles.circleSpot, circleBox, { transform: [{ translateY }] }]}>
        {/* One wrapper the exact size of the circle: the glow, the word on
            top of its core, and the tap area all share the same center. */}
        <View style={{ width: size, height: size }}>
          <BreathingCircle size={size} mode={leaving ? 'handoff' : 'resting'} />
          {/* Outside the breathing scale, so the word stays still; it lets
              taps through to the circle underneath. */}
          <Animated.View pointerEvents="none" style={[styles.beginArea, { opacity: words }]}>
            <Text style={styles.beginWord}>begin</Text>
          </Animated.View>
          <Pressable
            style={[styles.circleSpot, tapBox]}
            onPress={startSession}
            disabled={leaving}
            accessibilityRole="button"
            accessibilityLabel="Begin meditation"
          />
        </View>
      </Animated.View>

      {isEditing && !leaving && (
        <View style={styles.pickerPanel}>
          <DateTimePicker
            value={dateAt(reminder.hours, reminder.minutes)}
            mode="time"
            display="spinner"
            onValueChange={onTimeChange}
            themeVariant="dark"
            textColor={colors.text}
            style={styles.picker}
          />
          <Pressable style={quiet.button} onPress={onToggleEditing} hitSlop={12}>
            <Text style={quiet.text}>Done</Text>
          </Pressable>
        </View>
      )}

      {reminder.on && notificationsBlocked && (
        <Animated.Text style={[styles.blocked, { opacity: words }]}>
          Notifications are off in Settings
        </Animated.Text>
      )}

      <Animated.View
        pointerEvents={leaving ? 'none' : 'auto'}
        style={[styles.reminderRow, { opacity: words }]}
      >
        <Pressable
          style={styles.dotButton}
          onPress={onToggleReminder}
          accessibilityRole="switch"
          accessibilityState={{ checked: reminder.on }}
          accessibilityLabel="Reminder"
        >
          <View style={[styles.dot, !reminder.on && styles.dotOff]} />
        </Pressable>
        <Text style={styles.reminderLabel}>reminder</Text>
        <Pressable
          style={styles.timeButton}
          onPress={onToggleEditing}
          accessibilityRole="button"
          accessibilityLabel="Change reminder time"
        >
          <Text style={styles.reminderTime}>{formatTime(reminder.hours, reminder.minutes)}</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  greeting: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: colors.muted,
    fontSize: 13,
    letterSpacing: 2.6,
  },
  line: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 36,
    textAlign: 'center',
    color: colors.text,
    fontSize: 22,
    fontWeight: '200',
    lineHeight: 32,
  },
  circleSpot: {
    position: 'absolute',
  },
  beginArea: {
    // Fills the circle wrapper. (StyleSheet.absoluteFillObject no longer
    // exists in React Native 0.88, so the values are written out.)
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beginWord: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: 3.4,
    // iOS adds the letter spacing after the last letter too; the same space
    // on the left keeps the word visually centered on the core.
    paddingLeft: 3.4,
    textAlign: 'center',
  },
  pickerPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 96,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  picker: {
    alignSelf: 'stretch',
  },
  blocked: {
    position: 'absolute',
    bottom: 92,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: colors.dim,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  reminderRow: {
    position: 'absolute',
    bottom: 42,
    left: 0,
    right: 0,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  // The dot is tiny; its touch area is 44 x 44.
  dotButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.reminderDot,
  },
  dotOff: {
    opacity: 0.15,
  },
  reminderLabel: {
    color: colors.muted,
    fontSize: 12.5,
    letterSpacing: 1.6,
  },
  timeButton: {
    minHeight: 44,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  reminderTime: {
    color: colors.text,
    fontSize: 12.5,
    letterSpacing: 1.6,
  },
});
