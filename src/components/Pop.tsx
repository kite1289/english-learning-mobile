import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

interface PopProps {
  popKey?: any;
  shakeKey?: any;
  entrance?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

// Wraps children and animates them:
//  - a "pop" (scale bounce) whenever `popKey` changes (and on mount if `entrance`).
//  - a horizontal "shake" whenever `shakeKey` changes (never on mount).
export default function Pop({ popKey, shakeKey, entrance = false, style, children, ...rest }: PopProps) {
  const scale = useRef(new Animated.Value(entrance ? 0.7 : 1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const shookOnce = useRef(false);

  useEffect(() => {
    if (popKey === undefined && !entrance) return;
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.12, useNativeDriver: true, speed: 18, bounciness: 14 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 16, bounciness: 10 }),
    ]).start();
  }, [popKey]);

  useEffect(() => {
    if (shakeKey === undefined) return;
    if (!shookOnce.current) {
      shookOnce.current = true;
      return; // don't shake on first render
    }
    Animated.sequence([
      Animated.timing(translateX, { toValue: -9, duration: 50, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 9, duration: 50, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeKey]);

  return (
    <Animated.View style={[style, { transform: [{ scale }, { translateX }] }]} {...rest}>
      {children}
    </Animated.View>
  );
}
