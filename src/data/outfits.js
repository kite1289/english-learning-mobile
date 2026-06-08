// Mascot outfits the child can buy with coins. `id` drives extra SVG drawn in
// the Mascot component. Keep prices small so rewards feel reachable for kids.
export const OUTFITS = [
  { id: 'none', name: 'Mặc định', emoji: '🐻', price: 0 },
  { id: 'party', name: 'Mũ tiệc', emoji: '🎉', price: 30 },
  { id: 'glasses', name: 'Kính mát', emoji: '🕶️', price: 50 },
  { id: 'crown', name: 'Vương miện', emoji: '👑', price: 80 },
];

export const getOutfit = (id) => OUTFITS.find((o) => o.id === id) || OUTFITS[0];
