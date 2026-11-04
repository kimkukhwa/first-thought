import { Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, quiet } from '../theme';
import { dateAt, formatTime } from '../time';

export default function HomeScreen({
  reminder,
  notificationsBlocked,
  isEditing,
  onBegin,
  onToggleEditing,
  onToggleReminder,
  onTimeChange,
  onTestSkipWait,
}) {
  return (
    <View style={styles.screen}>
      <Pressable style={styles.beginButton} onPress={onBegin}>
        <Text style={styles.beginText}>Begin</Text>
      </Pressable>

      <Text style={styles.meditation}>Morning Meditation · 10 min</Text>

      <View style={styles.reminderRow}>
        <Text style={styles.reminderLabel}>Reminder</Text>
        <Pressable onPress={onToggleEditing} hitSlop={12}>
          <Text style={[styles.reminderTime, reminder.on && styles.reminderTimeOn]}>
            {formatTime(reminder.hours, reminder.minutes)}
          </Text>
        </Pressable>
        <Pressable onPress={onToggleReminder} hitSlop={12}>
          <Text style={styles.reminderSwitch}>{reminder.on ? 'On' : 'Off'}</Text>
        </Pressable>
      </View>

      {reminder.on && notificationsBlocked && (
        <Text style={styles.blocked}>Notifications are off in Settings</Text>
      )}

      {isEditing && (
        <>
          <DateTimePicker
            value={dateAt(reminder.hours, reminder.minutes)}
            mode="time"
            display="spinner"
            onValueChange={onTimeChange}
            themeVariant="dark"
            textColor={colors.text}
            style={styles.picker}
          />
          <Pressable style={styles.doneButton} onPress={onToggleEditing} hitSlop={12}>
            <Text style={quiet.text}>Done</Text>
          </Pressable>
        </>
      )}

      {__DEV__ && (
        <View style={styles.testArea}>
          <Pressable style={styles.testButton} onPress={onTestSkipWait} hitSlop={12}>
            <Text style={styles.testText}>Test: skip wait</Text>
          </Pressable>
        </View>
      )}
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
  beginButton: {
    borderWidth: 1,
    borderColor: colors.dim,
    borderRadius: 999,
    paddingVertical: 18,
    paddingHorizontal: 64,
  },
  beginText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '300',
    letterSpacing: 1,
  },
  meditation: {
    color: colors.muted,
    fontSize: 15,
    marginTop: 20,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 80,
  },
  reminderLabel: {
    color: colors.muted,
    fontSize: 15,
    letterSpacing: 1,
  },
  reminderTime: {
    color: colors.muted,
    fontSize: 15,
    letterSpacing: 1,
    marginLeft: 16,
  },
  reminderTimeOn: {
    color: colors.text,
  },
  reminderSwitch: {
    color: colors.muted,
    fontSize: 15,
    letterSpacing: 1,
    marginLeft: 16,
  },
  blocked: {
    color: colors.dim,
    fontSize: 13,
    letterSpacing: 0.5,
    marginTop: 12,
  },
  picker: {
    marginTop: 16,
    alignSelf: 'stretch',
  },
  doneButton: {
    ...quiet.button,
  },
  testArea: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  testButton: {
    ...quiet.button,
  },
  testText: {
    color: colors.dim,
    fontSize: 13,
    letterSpacing: 1,
  },
});
