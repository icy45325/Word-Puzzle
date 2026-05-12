import React from 'react';
import { Image, ImageStyle, StyleSheet, View } from 'react-native';

interface Props {
  size?: number;
  style?: ImageStyle;
}

// Resolves at bundle time. The actual icon.png lives in app/assets/.
const LOGO = require('../../assets/icon.png');

export function AppLogo({ size = 128, style }: Props) {
  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size * 0.28 },
      ]}
    >
      <Image
        source={LOGO}
        style={[
          styles.img,
          { width: size, height: size, borderRadius: size * 0.28 },
          style,
        ]}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12,
  },
  img: {
    backgroundColor: '#FFFFFF',
  },
});
