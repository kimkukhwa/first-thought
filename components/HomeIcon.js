import Svg, { Path } from 'react-native-svg';

// A minimal house: one pentagon outline, no door or details.
export default function HomeIcon({ size = 28, color }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.5 10.2 L12 4.2 L19.5 10.2 V19.8 H4.5 Z"
        stroke={color}
        strokeWidth={1.2}
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}
