// One-off script: generates placeholder audio files in assets/audio.
// Run with:  node scripts/make-placeholder-audio.js
// To use real audio later, just replace the files with the same names
// (alarm.wav and ambient.wav). Nothing in the app depends on this script.

const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const OUT_DIR = path.join(__dirname, '..', 'assets', 'audio');

// ---------- WAV writing ----------

// samples: array of numbers between -1 and 1 (mono).
function writeWav(filePath, samples, sampleRate = SAMPLE_RATE) {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // fmt chunk size
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * bytesPerSample, 28); // byte rate
  buffer.writeUInt16LE(bytesPerSample, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * bytesPerSample);
  }

  fs.writeFileSync(filePath, buffer);
}

// ---------- Sound helpers ----------

function seconds(n) {
  return Math.round(n * SAMPLE_RATE);
}

// A soft chime: a single note with a few gentle overtones that rings and decays.
function chimeNote(frequency, lengthSec) {
  const out = new Array(seconds(lengthSec));
  for (let i = 0; i < out.length; i++) {
    const t = i / SAMPLE_RATE;
    const decay = Math.exp(-t * 1.6); // rings out gently
    const attack = Math.min(1, t / 0.02); // tiny attack so there is no click
    const tone =
      Math.sin(2 * Math.PI * frequency * t) * 1.0 +
      Math.sin(2 * Math.PI * frequency * 2 * t) * 0.25 +
      Math.sin(2 * Math.PI * frequency * 3 * t) * 0.08;
    out[i] = tone * decay * attack * 0.35;
  }
  return out;
}

// ---------- alarm.wav ----------
// A three-second phrase of two soft notes, repeated for 30 seconds,
// fading in over the first 10 seconds.

function makeAlarm() {
  const phraseSec = 3;
  const totalSec = 30;
  const fadeInSec = 10;

  const phrase = new Array(seconds(phraseSec)).fill(0);
  const noteA = chimeNote(523.25, 2.5); // C5
  const noteB = chimeNote(659.25, 2.0); // E5, starts a bit later
  for (let i = 0; i < noteA.length; i++) phrase[i] += noteA[i];
  const offsetB = seconds(0.9);
  for (let i = 0; i < noteB.length && offsetB + i < phrase.length; i++) {
    phrase[offsetB + i] += noteB[i] * 0.8;
  }

  const samples = new Array(seconds(totalSec));
  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE;
    const fade = Math.min(1, t / fadeInSec);
    samples[i] = phrase[i % phrase.length] * fade;
  }
  return samples;
}

// ---------- ambient.wav ----------
// A very low, quiet hum: two close low tones that slowly drift against
// each other, with a slow breathing swell so it never feels static.

function makeAmbient() {
  const totalSec = 60;
  const samples = new Array(seconds(totalSec));
  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE;
    const swell = 0.85 + 0.15 * Math.sin(2 * Math.PI * t / 12); // 12-second breath
    const hum =
      Math.sin(2 * Math.PI * 55 * t) * 0.5 + // A1
      Math.sin(2 * Math.PI * 55.4 * t) * 0.5 + // slightly detuned, gentle beating
      Math.sin(2 * Math.PI * 110 * t) * 0.15; // faint octave above
    // Short fades at each end so the loop point is silent and click-free.
    const edge = Math.min(1, t / 0.5, (totalSec - t) / 0.5);
    samples[i] = hum * swell * edge * 0.12;
  }
  return samples;
}

// ---------- meditation.wav ----------
// Ten minutes of silence, standing in for the real voice recording.
// Uses a low sample rate so the placeholder file stays small.

const SILENCE_SAMPLE_RATE = 8000;

function makeMeditationSilence() {
  const totalSec = 10 * 60;
  return new Array(totalSec * SILENCE_SAMPLE_RATE).fill(0);
}

// ---------- Run ----------

fs.mkdirSync(OUT_DIR, { recursive: true });
writeWav(path.join(OUT_DIR, 'alarm.wav'), makeAlarm());
writeWav(path.join(OUT_DIR, 'ambient.wav'), makeAmbient());
writeWav(path.join(OUT_DIR, 'meditation.wav'), makeMeditationSilence(), SILENCE_SAMPLE_RATE);
console.log('Wrote alarm.wav, ambient.wav and meditation.wav to', OUT_DIR);
