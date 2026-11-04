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
