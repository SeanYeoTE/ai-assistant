import { useCallback, useState } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { Screen, Text, ListRow, DomainChip, Button, Color, Spacing } from '@/design-system';
import { getHabitStreak, listHabits, toggleHabitToday } from '@/domains/growth/actions';
import type { Habit } from '@/domains/growth/types';

// Cross-domain "today" list. Currently only the Growth domain exists;
// Reminders/Fitness/Skincare/Meds items will merge into this same list once
// built (AMP_HANDOVER.md §2/§7), each still reachable without voice.
export default function TodayScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);

  const refresh = useCallback(async () => {
    setHabits(await listHabits());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  async function handleToggle(habitId: string) {
    await toggleHabitToday(habitId);
    refresh();
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Screen>
      <View style={styles.headerRow}>
        <Text variant="h1">Today</Text>
        <Button label="+ Add" variant="secondary" onPress={() => router.push('/growth')} />
      </View>

      <FlatList
        data={habits}
        keyExtractor={(h) => h.id}
        ListEmptyComponent={
          <Text variant="body" color={Color.textSecondary}>
            Nothing to do yet. Add a habit from the Growth tab.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <DomainChip domain="growth" />
            <ListRow
              title={item.name}
              subtitle={`${getHabitStreak(item)} day streak`}
              onPress={() => handleToggle(item.id)}
              trailing={
                <View
                  style={[styles.checkbox, item.completedDates.includes(today) && styles.checkboxDone]}
                />
              }
            />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.lg },
  row: { gap: Spacing.xs },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: Color.textSecondary },
  checkboxDone: { backgroundColor: Color.success, borderColor: Color.success },
});
