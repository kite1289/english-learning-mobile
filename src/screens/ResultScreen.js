import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Mascot from '../components/Mascot';
import Confetti from '../components/Confetti';
import Pop from '../components/Pop';
import { PAL } from '../theme';
import { playSfx } from '../utils/sfx';
import { useProgress } from '../context/ProgressContext';

export default function ResultScreen({ route, navigation }) {
  const { topic, words, correct } = route.params;
  const insets = useSafeAreaInsets();
  const { coins, outfit, completeLesson } = useProgress();

  const total = words.length;
  // Completing a lesson always earns at least 1 star — finishing should never
  // feel like a punishment (consistent with the "retry, no penalty" quiz).
  const stars = correct === total ? 3 : correct >= Math.ceil(total * 0.6) ? 2 : 1;
  const score = correct * 10 + stars * 15;

  const [showStars, setShowStars] = useState(0);
  const [showScore, setShowScore] = useState(0);
  const [reward, setReward] = useState(null); // { coinsEarned, newSticker, streak }
  const awardedRef = useRef(false);

  useEffect(() => {
    playSfx('complete');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (!awardedRef.current) {
      awardedRef.current = true;
      setReward(completeLesson({ topic, stars, score }));
    }
  }, []);

  useEffect(() => {
    let s = 0;
    const t1 = setInterval(() => {
      s++;
      setShowStars(prev => Math.min(s, stars));
      if (s >= stars) clearInterval(t1);
    }, 380);

    let n = 0;
    const t2 = setInterval(() => {
      n += Math.max(1, Math.floor(score / 30));
      if (n >= score) {
        n = score;
        clearInterval(t2);
      }
      setShowScore(n);
    }, 35);

    return () => { clearInterval(t1); clearInterval(t2); };
  }, [stars, score]);

  const messages = { 1: 'Hoàn thành rồi! 🌟', 2: 'Giỏi lắm! 🎉', 3: 'Siêu sao! 🏆' };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Confetti run />
      <View style={styles.content}>
        <Mascot size={140} mood={stars === 3 ? 'wow' : 'happy'} outfit={outfit} />

        <Text style={styles.title}>{messages[stars]}</Text>
        <Text style={styles.subtitle}>Bé hoàn thành chủ đề {topic.name_vi.toLowerCase()}!</Text>

        <View style={styles.starsContainer}>
          {[1,2,3].map(s => (
            <Text key={s} style={[
              styles.star,
              { opacity: s <= showStars ? 1 : 0.25 }
            ]}>
              ⭐
            </Text>
          ))}
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: PAL.mint }]}>{correct}/{total}</Text>
            <Text style={styles.statLabel}>Đúng</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: PAL.primary }]}>+{showScore} 🪙</Text>
            <Text style={styles.statLabel}>Xu thưởng</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: PAL.coral }]}>{reward?.streak ?? '–'} 🔥</Text>
            <Text style={styles.statLabel}>Chuỗi ngày</Text>
          </View>
        </View>

        {reward?.newSticker && (
          <Pop entrance popKey="sticker" style={styles.stickerCard}>
            <Text style={styles.stickerEmoji}>{reward.newSticker.emoji}</Text>
            <View>
              <Text style={styles.stickerTitle}>Bé nhận được sticker mới!</Text>
              <Text style={styles.stickerName}>{reward.newSticker.name}</Text>
            </View>
          </Pop>
        )}

        <Text style={styles.coinTotal}>Tổng số xu: {coins} 🪙</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btnPrimary, { backgroundColor: PAL[topic.color] || PAL.primary, borderBottomColor: PAL[`${topic.color}Dark`] || PAL.primaryDark }]}
          onPress={() => navigation.navigate('Topic')}
        >
          <Text style={styles.btnPrimaryText}>Học chủ đề khác 🚀</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAL.bg },
  content: { flex: 1, alignItems: 'center', paddingTop: 36, paddingHorizontal: 24 },
  title: { fontSize: 36, fontWeight: '700', color: PAL.ink, marginTop: 12 },
  subtitle: { fontSize: 15, fontWeight: '600', color: PAL.ink, opacity: 0.65, marginTop: 4 },
  starsContainer: { flexDirection: 'row', gap: 10, marginTop: 22 },
  star: { fontSize: 56 },
  statsCard: {
    marginTop: 26, width: '100%', backgroundColor: PAL.surface, borderRadius: 28,
    paddingVertical: 18, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-around',
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.04, shadowRadius: 24,
  },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 12, fontWeight: '600', color: '#666' },
  divider: { width: 1, backgroundColor: 'rgba(0,0,0,0.08)' },
  stickerCard: {
    marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: PAL.surface, borderRadius: 22, paddingVertical: 14, paddingHorizontal: 18,
    borderWidth: 2, borderColor: PAL.mint,
  },
  stickerEmoji: { fontSize: 44 },
  stickerTitle: { fontSize: 15, fontWeight: '700', color: PAL.ink },
  stickerName: { fontSize: 13, fontWeight: '600', color: PAL.ink, opacity: 0.6 },
  coinTotal: { marginTop: 16, fontSize: 14, fontWeight: '700', color: PAL.ink, opacity: 0.6 },
  footer: { paddingHorizontal: 22, paddingBottom: 18, gap: 10 },
  btnPrimary: {
    width: '100%', borderRadius: 22, paddingVertical: 18,
    alignItems: 'center', borderBottomWidth: 5,
  },
  btnPrimaryText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  btnSecondary: {
    width: '100%', borderRadius: 22, paddingVertical: 18,
    alignItems: 'center', backgroundColor: PAL.surface, borderBottomWidth: 5, borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  btnSecondaryText: { fontSize: 20, fontWeight: '700', color: PAL.ink },
});
