import { Outfit } from '../types';

// Mascot outfits the child can buy with coins. `id` drives extra SVG drawn in
// the Mascot component. Keep prices small so rewards feel reachable for kids.
export const OUTFITS: Outfit[] = [
  { id: 'none', name: 'Mặc định', emoji: '🐻', price: 0 },
  { id: 'party', name: 'Mũ tiệc', emoji: '🎉', price: 30 },
  { id: 'glasses', name: 'Kính mát', emoji: '🕶️', price: 50 },
  { id: 'headphones', name: 'Tai nghe', emoji: '🎧', price: 60 },
  { id: 'crown', name: 'Vương miện', emoji: '👑', price: 80 },
  { id: 'wizard', name: 'Mũ phù thủy', emoji: '🧙‍♂️', price: 100 },
  { id: 'cowboy', name: 'Mũ cao bồi', emoji: '🤠', price: 150 },
  { id: 'superhero', name: 'Siêu nhân', emoji: '🦸‍♂️', price: 200 },
];

export const getOutfit = (id: string): Outfit => 
  OUTFITS.find((o) => o.id === id) || OUTFITS[0];
