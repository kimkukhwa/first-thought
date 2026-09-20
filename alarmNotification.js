import * as Notifications from 'expo-notifications';

// The app only ever has one scheduled notification: the backup alarm.
const ALARM_KIND = 'alarm';

// This decides what happens if the notification arrives while the app is
// open in the foreground. In that case the app itself is already running
// the morning sequence, so we show nothing to avoid a double alarm.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Returns true if we are allowed to show notifications. Only shows the
// system prompt when the user has not answered it yet; never nags.
export async function requestNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

// Replaces any pending backup alarm with one at `date`.
export async function scheduleAlarmNotification(date) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'First Thought',
      body: "Let's set your intention for today. What's the first thought you want to put into your mind?",
      sound: 'default',
      data: { kind: ALARM_KIND },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    },
  });
}

export async function cancelAlarmNotification() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// True if this notification response (a tap) came from our backup alarm.
export function isAlarmNotification(response) {
  return response?.notification?.request?.content?.data?.kind === ALARM_KIND;
}

// Re-exported so App.js only needs to import from this file.
export const useLastNotificationResponse = Notifications.useLastNotificationResponse;
