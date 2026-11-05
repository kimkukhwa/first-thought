// Turns hours and minutes into text like "7:00 AM" (12-hour, no leading zero).
export function formatTime(hours24, minutes) {
  const period = hours24 < 12 ? 'AM' : 'PM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const paddedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours12}:${paddedMinutes} ${period}`;
}

// A Date for today at hours:minutes, for the time picker.
export function dateAt(hours, minutes) {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

// The part of the day, used by the greeting and the closing line so they
// always match. morning 5:00-11:59, afternoon 12:00-16:59,
// evening 17:00-20:59, night 21:00-4:59.
export function partOfDay(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}
