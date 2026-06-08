import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

// One-shot sound effects (correct / wrong / complete).
// Players are created lazily and reused so playback is instant.

const SOURCES = {
  correct: require('../../assets/sounds/correct.wav'),
  wrong: require('../../assets/sounds/wrong.wav'),
  complete: require('../../assets/sounds/complete.wav'),
};

let audioModePromise = null;
const ensureSfxAudioMode = () => {
  if (!audioModePromise) {
    audioModePromise = setAudioModeAsync({ playsInSilentMode: true }).catch((error) => {
      audioModePromise = null;
      console.log('Error configuring sfx audio mode:', error);
    });
  }
  return audioModePromise;
};

const players = {};
const getPlayer = (name) => {
  if (!players[name]) {
    try {
      players[name] = createAudioPlayer(SOURCES[name]);
    } catch (error) {
      console.log('Error creating sfx player:', error);
      return null;
    }
  }
  return players[name];
};

export const playSfx = async (name) => {
  const source = SOURCES[name];
  if (!source) return;
  try {
    await ensureSfxAudioMode();
    const player = getPlayer(name);
    if (!player) return;
    player.seekTo(0);
    player.play();
  } catch (error) {
    console.log('Error playing sfx:', error);
  }
};
