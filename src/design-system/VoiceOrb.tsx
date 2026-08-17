import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Color } from './tokens';

/** Pulsing concentric rings around a filled mic icon — dedicated voice-interaction screen. */
export function VoiceOrb({ listening }: { listening: boolean }) {
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!listening) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [listening, pulse]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  return (
    <View style={styles.container}>
      {listening && (
        <Animated.View
          style={[styles.ring, { transform: [{ scale: ringScale }], opacity: ringOpacity }]}
        />
      )}
      <View style={styles.core}>
        <Ionicons name="mic" size={40} color={Color.background} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: Color.accentPrimary,
  },
  core: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Color.accentPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
