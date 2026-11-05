export const colors = {
  background: '#1B2230',
  night: '#0B0E14',
  text: '#E8E6E1',
  muted: '#8C94A3',
  dim: '#4A5160',
  // The breathing glow: soft white on the dark sky, warm peach on the pale sky.
  glowSoft: '#ECE5DA',
  glowWarm: '#DEA076',
  // The first color of the meditation sunrise (Home fades into it on Begin).
  skyStart: '#06090F',
  // The small reminder dot on Home.
  reminderDot: '#D9A47E',
};

// Shared look for the small, quiet text buttons (Done, End, Pause...), so
// every screen feels the same.
export const quiet = {
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  text: {
    color: colors.muted,
    fontSize: 14,
    letterSpacing: 1,
  },
  // Distance from the bottom of the screen for a lone quiet button.
  bottom: 48,
};
