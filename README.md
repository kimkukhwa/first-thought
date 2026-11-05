# First Thought

A morning meditation app built around a simple idea: the first thing you think when you wake up shapes the rest of your day, so you should choose it on purpose. 

Instead of being jolted awake by an alarm and reaching for your phone, First Thought wakes you gently, settles you with ambient sound, and walks you through a short guided meditation. You pick the feeling you want to carry into the day — calm, clear, confident, grounded — and spend a few minutes feeling it as if it has already happened. That feeling then guides how you think, act, and respond for the rest of the day.


## How it works

1. **Begin** — tap Begin, or tap the daily reminder notification
2. **Settle** — ambient sound fades in
3. **Meditate** — a guided session where you choose and inhabit your intention for the day, with a breathing circle over a slow sunrise
4. **Close** — the session ends and the day starts on your terms

## Current state — V2

- **No alarm.** A daily reminder notification at a time you pick (or none), plus a Begin button to start any time. Tapping the reminder opens straight into the session.
- **Breathing circle.** One soft glow that breathes 4s in, 1s hold, 6s out, 1s rest, turning from soft white to warm peach as the sunrise gets pale. Built with React Native's Animated API on the native driver, no extra libraries.
- **Recorded meditation.** The session lasts as long as the recording. Tap the circle to pause or resume; while paused, "home" leaves the session.
- **Soft transitions** between every screen, and a meditation screen with nothing on it but the breathing.

## Built with

- React Native via Expo (SDK 58)
- `expo-audio` for audio playback
- `expo-notifications` for the daily reminder
- `AsyncStorage` for saved reminder settings

## Running it locally

You'll need Node.js installed, and the Expo Go app on your phone.

```
git clone https://github.com/kimkukhwa/first-thought.git
cd first-thought
npm install
npx expo start
```

Scan the QR code with Expo Go on your phone and tap Begin.


## Layout

```
App.js                  app state, reminder scheduling, screen changes
components/             Home, the session screens, and the Fade transition
morningAudio.js         ambient and meditation playback, volume fades
reminderNotification.js the daily reminder notification
reminderStorage.js      saving and loading reminder settings
time.js                 time formatting
theme.js                colors and shared button styles
assets/audio/           ambient and meditation tracks
docs/product.md         the product thinking behind the app
```


## Roadmap

- Choosing an intention and session length before starting
- Reminders on chosen weekdays only
- More than one meditation and soundtrack
- A wider set of intentions to choose from

---

A personal project, built and designed solo, with Claude cod support.
