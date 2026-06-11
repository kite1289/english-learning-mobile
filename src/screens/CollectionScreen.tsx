import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, PanResponder, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import Mascot from '../components/Mascot';
import Pop from '../components/Pop';
import { PAL } from '../theme';
import { OUTFITS } from '../data/outfits';
import { useProgress } from '../context/ProgressContext';
import { playSfx } from '../utils/sfx';
import { Outfit, PlacedSticker } from '../types';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Collection'>;

const { width: screenWidth } = Dimensions.get('window');
const BOARD_WIDTH = screenWidth - 44;
const BOARD_HEIGHT = 200;

interface ThemeItem {
  id: string;
  name: string;
  emoji: string;
  price: number;
}

const THEMES: ThemeItem[] = [
  { id: 'garden', name: 'Khu vườn', emoji: '🏡', price: 0 },
  { id: 'ocean', name: 'Đại dương', emoji: '🌊', price: 50 },
  { id: 'space', name: 'Vũ trụ', emoji: '🚀', price: 100 },
  { id: 'candy', name: 'Kẹo ngọt', emoji: '🍬', price: 80 },
];

interface DraggableStickerProps {
  sticker: PlacedSticker;
  onDragStart: () => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onRemove: (id: string) => void;
}

const DraggableSticker = ({ sticker, onDragStart, onDragEnd, onRemove }: DraggableStickerProps) => {
  const pan = useRef(new Animated.ValueXY({ x: sticker.x, y: sticker.y })).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        onDragStart();
        pan.setOffset({
          // @ts-ignore
          x: pan.x._value,
          // @ts-ignore
          y: pan.y._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
        // @ts-ignore
        let finalX = pan.x._value;
        // @ts-ignore
        let finalY = pan.y._value;

        // Clamp inside board boundaries (sticker size is approx 50x50)
        finalX = Math.max(0, Math.min(finalX, BOARD_WIDTH - 50));
        finalY = Math.max(0, Math.min(finalY, BOARD_HEIGHT - 50));

        pan.setValue({ x: finalX, y: finalY });
        onDragEnd(sticker.id, finalX, finalY);
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.draggableWrap,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <Text style={styles.draggableEmoji}>{sticker.emoji}</Text>
      <TouchableOpacity style={styles.removeBadge} onPress={() => onRemove(sticker.id)}>
        <Text style={styles.removeText}>×</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function CollectionScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const progressState = useProgress();
  const { 
    coins, 
    stickers = [], 
    outfit, 
    ownedOutfits = ['none'], 
    placedStickers = [], 
    buyOutfit, 
    equipOutfit, 
    persist,
    activeTheme = 'garden',
    ownedThemes = ['garden'],
    buyTheme,
    equipTheme
  } = progressState;

  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'outfits' | 'stickers' | 'themes'>('outfits');

  const onPressOutfit = (o: Outfit) => {
    if (o.id === outfit) return;
    if (ownedOutfits.includes(o.id)) {
      equipOutfit(o.id);
      Haptics.selectionAsync().catch(() => {});
      return;
    }
    if (coins >= o.price) {
      if (buyOutfit(o)) {
        playSfx('correct');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
  };

  // Add sticker to the canvas board
  const addStickerToBoard = (emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const newPlaced: PlacedSticker = {
      id: `placed-${Date.now()}-${Math.random()}`,
      emoji,
      x: BOARD_WIDTH / 2 - 25,
      y: BOARD_HEIGHT / 2 - 25,
    };

    const updated = [...placedStickers, newPlaced];
    savePlacedStickers(updated);
  };

  // Update position after drag
  const onStickerDragEnd = (id: string, x: number, y: number) => {
    setScrollEnabled(true);
    const updated = placedStickers.map((s) => (s.id === id ? { ...s, x, y } : s));
    savePlacedStickers(updated);
  };

  // Remove sticker from board
  const removeStickerFromBoard = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const updated = placedStickers.filter((s) => s.id !== id);
    savePlacedStickers(updated);
  };

  // Clear all stickers from board
  const clearBoard = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    savePlacedStickers([]);
  };

  const savePlacedStickers = (updated: PlacedSticker[]) => {
    persist({
      ...progressState,
      placedStickers: updated,
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} accessibilityLabel="Quay lại">
          <Text style={{ fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bộ sưu tập</Text>
        <View style={styles.coinBadge}>
          <Text style={{ fontSize: 18 }}>🪙</Text>
          <Text style={styles.coinText}>{coins}</Text>
        </View>
      </View>

      <ScrollView scrollEnabled={scrollEnabled} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={styles.previewCard}>
          <Mascot size={120} mood="happy" outfit={outfit} />
          <Text style={styles.previewName}>Bạn Gấu của bé</Text>
        </View>

        {/* --- Sticker Board Canvas --- */}
        <Text style={styles.sectionTitle}>Tranh dán sticker của bé 🎨</Text>
        <View style={styles.boardContainer}>
          <View style={[
            styles.stickerBoard,
            activeTheme === 'ocean' && styles.bgOcean,
            activeTheme === 'space' && styles.bgSpace,
            activeTheme === 'candy' && styles.bgCandy,
          ]}>
            {/* Sky Background Decor */}
            {activeTheme === 'garden' && (
              <>
                <View style={styles.skyCloud} />
                <View style={styles.grassGround} />
              </>
            )}

            {/* Ocean Decor */}
            {activeTheme === 'ocean' && (
              <>
                <View style={[styles.bubble, { left: 40, top: 30 }]} />
                <View style={[styles.bubble, { left: 180, top: 50 }]} />
                <View style={[styles.bubble, { left: 100, top: 90 }]} />
                <View style={[styles.bubble, { left: 240, top: 110 }]} />
                <View style={styles.oceanFloor} />
              </>
            )}

            {/* Space Decor */}
            {activeTheme === 'space' && (
              <>
                <View style={[styles.starSpace, { left: 50, top: 30 }]} />
                <View style={[styles.starSpace, { left: 190, top: 40 }]} />
                <View style={[styles.starSpace, { left: 100, top: 80 }]} />
                <View style={[styles.starSpace, { left: 260, top: 120 }]} />
                <View style={styles.planet} />
              </>
            )}

            {/* Candy Decor */}
            {activeTheme === 'candy' && (
              <>
                <View style={[styles.marshmallow, { left: 35, top: 30 }]} />
                <View style={[styles.marshmallow, { left: 210, top: 45 }]} />
                <View style={styles.candyFloor} />
              </>
            )}

            {placedStickers.length === 0 && (
              <View style={styles.boardPlaceholder}>
                <Text style={[
                  styles.placeholderText,
                  activeTheme === 'ocean' && { color: '#EAF2F8' },
                  activeTheme === 'space' && { color: '#EAECEE' },
                  activeTheme === 'candy' && { color: '#78281F' },
                ]}>Bấm sticker của bé bên dưới{'\n'}để dán lên bức tranh này nhé! 🐻🌴</Text>
              </View>
            )}

            {placedStickers.map((s) => (
              <DraggableSticker
                key={s.id}
                sticker={s}
                onDragStart={() => setScrollEnabled(false)}
                onDragEnd={onStickerDragEnd}
                onRemove={removeStickerFromBoard}
              />
            ))}
          </View>
          {placedStickers.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={clearBoard}>
              <Text style={styles.clearBtnText}>Xóa tất cả 🧹</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* --- Tab Selector --- */}
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'outfits' && styles.activeTabItem]} 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setActiveTab('outfits');
            }}
          >
            <Text style={[styles.tabText, activeTab === 'outfits' && styles.activeTabText]}>Trang phục 👕</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'stickers' && styles.activeTabItem]} 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setActiveTab('stickers');
            }}
          >
            <Text style={[styles.tabText, activeTab === 'stickers' && styles.activeTabText]}>Sticker ⭐</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'themes' && styles.activeTabItem]} 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setActiveTab('themes');
            }}
          >
            <Text style={[styles.tabText, activeTab === 'themes' && styles.activeTabText]}>Hình nền 🖼️</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'outfits' && (
          <View style={styles.outfitGrid}>
            {OUTFITS.map((o) => {
              const owned = ownedOutfits.includes(o.id);
              const equipped = o.id === outfit;
              const affordable = coins >= o.price;

              let label = `${o.price} 🪙`;
              let btnStyle: any = styles.btnBuy;
              if (equipped) { label = 'Đang dùng'; btnStyle = styles.btnEquipped; }
              else if (owned) { label = 'Dùng'; btnStyle = styles.btnUse; }
              else if (!affordable) { btnStyle = styles.btnLocked; }

              return (
                <Pop key={o.id} style={styles.outfitCard} popKey={equipped ? 'eq' : undefined}>
                  <View style={[styles.outfitPreview, equipped && { borderColor: PAL.mintDark }]}>
                    <Mascot size={60} mood="happy" outfit={o.id} />
                  </View>
                  <Text style={styles.outfitName}>{o.name}</Text>
                  <TouchableOpacity
                    style={[styles.outfitBtn, btnStyle]}
                    onPress={() => onPressOutfit(o)}
                    disabled={equipped}
                    accessibilityLabel={`${o.name} ${label}`}
                  >
                    <Text style={[styles.outfitBtnText, (equipped || (!owned && !affordable)) && { color: PAL.ink, opacity: 0.5 }]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                </Pop>
              );
            })}
          </View>
        )}

        {activeTab === 'stickers' && (
          stickers.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Chưa có sticker nào.{'\n'}Học xong bài để nhận sticker nhé! 🎁</Text>
            </View>
          ) : (
            <View style={styles.stickerGrid}>
              {stickers.map((s, i) => (
                <TouchableOpacity key={s.id || i} style={styles.stickerTile} onPress={() => addStickerToBoard(s.emoji)}>
                  <Text style={styles.stickerEmoji}>{s.emoji}</Text>
                  <Text style={styles.stickerName} numberOfLines={1}>{s.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )
        )}

        {activeTab === 'themes' && (
          <View style={styles.outfitGrid}>
            {THEMES.map((t) => {
              const owned = ownedThemes.includes(t.id);
              const equipped = t.id === activeTheme;
              const affordable = coins >= t.price;

              let label = `${t.price} 🪙`;
              let btnStyle: any = styles.btnBuy;
              if (equipped) { label = 'Đang dùng'; btnStyle = styles.btnEquipped; }
              else if (owned) { label = 'Dùng'; btnStyle = styles.btnUse; }
              else if (!affordable) { btnStyle = styles.btnLocked; }

              return (
                <Pop key={t.id} style={styles.outfitCard} popKey={equipped ? 'eq' : undefined}>
                  <View style={[
                    styles.themePreview,
                    t.id === 'garden' && { backgroundColor: '#AED6F1' },
                    t.id === 'ocean' && { backgroundColor: '#1F618D' },
                    t.id === 'space' && { backgroundColor: '#1B2631' },
                    t.id === 'candy' && { backgroundColor: '#FADBD8' },
                    equipped && { borderColor: PAL.mintDark }
                  ]}>
                    <Text style={{ fontSize: 32 }}>{t.emoji}</Text>
                  </View>
                  <Text style={styles.outfitName}>{t.name}</Text>
                  <TouchableOpacity
                    style={[styles.outfitBtn, btnStyle]}
                    onPress={() => {
                      if (equipped) return;
                      if (owned) {
                        equipTheme(t.id);
                        Haptics.selectionAsync().catch(() => {});
                      } else if (coins >= t.price) {
                        if (buyTheme(t.id, t.price)) {
                          playSfx('correct');
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                        }
                      } else {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
                      }
                    }}
                    disabled={equipped}
                    accessibilityLabel={`${t.name} ${label}`}
                  >
                    <Text style={[styles.outfitBtnText, (equipped || (!owned && !affordable)) && { color: PAL.ink, opacity: 0.5 }]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                </Pop>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAL.bg },
  topBar: {
    paddingHorizontal: 18, paddingTop: 18, paddingBottom: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: PAL.ink },
  coinBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: PAL.surface,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  coinText: { fontSize: 16, fontWeight: '700', color: PAL.ink },
  previewCard: {
    alignItems: 'center', marginHorizontal: 22, marginTop: 8, paddingVertical: 20,
    backgroundColor: PAL.surface, borderRadius: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 16,
  },
  previewName: { fontSize: 15, fontWeight: '700', color: PAL.ink, opacity: 0.6, marginTop: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: PAL.ink, paddingHorizontal: 22, marginTop: 24, marginBottom: 12 },
  outfitGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 18 },
  outfitCard: { width: '47%', alignItems: 'center', backgroundColor: PAL.surface, borderRadius: 22, paddingVertical: 14, marginBottom: 14 },
  outfitPreview: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: PAL.bg,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent',
  },
  outfitName: { fontSize: 15, fontWeight: '700', color: PAL.ink, marginTop: 8 },
  outfitBtn: { marginTop: 8, paddingVertical: 8, paddingHorizontal: 20, borderRadius: 14, minWidth: 96, alignItems: 'center' },
  outfitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  btnBuy: { backgroundColor: PAL.primary, borderBottomWidth: 3, borderBottomColor: PAL.primaryDark },
  btnUse: { backgroundColor: PAL.mint, borderBottomWidth: 3, borderBottomColor: PAL.mintDark },
  btnEquipped: { backgroundColor: 'rgba(0,0,0,0.06)' },
  btnLocked: { backgroundColor: 'rgba(0,0,0,0.06)' },
  emptyBox: { marginHorizontal: 22, paddingVertical: 28, alignItems: 'center', backgroundColor: PAL.surface, borderRadius: 22 },
  emptyText: { fontSize: 14, fontWeight: '600', color: PAL.ink, opacity: 0.5, textAlign: 'center', lineHeight: 22 },
  stickerGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 18, gap: 12 },
  stickerTile: {
    width: '29%', aspectRatio: 0.9, backgroundColor: PAL.surface, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', padding: 6,
  },
  stickerEmoji: { fontSize: 40 },
  stickerName: { fontSize: 11, fontWeight: '600', color: PAL.ink, opacity: 0.6, marginTop: 2 },
  
  // Sticker Board styles
  boardContainer: { marginHorizontal: 22, alignItems: 'flex-end', gap: 8 },
  stickerBoard: {
    width: '100%',
    height: BOARD_HEIGHT,
    backgroundColor: '#AED6F1', // Sky blue
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#7FB3D5',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  skyCloud: {
    position: 'absolute',
    top: 20,
    left: 40,
    width: 60,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    opacity: 0.6,
  },
  grassGround: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 45,
    backgroundColor: '#58D68D', // Grass green
  },
  boardPlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  placeholderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2471A3',
    textAlign: 'center',
    lineHeight: 20,
  },
  clearBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: PAL.ink,
    opacity: 0.7,
  },

  // Tab bar styles
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 22,
    marginTop: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 16,
    padding: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTabItem: {
    backgroundColor: PAL.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: PAL.ink,
    opacity: 0.6,
  },
  activeTabText: {
    opacity: 1,
    color: PAL.ink,
  },

  // Themes preview
  themePreview: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },

  // Theme board backgrounds
  bgOcean: {
    backgroundColor: '#1F618D',
    borderColor: '#1A5276',
  },
  bgSpace: {
    backgroundColor: '#1B2631',
    borderColor: '#2C3E50',
  },
  bgCandy: {
    backgroundColor: '#FADBD8',
    borderColor: '#F5B7B1',
  },

  // Ocean decor
  oceanFloor: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 35,
    backgroundColor: '#EDBB99',
  },
  bubble: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },

  // Space decor
  starSpace: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
    opacity: 0.7,
  },
  planet: {
    position: 'absolute',
    top: 25,
    right: 35,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EB984E',
    opacity: 0.65,
  },

  // Candy decor
  candyFloor: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 35,
    backgroundColor: '#F5B7B1',
  },
  marshmallow: {
    position: 'absolute',
    width: 24,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FCF3CF',
    opacity: 0.75,
  },

  // Draggable sticker styles
  draggableWrap: {
    position: 'absolute',
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  draggableEmoji: {
    fontSize: 40,
  },
  removeBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    lineHeight: 14,
  },
});
