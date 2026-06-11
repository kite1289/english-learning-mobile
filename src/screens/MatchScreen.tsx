import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { createAudioPlayer } from 'expo-audio';
import Mascot from '../components/Mascot';
import Pop from '../components/Pop';
import Confetti from '../components/Confetti';
import { PAL } from '../theme';
import { playSfx } from '../utils/sfx';
import { getCachedAssetUri } from '../utils/cache';
import { Word } from '../types';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Match'>;

interface MatchCard {
  key: string;
  type: 'audio' | 'image';
  word: Word;
}

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

export default function MatchScreen({ route, navigation }: Props) {
  const { topic, words, correct } = route.params;
  const insets = useSafeAreaInsets();

  const tColor = PAL[topic.color] || PAL.primary;
  const tColorDark = PAL[`${topic.color}Dark`] || PAL.primaryDark;

  // Determine number of pairs based on the word count chosen in CountScreen
  const pairCount = useMemo(() => {
    if (words.length <= 5) return 4;
    if (words.length <= 10) return 6;
    return 8;
  }, [words.length]);

  // Build a deck of Audio-to-Image pairs from the studied words
  const deck = useMemo(() => {
    // Select pairCount words (fall back if not enough words)
    const chosen = shuffle(words).slice(0, Math.min(words.length, pairCount));
    const cards: MatchCard[] = [];
    chosen.forEach((wd, p) => {
      // Audio card
      cards.push({ key: `${p}-audio`, type: 'audio', word: wd });
      // Image card
      cards.push({ key: `${p}-image`, type: 'image', word: wd });
    });
    return shuffle(cards);
  }, [words, pairCount]);

  const totalPairs = deck.length / 2;

  // State
  const [cachedDeck, setCachedDeck] = useState<MatchCard[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [matchedKeys, setMatchedKeys] = useState<string[]>([]);
  const [shakeMap, setShakeMap] = useState<Record<number, number>>({});
  const [busy, setBusy] = useState(false);
  
  const navigatedRef = useRef(false);

  // Cache deck images and audio offline
  useEffect(() => {
    const resolveDeck = async () => {
      const resolved = await Promise.all(
        deck.map(async (card) => {
          const updatedWord = { ...card.word };
          if (updatedWord.image_url) {
            const imgUri = await getCachedAssetUri(updatedWord.image_url);
            if (imgUri) updatedWord.image_url = imgUri;
          }
          if (updatedWord.audio_url) {
            const audUri = await getCachedAssetUri(updatedWord.audio_url);
            if (audUri) updatedWord.audio_url = audUri;
          }
          return { ...card, word: updatedWord };
        })
      );
      setCachedDeck(resolved);
      setLoadingAssets(false);
    };
    resolveDeck();
  }, [deck]);

  // Play audio for a word
  const playWordSound = async (audioUrl?: string | null, fallbackText?: string) => {
    if (!audioUrl) {
      if (fallbackText) {
        Speech.stop().catch(() => {});
        Speech.speak(fallbackText, { language: 'en-US', rate: 0.85 });
      }
      return;
    }
    try {
      const player = createAudioPlayer(audioUrl);
      player.play();
    } catch (err) {
      console.log('Error playing word audio in Match:', err);
      if (fallbackText) {
        Speech.stop().catch(() => {});
        Speech.speak(fallbackText, { language: 'en-US', rate: 0.85 });
      }
    }
  };

  const onTap = (i: number) => {
    const card = cachedDeck[i];
    if (busy || matchedKeys.includes(card.key)) return;

    // First card selected
    if (selectedIdx === null) {
      Haptics.selectionAsync().catch(() => {});
      setSelectedIdx(i);
      if (card.type === 'audio') {
        playWordSound(card.word.audio_url, card.word.word_en);
      }
      return;
    }

    const j = selectedIdx;
    const prevCard = cachedDeck[j];

    // Clicked same card -> deselect
    if (i === j) {
      setSelectedIdx(null);
      return;
    }

    // Tapped same type of card -> switch selection to new card
    if (prevCard.type === card.type) {
      Haptics.selectionAsync().catch(() => {});
      setSelectedIdx(i);
      if (card.type === 'audio') {
        playWordSound(card.word.audio_url, card.word.word_en);
      }
      return;
    }

    // Tapped different types -> check match!
    setBusy(true);
    if (card.type === 'audio') {
      playWordSound(card.word.audio_url, card.word.word_en);
    }

    const isMatch = prevCard.word.word_en === card.word.word_en;

    if (isMatch) {
      playSfx('correct');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setTimeout(() => {
        setMatchedKeys((m) => [...m, prevCard.key, card.key]);
        setSelectedIdx(null);
        setBusy(false);
      }, 550);
    } else {
      playSfx('wrong');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setTimeout(() => {
        setShakeMap((s) => ({ ...s, [j]: (s[j] || 0) + 1, [i]: (s[i] || 0) + 1 }));
        setSelectedIdx(null);
        setBusy(false);
      }, 850);
    }
  };

  // Celebrate and continue when everything is matched
  useEffect(() => {
    const allMatched = matchedKeys.length > 0 && matchedKeys.length === cachedDeck.length;
    if (allMatched && !navigatedRef.current) {
      navigatedRef.current = true;
      playSfx('complete');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const t = setTimeout(() => {
        navigation.navigate('Result', { topic, words, correct });
      }, 1800);
      return () => clearTimeout(t);
    }
  }, [matchedKeys, cachedDeck.length]);

  const matchedPairs = matchedKeys.length / 2;
  const done = matchedKeys.length === cachedDeck.length && cachedDeck.length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Confetti run={done} />
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} accessibilityLabel="Quay lại">
          <Text style={{ fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          {Array.from({ length: totalPairs }).map((_, i) => (
            <View key={i} style={[styles.progressDot, { backgroundColor: i < matchedPairs ? tColor : 'rgba(0,0,0,0.08)' }]} />
          ))}
        </View>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Tìm cặp giống nhau 🧩</Text>
        <Text style={styles.subtitle}>Bé nghe âm thanh và chọn hình con vật đúng nhé!</Text>
      </View>

      {loadingAssets ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={tColor} />
        </View>
      ) : (
        <View style={styles.grid}>
          {cachedDeck.map((card, i) => {
            const isSelected = selectedIdx === i;
            const isMatched = matchedKeys.includes(card.key);
            
            // Define background style
            let bg = PAL.surface;
            let borderColor = 'rgba(0,0,0,0.06)';
            let shadowColor = 'rgba(0,0,0,0.08)';

            if (isMatched) {
              bg = PAL.mint + '22';
              borderColor = PAL.mintDark;
              shadowColor = 'transparent';
            } else if (isSelected) {
              bg = tColor + '24';
              borderColor = tColorDark;
              shadowColor = tColorDark;
            } else if (card.type === 'audio') {
              bg = tColor;
              borderColor = tColorDark;
              shadowColor = tColorDark;
            }

            return (
              <Pop key={card.key} style={styles.cardWrap} popKey={isMatched ? 'm' : isSelected ? 's' : undefined} shakeKey={shakeMap[i]}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => onTap(i)}
                  disabled={isMatched || busy}
                  accessibilityLabel={card.type === 'audio' ? 'Loa phát âm' : card.word.word_en}
                  style={[
                    styles.card,
                    { backgroundColor: bg, borderColor, shadowColor },
                    isMatched && { opacity: 0.5 },
                  ]}
                >
                  {card.type === 'audio' ? (
                    // Audio Card
                    <View style={styles.audioCardContent}>
                      <Text style={[styles.cardBack, isMatched && { color: PAL.mintDark }]}>🔊</Text>
                      {isSelected && <Text style={styles.playingIndicator}>Đang chọn...</Text>}
                    </View>
                  ) : (
                    // Image Card (Always open/visible)
                    <View style={styles.imageCardContent}>
                      {card.word.image_url ? (
                        <Image source={{ uri: card.word.image_url }} style={styles.cardImg} resizeMode="contain" />
                      ) : (
                        <Text style={styles.cardEmoji}>{card.word.emoji || '❓'}</Text>
                      )}
                      {isMatched && <Text style={styles.cardLabel}>{card.word.word_en}</Text>}
                    </View>
                  )}
                </TouchableOpacity>
              </Pop>
            );
          })}
        </View>
      )}

      {done && (
        <View style={styles.doneBar}>
          <Mascot size={50} mood="wow" />
          <Text style={styles.doneText}>Bé nhớ giỏi quá! 🎉</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAL.bg },
  topBar: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' },
  progressContainer: { flex: 1, flexDirection: 'row', gap: 6 },
  progressDot: { flex: 1, height: 10, borderRadius: 5 },
  header: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: PAL.ink },
  subtitle: { fontSize: 14, color: PAL.ink, opacity: 0.55, marginTop: 2 },
  grid: {
    flex: 1, paddingHorizontal: 16, paddingTop: 12,
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'center', gap: 12,
  },
  cardWrap: { width: '22%', aspectRatio: 0.8 },
  card: {
    flex: 1, borderRadius: 18, borderWidth: 3,
    alignItems: 'center', justifyContent: 'center', padding: 4,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0,
  },
  audioCardContent: { alignItems: 'center', justifyContent: 'center' },
  imageCardContent: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  cardImg: { width: '90%', height: '70%' },
  cardEmoji: { fontSize: 36 },
  cardBack: { fontSize: 32, color: 'rgba(255,255,255,0.95)' },
  playingIndicator: { fontSize: 8, fontWeight: '700', color: PAL.ink, marginTop: 2 },
  cardLabel: { fontSize: 9, fontWeight: '700', color: PAL.ink, marginTop: 2, textAlign: 'center' },
  doneBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 22, paddingVertical: 16,
    backgroundColor: PAL.mint + '22', borderTopWidth: 2, borderTopColor: PAL.mintDark + '55',
  },
  doneText: { fontSize: 18, fontWeight: '700', color: PAL.mintDark },
});
