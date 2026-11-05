@AGENTS.md

# First Thought

## What this app is

First Thought is a morning meditation app. Instead of starting the day by checking the phone, the user spends a few quiet minutes with a short guided meditation, then chooses how they want to meet the day.

The session, started with **Begin** or by tapping the daily reminder:

1. The meditation screen opens right away: the voice starts and a soft ambient soundtrack fades in underneath, with a breathing circle over a slow sunrise.
2. Tapping the circle pauses everything; tapping it again resumes. While paused, a faint "home" in the top-left leaves the session.
3. When the recording ends, the ambient sound fades out, a short closing line shows, and the user starts their day. (Leaving early skips the closing.)

The experience should need almost no interaction. Full product notes live in `docs/product.md`. Read that file before making product or design decisions.

## Emotional tone (this matters in every screen, string, and sound)

The app must feel **calm, warm, human, grounded, simple, and non-cheesy**. It should feel like a calm person sitting beside you, not an app cheering at you.

- No forced positivity, no generic motivational language, no excessive spirituality.
- Never tell the user how they should feel. Help them choose their own intention.
- Wrong: "Today is going to be AMAZING! You can achieve anything!"
- Right: "You don't need to figure everything out today. For now, just notice that you're here."
- Sounds should create space rather than announce "this is meditation." Think morning light, not spa music.
- UI is minimal and clean. Prefer empty space, a small amount of text, and quiet colors. No badges, confetti, streaks, or exclamation marks.

## Tech stack

- **Expo SDK 58** (React Native 0.88, React 19.3). Always check the exact versioned docs at https://docs.expo.dev/versions/v58.0.0/ before writing code, because Expo APIs change between SDK versions. (Expo Go on iOS only runs the latest SDK, so the project follows it.)
- **JavaScript only.** No TypeScript.
- **Tested on a real iPhone using Expo Go.** Everything must run inside Expo Go with no custom native code and no development build.
- **Do not add libraries unless clearly needed.** When a library is genuinely needed, prefer the official `expo-*` package for it, and confirm it works inside Expo Go before adding it. Explain why the library is needed before installing it. Add or remove packages with `npx expo install` so versions stay matched to the SDK.
- Current dependencies: `expo`, `expo-status-bar`, `expo-audio`, `expo-asset` (required by expo-audio), `expo-notifications`, `@react-native-community/datetimepicker`, `@react-native-async-storage/async-storage`, `react`, `react-native`. Nothing else.
- `assets/audio/meditation.m4a` is the real recorded meditation; the session lasts as long as the recording. `ambient.wav` is still a placeholder.

## Scope: V2

V2 is these things, and only these:

1. **Begin.** A button on Home that starts the session right away.
2. **Daily reminder.** One repeating local notification at a time the user picks, with On/Off. Tapping it opens straight into the session. If the app is open when it fires, a quiet banner shows and nothing starts on its own. Permission is asked only the first time the reminder is switched on.
3. **The session.** The meditation recording with ambient sound underneath, then a short closing screen when the recording ends.
4. **Breathing circle.** A soft glow on the meditation screen breathing 4s in / 1s hold / 6s out / 1s rest over the v1 sunrise, turning from soft white to warm peach late in the session. Built with React Native's Animated (native driver), no extra libraries. Timing lives in the `BREATH` constant in `components/MeditationScreen.js`.
5. **Pause and leave.** Tap the circle to pause (sound, countdown and circle hold still, the circle dims, "paused" shows under it) and tap again to resume. While paused, a faint "home" top-left stops the audio and fades back to Home. Going to the background also pauses. No other buttons on the meditation screen.
6. **Polish.** Soft fades between screens.

There is **no alarm** anymore: no alarm sound, no keeping the screen awake overnight, no night screen.

Explicitly **out of scope**. Do not build, stub, or leave placeholders for any of these:

- Choosing an intention before the session, choosing the session length
- Reminders on certain weekdays only
- Multiple meditation themes or soundscapes
- A true system alarm
- AI-personalized meditations, mood history, sleep data, daily variation
- Accounts, settings screens, onboarding, analytics

If a task seems to need something from this list, stop and say so instead of building it.

## Working rules

- **Keep files small and simple.** One clear purpose per file. Prefer a few short files over one large one. Plain functions and plain React components; no clever abstractions.
- **Build only what the prompt asks for.** Never add extra features, screens, options, or "while I'm here" improvements. If something else seems necessary, mention it and wait.
- **Explain changes in plain language after each task.** The project owner is new to VS Code and React Native. After every task, list which files were created or changed and what each change does, in everyday words. Avoid jargon, or explain it the first time it is used.
- **Stay inside Expo Go.** Before using any API, confirm it works in Expo Go on iOS. If it does not, say so and propose the closest thing that does.
- **Check the Expo SDK 58 docs first.** Do not rely on memory of older Expo APIs (for example, `expo-av` has been replaced by `expo-audio`). Verify against the versioned docs linked above.
- **Do not change tone to be "friendlier."** Every string shown to the user follows the emotional tone section above.
- **Do not commit or push unless asked.**
