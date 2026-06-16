import { createAudioPlayer } from 'expo-audio';
import { applyPlaybackAudioMode } from './audioMode';

// One-shot sound effects (correct / wrong / complete).
// Players are created lazily and reused so playback is instant.

const SOURCES: Record<string, any> = {
  correct: require('../../assets/sounds/correct.wav'),
  wrong: require('../../assets/sounds/wrong.wav'),
  complete: require('../../assets/sounds/complete.wav'),
};

const players: Record<string, any> = {};
const getPlayer = (name: string): any => {
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

export const playSfx = async (name: string): Promise<void> => {
  const source = SOURCES[name];
  if (!source) return;
  try {
    await applyPlaybackAudioMode();
    const player = getPlayer(name);
    if (!player) return;
    player.seekTo(0);
    player.play();
  } catch (error) {
    console.log('Error playing sfx:', error);
  }
};
