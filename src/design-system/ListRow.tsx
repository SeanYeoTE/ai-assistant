import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Color, Radius, Spacing } from './tokens';
import { Text } from './Text';

type Props = {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  onPress?: () => void;
};

export function ListRow({ icon, title, subtitle, trailing, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={(state) => [styles.row, state.pressed && onPress && styles.pressed]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <View style={styles.textContainer}>
        <Text variant="bodyLarge">{title}</Text>
        {subtitle ? (
          <Text variant="caption" color={Color.textSecondary}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    backgroundColor: Color.surface,
  },
  pressed: { opacity: 0.7 },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Color.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: { flex: 1, gap: 2 },
});
