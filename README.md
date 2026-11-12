# First Thought

A morning meditation app built around a simple idea: the first thing you think when you wake up shapes the rest of your day, so you should choose it on purpose.


Instead of being jolted awake by an alarm and reaching for your phone, First Thought wakes you gently, settles you with a gong and soft music, and walks you through a short guided meditation. You pick the feeling you want to carry into the day — calm, clear, confident, grounded — and spend a few minutes feeling it as if it has already happened. That feeling then guides how you think, act, and respond for the rest of the day.


## How it works
**Try the demo in your browser:** https://kimkukhwa.github.io/first-thought/demo/index.html

1. **Begin** — tap the breathing circle on Home, or tap the daily reminder notification
2. **Settle** — an opening gong and soft music
3. **Meditate** — a guided session where you choose and inhabit your intention for the day, with a breathing circle over a slow sunrise
4. **Close** — the sky warms, a short line for the time of day, and back home

## Current state — v2.1

- **The circle is the door.** Home is a greeting, one line, and a softly breathing circle; tapping it grows the circle into the meditation.
- **No alarm.** A daily reminder notification at a time you pick (or none). Tapping the reminder opens straight into the session.
- **Breathing circle.** One soft glow that breathes 4s in, 1s hold, 6s out, 1s rest, turning from soft white to warm peach as the sunrise gets pale. Built with React Native's Animated API on the native driver, no extra libraries.
- **Recorded meditation.** The session lasts as long as the recording. Tap the circle to pause or resume; while paused, a house icon leads home.
- **Warm closing.** When the meditation finishes, the circle dissolves into a warm gradient sky with one closing line, then it fades back home on its own.

## Built with

- React Native via Expo (SDK 58)
- `expo-audio` for audio playback
- `expo-notifications` for the daily reminder
- `expo-linear-gradient` for the warm closing sky
- `@expo/vector-icons` for the house icon
- `AsyncStorage` for saved reminder settings

## Running it locally

You'll need Node.js installed, and the Expo Go app on your phone.

```
git clone https://github.com/kimkukhwa/first-thought.git
cd first-thought
npm install
npx expo start
```

Scan the QR code with Expo Go on your phone and tap the breathing circle.


## Layout

```
App.js                  app state, reminder scheduling, screen changes
components/             Home, the breathing circle, the session and closing screens, the Fade transition
morningAudio.js         meditation playback
reminderNotification.js the daily reminder notification
reminderStorage.js      saving and loading reminder settings
time.js                 time formatting and part of the day
theme.js                colors and shared button styles
assets/audio/           the meditation track
docs/product.md         the product thinking behind the app
```


## Roadmap

- Choosing an intention and session length before starting
- Reminders on chosen weekdays only
- More than one meditation and soundtrack
- A wider set of intentions to choose from

---

A personal project, built and designed solo, with Claude cod support.
