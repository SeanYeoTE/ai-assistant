import { StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Color, Spacing } from './tokens';

export function Screen({ style, children, ...rest }: ViewProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={[styles.container, style]} {...rest}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Color.background },
  container: { flex: 1, paddingHorizontal: Spacing.lg, gap: Spacing.lg },
});
