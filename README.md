# First Thought

A morning meditation app built around a simple idea: the first thing you think when you wake up shapes the rest of your day, so you should choose it on purpose. 

Instead of being jolted awake by an alarm and reaching for your phone, First Thought wakes you gently, settles you with ambient sound, and walks you through a short guided meditation. You pick the feeling you want to carry into the day — calm, clear, confident, grounded — and spend a few minutes feeling it as if it has already happened. That feeling then guides how you think, act, and respond for the rest of the day.

## How it works

1. **Night** — set your wake time before bed
2. **Wake** — a gentle alarm instead of a jarring one
3. **Settle** — ambient sound to bridge sleep and waking
4. **Meditate** — a guided session where you choose and inhabit your intention for the day
5. **Close** — the session ends and the day starts on your terms

## Current state — v1.0

The full flow works end to end on a physical device. A few deliberate limits at this stage:

- **Meditation audio is a placeholder.** The recorded voice guidance is coming in the next version. `scripts/make-placeholder-audio.js` generates stand-in audio so the timing and flow can be tested.
- **No true system alarm yet.** The app runs in Expo Go and plays the sequence when left open in the foreground, with a local notification as backup. A real background alarm needs a development build and is planned for a later version.

## Built with

- React Native via Expo (SDK 57)
- `expo-av` for audio playback
- `expo-notifications` for the backup notification
- `AsyncStorage` for saved alarm settings

## Running it locally

You'll need Node.js installed, and the Expo Go app on your phone.

```
git clone https://github.com/kimkukhwa/first-thought.git
cd first-thought
npm install
npx expo start
```

Scan the QR code with Expo Go on your phone. Because the alarm sequence runs in the foreground, keep the app open and your screen unlocked overnight to test the full wake-up flow.

## Layout

```
App.js                  navigation and app state
components/             the five screens of the flow
morningAudio.js         audio sequencing and playback
alarmNotification.js    scheduling the backup notification
alarmStorage.js         saving and loading alarm settings
time.js                 time formatting and comparison
theme.js                colors, spacing, typography
assets/audio/           alarm, ambient, and meditation tracks
docs/product.md         the product thinking behind the app
```

## Roadmap

- Recorded meditation voice guidance
- A real background alarm via a development build
- More than one meditation and soundtrack
- A wider set of intentions to choose from

---

A personal project, built and designed solo, with Claude cod support.
