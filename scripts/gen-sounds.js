// Generates small WAV sound effects for the app (no external assets needed).
// Run: node scripts/gen-sounds.js
const fs = require('fs');
const path = require('path');

const SR = 22050; // sample rate

// Render a list of {freq, start, dur, gain} notes into a 16-bit PCM mono WAV buffer.
function render(notes, totalDur) {
  const n = Math.floor(SR * totalDur);
  const data = new Float32Array(n);
  for (const note of notes) {
    const s0 = Math.floor(note.start * SR);
    const len = Math.floor(note.dur * SR);
    for (let i = 0; i < len; i++) {
      const t = i / SR;
      // simple ADSR-ish envelope: quick attack, smooth decay
      const env = Math.min(1, t / 0.01) * Math.exp(-3.2 * (t / note.dur));
      const sample = Math.sin(2 * Math.PI * note.freq * t) * env * (note.gain ?? 0.5);
      const idx = s0 + i;
      if (idx < n) data[idx] += sample;
    }
  }
  // soft clip
  for (let i = 0; i < n; i++) data[i] = Math.max(-1, Math.min(1, data[i]));
  return encodeWav(data);
}

function encodeWav(float32) {
  const n = float32.length;
  const buffer = Buffer.alloc(44 + n * 2);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + n * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SR, 24);
  buffer.writeUInt32LE(SR * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    buffer.writeInt16LE(Math.round(float32[i] * 32767), 44 + i * 2);
  }
  return buffer;
}

const NOTE = { C5: 523.25, E5: 659.25, G5: 783.99, C6: 1046.5, A4: 440, G4: 392, E4: 329.63 };

// Correct: cheerful two-note rising "ding-ding"
const correct = render([
  { freq: NOTE.E5, start: 0.0, dur: 0.16, gain: 0.5 },
  { freq: NOTE.C6, start: 0.12, dur: 0.28, gain: 0.5 },
], 0.45);

// Wrong: soft, gentle descending "boop" (not harsh)
const wrong = render([
  { freq: NOTE.A4, start: 0.0, dur: 0.18, gain: 0.4 },
  { freq: NOTE.E4, start: 0.14, dur: 0.26, gain: 0.4 },
], 0.45);

// Complete: little happy arpeggio
const complete = render([
  { freq: NOTE.C5, start: 0.0, dur: 0.18, gain: 0.45 },
  { freq: NOTE.E5, start: 0.13, dur: 0.18, gain: 0.45 },
  { freq: NOTE.G5, start: 0.26, dur: 0.18, gain: 0.45 },
  { freq: NOTE.C6, start: 0.39, dur: 0.42, gain: 0.5 },
], 0.9);

const outDir = path.join(__dirname, '..', 'assets', 'sounds');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'correct.wav'), correct);
fs.writeFileSync(path.join(outDir, 'wrong.wav'), wrong);
fs.writeFileSync(path.join(outDir, 'complete.wav'), complete);
console.log('Generated sounds in', outDir);
