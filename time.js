// Turns a Date into text like "7:00 AM" (12-hour, no leading zero on the hour).
export function formatTime(date) {
  const hours24 = date.getHours();
  const minutes = date.getMinutes();
  const period = hours24 < 12 ? 'AM' : 'PM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const paddedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours12}:${paddedMinutes} ${period}`;
}

// Takes the hour and minute from a Date and returns the next time that
// clock time will happen: today if it is still ahead, otherwise tomorrow.
export function nextOccurrence(date) {
  const next = new Date();
  next.setHours(date.getHours(), date.getMinutes(), 0, 0);
  if (next.getTime() <= Date.now()) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

export function defaultAlarmTime() {
  const date = new Date();
  date.setHours(7, 0, 0, 0);
  return nextOccurrence(date);
}
