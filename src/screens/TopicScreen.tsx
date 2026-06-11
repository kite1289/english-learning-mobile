import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Mascot from '../components/Mascot';
import { PAL, readableOn } from '../theme';
import { getTopics } from '../api/client';
import { useProgress } from '../context/ProgressContext';
import { Topic } from '../types';
import { RootStackParamList } from '../../App';
import * as Haptics from 'expo-haptics';
import { playSfx } from '../utils/sfx';

type Props = NativeStackScreenProps<RootStackParamList, 'Topic'>;

export default function TopicScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { streak, coins, outfit, dailyQuests, claimQuestReward } = useProgress();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTopics().then(data => {
      setTopics(data);
      setLoading(false);
    }).catch(err => {
      console.log('Error fetching topics:', err);
      setLoading(false);
    });
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Mascot size={48} outfit={outfit} />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.greetingText}>Xin chào, Bé!</Text>
            <Text style={styles.titleText}>Học gì hôm nay? ✨</Text>
          </View>
        </View>
        <View style={styles.badgeRow}>
          <View style={styles.fireBadge}>
            <Text style={{ fontSize: 18 }}>🔥</Text>
            <Text style={styles.fireText}>{streak}</Text>
          </View>
          <TouchableOpacity
            style={[styles.fireBadge, styles.bagBadge]}
            onPress={() => navigation.navigate('Collection')}
            accessibilityLabel="Bộ sưu tập"
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 18 }}>🎒</Text>
            <Text style={styles.fireText}>{coins}</Text>
            <Text style={{ fontSize: 14 }}>🪙</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={PAL.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          {/* --- Daily Quests Card --- */}
          {dailyQuests && (
            <View style={styles.questsCard}>
              <Text style={styles.questsHeader}>Nhiệm vụ hôm nay 🎯</Text>
              
              {(Object.keys(dailyQuests) as Array<keyof typeof dailyQuests>).map((key) => {
                const quest = dailyQuests[key];
                const isCompleted = quest.current >= quest.target;
                const isClaimed = quest.claimed;
                
                let emoji = '⭐️';
                if (key === 'lessons') emoji = '📖';
                if (key === 'perfect') emoji = '🏆';
                if (key === 'streak') emoji = '🔥';
                
                return (
                  <View key={quest.id} style={styles.questItem}>
                    <View style={styles.questIconContainer}>
                      <Text style={styles.questIcon}>{emoji}</Text>
                    </View>
                    
                    <View style={styles.questInfo}>
                      <Text style={styles.questTitle}>{quest.title}</Text>
                      
                      {/* Progress bar */}
                      <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { width: `${(quest.current / quest.target) * 100}%` }]} />
                        <Text style={styles.progressText}>
                          {quest.current}/{quest.target}
                        </Text>
                      </View>
                    </View>
                    
                    {isClaimed ? (
                      <View style={styles.btnClaimed}>
                        <Text style={styles.btnClaimedText}>Đã nhận ✓</Text>
                      </View>
                    ) : isCompleted ? (
                      <TouchableOpacity
                        style={styles.btnClaim}
                        onPress={() => {
                          claimQuestReward(key);
                          playSfx('correct');
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                        }}
                      >
                        <Text style={styles.btnClaimText}>Nhận 🎁</Text>
                        <Text style={styles.btnRewardText}>+{quest.rewardCoins}🪙</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.btnLocked}>
                        <Text style={styles.btnLockedText}>+{quest.rewardCoins} xu</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.subtitleContainer}>
            <Text style={styles.sectionTitle}>Chọn chủ đề</Text>
            <Text style={styles.sectionSubtitle}>Bé thích học gì nào?</Text>
          </View>

          <View style={styles.grid}>
            {topics.map((t, i) => {
              const cardBg = t.color ? PAL[t.color] : PAL.primary;
              const textColor = readableOn(cardBg);
              return (
                <TouchableOpacity
                  key={t.id}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('Count', { topic: t })}
                  style={[
                    styles.topicCard,
                    {
                      backgroundColor: cardBg,
                      transform: [{ rotate: i % 2 === 0 ? '-1deg' : '1deg' }],
                      shadowColor: t.color ? PAL[`${t.color}Dark`] : PAL.primaryDark,
                    }
                  ]}
                >
                  <View style={styles.cardBgDeco1} />
                  <View style={styles.cardBgDeco2} />
                  <Text style={styles.emojiText}>{t.emoji}</Text>
                  <View>
                    <Text style={[styles.cardEn, { color: textColor }]}>{t.name_en}</Text>
                    <Text style={[styles.cardVi, { color: textColor, opacity: 0.75 }]}>{t.name_vi}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAL.bg },
  header: {
    paddingHorizontal: 22, paddingTop: 18,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  greetingText: { fontSize: 13, color: PAL.ink, opacity: 0.6, fontWeight: '600' },
  titleText: { fontSize: 18, color: PAL.ink, fontWeight: '700' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fireBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999, backgroundColor: PAL.surface,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 0,
  },
  bagBadge: { backgroundColor: PAL.primary + '33' },
  fireText: { fontSize: 16, color: PAL.ink, fontWeight: '700' },
  subtitleContainer: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 14 },
  sectionTitle: { fontSize: 32, color: PAL.ink, fontWeight: '700' },
  sectionSubtitle: { fontSize: 15, color: PAL.ink, opacity: 0.6, marginTop: 4 },
  grid: {
    paddingHorizontal: 18, paddingBottom: 24,
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
  },
  topicCard: {
    width: '47%', borderRadius: 28, padding: 16,
    minHeight: 168, justifyContent: 'space-between',
    marginBottom: 14, overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 0,
  },
  cardBgDeco1: {
    position: 'absolute', top: -16, right: -16,
    width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.22)'
  },
  cardBgDeco2: {
    position: 'absolute', bottom: -22, left: -10,
    width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.14)'
  },
  emojiText: { fontSize: 56, lineHeight: 65 },
  cardEn: { fontSize: 22, color: '#fff', fontWeight: '700' },
  cardVi: { fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  
  // Daily Quests styles
  questsCard: {
    marginHorizontal: 22,
    marginTop: 18,
    backgroundColor: PAL.surface,
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  questsHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: PAL.ink,
    marginBottom: 10,
  },
  questItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    gap: 10,
  },
  questIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questIcon: {
    fontSize: 18,
  },
  questInfo: {
    flex: 1,
  },
  questTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: PAL.ink,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 14,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 7,
    marginTop: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    backgroundColor: PAL.mint,
    borderRadius: 7,
  },
  progressText: {
    position: 'absolute',
    right: 8,
    fontSize: 9,
    fontWeight: '800',
    color: PAL.ink,
  },
  btnClaim: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: PAL.primary,
    borderBottomWidth: 3,
    borderBottomColor: PAL.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 74,
  },
  btnClaimText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  btnRewardText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  btnClaimed: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 74,
  },
  btnClaimedText: {
    fontSize: 10,
    fontWeight: '700',
    color: PAL.ink,
    opacity: 0.4,
  },
  btnLocked: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 74,
  },
  btnLockedText: {
    fontSize: 10,
    fontWeight: '700',
    color: PAL.ink,
    opacity: 0.4,
  },
});
