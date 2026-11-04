import * as Notifications from 'expo-notifications';

// The app only ever has one scheduled notification: the daily reminder.
const REMINDER_KIND = 'reminder';
const REMINDER_ID = 'daily-reminder';

// What happens if the reminder arrives while the app is open: show a quiet
// banner (no sound) and let the user decide. Nothing starts on its own.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// True if notifications are allowed. Never shows the system prompt.
export async function hasNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();
  return current.granted;
}

// Shows the system prompt only if the user hasn't answered it yet.
// Returns true if notifications are allowed.
export async function requestNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

// Replaces anything already scheduled with one notification that repeats
// every day at hours:minutes, even when the app is closed.
export async function scheduleDailyReminder(hours, minutes) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    // A fixed id: scheduling again replaces it, so there's never a second one.
    identifier: REMINDER_ID,
    content: {
      title: 'First Thought',
      body: "Let's set your intention for today. What's the first thought you want to put into your mind?",
      sound: 'default',
      data: { kind: REMINDER_KIND },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hours,
      minute: minutes,
    },
  });
}

export async function cancelReminder() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// True if this notification response (a tap) came from the daily reminder.
export function isReminderNotification(response) {
  return response?.notification?.request?.content?.data?.kind === REMINDER_KIND;
}

// Re-exported so App.js only needs to import from this file.
export const useLastNotificationResponse = Notifications.useLastNotificationResponse;
export const clearLastNotificationResponse = Notifications.clearLastNotificationResponse;
