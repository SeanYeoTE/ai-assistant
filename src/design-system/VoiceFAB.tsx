import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Color, Elevation } from './tokens';

type Props = {
  onPress: () => void;
  active?: boolean;
};

/** Signature voice entry point — appears identically on every screen where voice can be invoked. */
export function VoiceFAB({ onPress, active = false }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Start voice command"
      onPress={onPress}
      style={(state) => [styles.fab, state.pressed && styles.pressed, active && styles.active]}
    >
      <Ionicons name={active ? 'mic' : 'mic-outline'} size={28} color={Color.background} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Color.accentPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Elevation.modal,
  },
  pressed: { opacity: 0.85 },
  active: { backgroundColor: Color.success },
});
