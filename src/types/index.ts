export interface Topic {
  id: number | string;
  name_en: string;
  name_vi: string;
  emoji: string;
  color: string;
}

export interface Word {
  id: number | string;
  word_en: string;
  word_vi: string;
  emoji?: string;
  image_url?: string | null;
  audio_url?: string | null;
}

export interface Sticker {
  id: string;
  emoji: string;
  name: string;
}

export interface Outfit {
  id: string;
  name: string;
  emoji: string;
  price: number;
}

export interface Progress {
  coins: number;
  stickers: Sticker[];
  streak: number;
  lastPlayed: string | null;
  outfit: string;
  ownedOutfits: string[];
  placedStickers?: PlacedSticker[];
}

export interface PlacedSticker {
  id: string;
  emoji: string;
  x: number;
  y: number;
}
