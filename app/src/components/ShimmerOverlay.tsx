import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  /** Border radius of the parent so the shimmer respects rounded corners */
  borderRadius?: number;
  /** Opacity of the shimmer (0-1). Default 0.45. */
  intensity?: number;
}

/**
 * Diagonal highlight strip that sweeps across the parent every few seconds.
 * Drop-in absolute-fill child for any rounded button/card.
 */
export function ShimmerOverlay({ borderRadius = 16, intensity = 0.45 }: Props) {
  const anim = useRef(new Animated.Value(0)).current;
  const width = Dimensions.get('window').width;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(900),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View
      pointerEvents="none"
      style={[styles.clip, { borderRadius }]}
    >
      <Animated.View
        style={[
          styles.strip,
          { transform: [{ translateX }, { rotate: '-12deg' }], opacity: intensity },
        ]}
      >
        <LinearGradient
          colors={[
            'rgba(255,255,255,0)',
            'rgba(255,255,255,0.7)',
            'rgba(255,255,255,0)',
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  strip: {
    position: 'absolute',
    top: -40,
    left: 0,
    width: 120,
    bottom: -40,
  },
});
