@AGENTS.md

# First Thought

## What this app is

First Thought is a morning meditation app. Instead of starting the day by checking the phone, the user spends a few quiet minutes with a short guided meditation, then chooses how they want to meet the day.

Home is a greeting, one line, and a softly breathing circle with "begin" inside. The session, started by tapping that circle or the daily reminder:

1. The circle grows and moves up into the meditation: the meditation track starts (opening gong, voice and soft background music), with the breathing circle over a slow sunrise. No countdown, no buttons.
2. Tapping the circle pauses everything; tapping it again resumes. While paused, a house icon in the top-right leaves the session.
3. When the recording ends on its own, the circle dissolves, the sky warms into a gradient, and a closing line for the time of day shows, then the app returns home by itself. (Leaving early skips the closing.)

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
- Current dependencies: `expo`, `expo-status-bar`, `expo-audio`, `expo-asset` (required by expo-audio), `expo-notifications`, `expo-linear-gradient` (the closing gradient), `@expo/vector-icons` (the house icon) with `expo-font` (required by it), `@react-native-community/datetimepicker`, `@react-native-async-storage/async-storage`, `react`, `react-native`. Nothing else.
- `assets/audio/meditation.mp3` is the finished meditation (about 9:10): opening gong, voice, background music and closing gong are all in this one file. There is no separate ambient sound. The session lasts as long as the track, read from the file itself; never hard-code its length.

## Scope: v2.1

v2.1 is these things, and only these:

1. **Home: "the circle is the door".** A greeting by time of day ("good morning / afternoon / evening / night", from `partOfDay` in `time.js`), the line "Choose how you want to feel today and begin there.", and the breathing circle resting below the middle with "begin" inside. Tapping the circle starts the session: the words fade while the circle grows and moves up into its meditation spot. At the bottom, "reminder 7:00" with a warm dot (tap the dot to toggle, the time to change it).
2. **Daily reminder.** One repeating local notification at a time the user picks, with On/Off. Tapping it opens straight into the session. If the app is open when it fires, a quiet banner shows and nothing starts on its own. Permission is asked only the first time the reminder is switched on.
3. **The session.** The meditation track (gongs, voice and music in one file). It ends when the track ends. No countdown.
4. **Breathing circle.** `components/BreathingCircle.js`: a soft glow breathing 4s in / 1s hold / 6s out / 1s rest over the sunrise, turning from soft white to warm peach late in the session; a slow 16-second resting breath on Home. Built with React Native's Animated (native driver). Timing lives in the `BREATH` constant at the top of that file.
5. **Pause and leave.** Tap the circle to pause (sound and circle hold still, the circle dims, "paused" shows under it) and tap again to resume. While paused, a thin house icon top-right stops the audio and fades back to Home. Going to the background also pauses. No other buttons on the meditation screen.
6. **Warm closing.** Only after the recording finishes on its own: the circle dissolves, a warm gradient fades in, a line for the part of the day the session started shows, then it returns home by itself; a tap goes home sooner. Lines, colors and timings are at the top of `components/ClosingScreen.js`.
7. **Polish.** Soft fades between screens.

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
