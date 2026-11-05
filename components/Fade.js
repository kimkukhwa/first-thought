import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

// Fade out, then fade in: about 700ms for a whole change of screen.
const HALF_MS = 350;

// Shows `children` and, whenever `screenKey` changes, softly fades the old
// screen out and the new one in, so there are never hard cuts.
// `instant` swaps without fading, for when the old screen has already
// animated itself into the exact look of the new one.
export default function Fade({ screenKey, instant = false, children }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const [shownKey, setShownKey] = useState(screenKey);
  // While the old screen fades out, keep drawing it as it last was.
  const lastChildren = useRef(children);
  const isCurrent = screenKey === shownKey;
  if (isCurrent) lastChildren.current = children;

  useEffect(() => {
    if (!isCurrent && instant) {
      opacity.setValue(1);
      setShownKey(screenKey);
      return;
    }
    const animation = Animated.timing(opacity, {
      toValue: isCurrent ? 1 : 0,
      duration: HALF_MS,
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished && !isCurrent) setShownKey(screenKey);
    });
    return () => animation.stop();
  }, [isCurrent, instant, screenKey, opacity]);

  return (
    <Animated.View style={[styles.fill, { opacity }]}>
      {isCurrent ? children : lastChildren.current}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
