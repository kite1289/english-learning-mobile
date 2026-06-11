export interface Palette {
  bg: string;
  surface: string;
  ink: string;
  primary: string;
  primaryDark: string;
  coral: string;
  coralDark: string;
  mint: string;
  mintDark: string;
  lavender: string;
  lavenderDark: string;
  sky: string;
  skyDark: string;
  [key: string]: string; // Allow dynamic key lookup
}

export const PAL: Palette = {
  bg: '#FFF6E5',
  surface: '#FFFFFF',
  ink: '#2D2A4A',
  primary: '#FFC93C',
  primaryDark: '#E8A91A',
  coral: '#FF6B6B',
  coralDark: '#E04E4E',
  mint: '#4ECDC4',
  mintDark: '#3AAFA9',
  lavender: '#A78BFA',
  lavenderDark: '#8B6BE0',
  sky: '#5DADE2',
  skyDark: '#3A8FC7',
};

// Pick a readable text color (dark ink vs white) for a given background hex,
// based on perceived luminance. Light/saturated backgrounds (yellow, mint) get
// dark text so contrast meets accessibility for young readers + parents.
export const readableOn = (hex?: string | null): string => {
  if (!hex || hex[0] !== '#') return '#fff';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? PAL.ink : '#fff';
};
