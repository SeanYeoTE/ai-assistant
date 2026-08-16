import { Text as RNText, type TextProps } from 'react-native';

import { Color, TypeScale } from './tokens';

type Variant = keyof typeof TypeScale;

type Props = TextProps & {
  variant?: Variant;
  color?: string;
};

export function Text({ variant = 'body', color = Color.textPrimary, style, ...rest }: Props) {
  return <RNText style={[TypeScale[variant], { color }, style]} {...rest} />;
}
