import { StyleSheet, View } from 'react-native';

import { Color, type DomainKey, Radius, Spacing } from './tokens';
import { Text } from './Text';

const DOMAIN_LABEL: Record<DomainKey, string> = {
  fitness: 'Fitness',
  reminders: 'Reminders',
  skincare: 'Skincare',
  growth: 'Growth',
  meds: 'Meds',
};

export function DomainChip({ domain }: { domain: DomainKey }) {
  const dotColor = Color.domain[domain];
  return (
    <View style={styles.chip}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text variant="micro" color={Color.textSecondary}>
        {DOMAIN_LABEL[domain]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xs / 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: Color.surfaceElevated,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
