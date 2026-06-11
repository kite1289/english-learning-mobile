import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');
const EMOJIS = ['⭐', '🎉', '✨', '🌟', '🎈', '🏆'];

interface ConfettiProps {
  count?: number;
  run?: boolean;
}

interface ConfettiPiece {
  x: number;
  drift: number;
  delay: number;
  duration: number;
  emoji: string;
  size: number;
  spin: string;
  val: Animated.Value;
}

// Lightweight celebration: a burst of emoji falling/drifting down the screen.
// Built with the RN Animated API (no native dependency).
export default function Confetti({ count = 18, run = true }: ConfettiProps) {
  const pieces = useRef<ConfettiPiece[]>(
    Array.from({ length: count }).map(() => ({
      x: Math.random() * width,
      drift: (Math.random() * 2 - 1) * 80,
      delay: Math.random() * 500,
      duration: 1800 + Math.random() * 1400,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      size: 20 + Math.random() * 20,
      spin: Math.random() > 0.5 ? '1' : '-1',
      val: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (!run) return;
    const anims = pieces.map((p) =>
      Animated.timing(p.val, {
        toValue: 1,
        duration: p.duration,
        delay: p.delay,
        useNativeDriver: true,
      })
    );
    Animated.stagger(30, anims).start();
  }, [run, pieces]);

  if (!run) return null;

  return (
    <Animated.View pointerEvents="none" style={styles.layer}>
      {pieces.map((p, i) => {
        const translateY = p.val.interpolate({ inputRange: [0, 1], outputRange: [-60, height + 60] });
        const translateX = p.val.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] });
        const rotate = p.val.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin}720deg`] });
        const opacity = p.val.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] });
        return (
          <Animated.Text
            key={i}
            style={{
              position: 'absolute',
              left: p.x,
              top: 0,
              fontSize: p.size,
              opacity,
              transform: [{ translateY }, { translateX }, { rotate }],
            }}
          >
            {p.emoji}
          </Animated.Text>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFillObject, zIndex: 50 },
});
