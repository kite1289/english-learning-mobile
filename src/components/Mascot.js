import React from 'react';
import Svg, { Circle, Ellipse, Path, Polygon, Line, Rect } from 'react-native-svg';

export default function Mascot({ size = 80, mood = 'happy', outfit = 'none' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx="22" cy="28" r="14" fill="#B4855A" stroke="#8C6342" strokeWidth="3" />
      <Circle cx="78" cy="28" r="14" fill="#B4855A" stroke="#8C6342" strokeWidth="3" />
      <Circle cx="22" cy="28" r="6" fill="#E8C9A5" />
      <Circle cx="78" cy="28" r="6" fill="#E8C9A5" />
      <Circle cx="50" cy="55" r="36" fill="#D4A574" stroke="#8C6342" strokeWidth="3" />
      <Ellipse cx="50" cy="68" rx="18" ry="14" fill="#F5E2C8" />
      <Circle cx="38" cy="50" r="4.5" fill="#2D2A4A" />
      <Circle cx="62" cy="50" r="4.5" fill="#2D2A4A" />
      <Circle cx="39.5" cy="48.5" r="1.6" fill="#fff" />
      <Circle cx="63.5" cy="48.5" r="1.6" fill="#fff" />
      <Ellipse cx="50" cy="62" rx="4" ry="3" fill="#2D2A4A" />
      {mood === 'happy' && (
        <Path d="M44 70 Q50 76 56 70" stroke="#2D2A4A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      )}
      {mood === 'wow' && (
        <Ellipse cx="50" cy="73" rx="3.5" ry="4.5" fill="#2D2A4A" />
      )}
      {mood === 'sad' && (
        <Path d="M44 74 Q50 68 56 74" stroke="#2D2A4A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      )}
      <Circle cx="28" cy="62" r="4" fill="#FF8FA3" opacity="0.55" />
      <Circle cx="72" cy="62" r="4" fill="#FF8FA3" opacity="0.55" />

      {/* --- Outfits --- */}
      {outfit === 'party' && (
        <>
          <Polygon points="50,4 38,26 62,26" fill="#FF6B6B" stroke="#E04E4E" strokeWidth="2" />
          <Circle cx="50" cy="4" r="4" fill="#FFC93C" />
        </>
      )}
      {outfit === 'crown' && (
        <Polygon
          points="32,24 36,12 44,20 50,8 56,20 64,12 68,24"
          fill="#FFC93C"
          stroke="#E8A91A"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      )}
      {outfit === 'glasses' && (
        <>
          <Circle cx="38" cy="50" r="9" fill="#2D2A4A" opacity="0.85" />
          <Circle cx="62" cy="50" r="9" fill="#2D2A4A" opacity="0.85" />
          <Line x1="47" y1="50" x2="53" y2="50" stroke="#2D2A4A" strokeWidth="3" />
          <Rect x="38" y="44" width="7" height="3" rx="1.5" fill="#fff" opacity="0.4" />
          <Rect x="62" y="44" width="7" height="3" rx="1.5" fill="#fff" opacity="0.4" />
        </>
      )}
    </Svg>
  );
}
