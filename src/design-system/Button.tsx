import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { Color, Radius, Spacing } from './tokens';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = PressableProps & {
  label: string;
  variant?: Variant;
};

export function Button({ label, variant = 'primary', style, ...rest }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      style={(state) => [
        styles.base,
        variantStyles[variant],
        state.pressed && styles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}
    >
      <Text
        variant="bodyLarge"
        color={variant === 'primary' ? Color.background : Color.textPrimary}
        style={variant === 'ghost' ? styles.ghostText : undefined}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.pill,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.75 },
  ghostText: { textDecorationLine: 'underline' },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: Color.accentPrimary },
  secondary: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Color.textSecondary },
  ghost: { backgroundColor: 'transparent', paddingHorizontal: Spacing.sm },
});
