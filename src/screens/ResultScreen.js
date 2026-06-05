import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Mascot from '../components/Mascot';
import { PAL } from '../theme';

export default function ResultScreen({ route, navigation }) {
  const { topic, words, correct } = route.params;
  const insets = useSafeAreaInsets();
  
  const total = words.length;
  const stars = correct === total ? 3 : correct >= Math.ceil(total * 0.7) ? 2 : correct >= Math.ceil(total * 0.4) ? 1 : 0;
  const score = correct * 10 + stars * 15;
  
  const [showStars, setShowStars] = useState(0);
  const [showScore, setShowScore] = useState(0);

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

  const messages = ['Cố lên nhé!', 'Khá lắm!', 'Tuyệt vời!', 'Siêu sao!'];

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <Mascot size={140} mood={stars > 0 ? 'happy' : 'sad'} />
        
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
            <Text style={[styles.statValue, { color: PAL.primary }]}>{showScore}</Text>
            <Text style={styles.statLabel}>Điểm</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: PAL.coral }]}>+1 🔥</Text>
            <Text style={styles.statLabel}>Chuỗi</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.btnPrimary, { backgroundColor: PAL[topic.color] || PAL.primary, borderBottomColor: PAL[`${topic.color}Dark`] || PAL.primaryDark }]}
          onPress={() => navigation.navigate('Topic')}
        >
          <Text style={styles.btnPrimaryText}>Học chủ đề khác 🚀</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.btnSecondary}
          onPress={() => navigation.navigate('Topic')}
        >
          <Text style={styles.btnSecondaryText}>Về trang chủ</Text>
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
