import { Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../theme';
import { formatTime } from '../time';

export default function HomeScreen({
  alarmTime,
  alarmOn,
  isEditing,
  onToggleEditing,
  onToggleAlarm,
  onTimeChange,
  onTestIn10s,
  onTestMeditation,
}) {
  return (
    <View style={styles.screen}>
      <Pressable onPress={onToggleEditing}>
        <Text style={styles.time}>{formatTime(alarmTime)}</Text>
      </Pressable>

      <Pressable onPress={onToggleAlarm} hitSlop={12}>
        <Text style={styles.alarmStatus}>{alarmOn ? 'Alarm  ON' : 'Alarm  OFF'}</Text>
      </Pressable>

      <View style={styles.meditation}>
        <Text style={styles.meditationTitle}>Morning Meditation</Text>
        <Text style={styles.meditationLength}>10 min</Text>
      </View>

      <Pressable style={styles.editButton} onPress={onToggleEditing} hitSlop={12}>
        <Text style={styles.editText}>{isEditing ? 'Done' : 'Edit'}</Text>
      </Pressable>

      {isEditing && (
        <DateTimePicker
          value={alarmTime}
          mode="time"
          display="spinner"
          onChange={onTimeChange}
          themeVariant="dark"
          textColor={colors.text}
          style={styles.picker}
        />
      )}

      {/* Temporary, for testing the morning sequence. Remove later. */}
      <View style={styles.testArea}>
        <Pressable style={styles.testButton} onPress={onTestIn10s} hitSlop={12}>
          <Text style={styles.testText}>Test in 10s</Text>
        </Pressable>
        <Pressable style={styles.testButton} onPress={onTestMeditation} hitSlop={12}>
          <Text style={styles.testText}>Test: 30s meditation</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  time: {
    color: colors.text,
    fontSize: 64,
    fontWeight: '200',
    letterSpacing: 1,
  },
  alarmStatus: {
    color: colors.muted,
    fontSize: 15,
    letterSpacing: 2,
    marginTop: 12,
  },
  meditation: {
    alignItems: 'center',
    marginTop: 80,
  },
  meditationTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '400',
  },
  meditationLength: {
    color: colors.muted,
    fontSize: 15,
    marginTop: 6,
  },
  editButton: {
    marginTop: 56,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  editText: {
    color: colors.muted,
    fontSize: 14,
    letterSpacing: 1,
  },
  picker: {
    marginTop: 16,
    alignSelf: 'stretch',
  },
  testArea: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  testButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  testText: {
    color: colors.dim,
    fontSize: 13,
    letterSpacing: 1,
  },
});
