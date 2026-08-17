import { useCallback, useState } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { Screen, Text, ListRow, DomainChip, Button, Color, Spacing } from '@/design-system';
import { getHabitStreak, listHabits, toggleHabitToday } from '@/domains/growth/actions';
import type { Habit } from '@/domains/growth/types';
import { listReminders, toggleReminderComplete } from '@/domains/reminders/actions';
import type { Reminder } from '@/domains/reminders/types';

type TodayItem =
  | { kind: 'habit'; id: string; habit: Habit }
  | { kind: 'reminder'; id: string; reminder: Reminder };

// Cross-domain "today" list, per AMP_HANDOVER.md §2/§7: Growth (habits) and
// Reminders items merge into one list here; Fitness/Skincare/Meds join once
// built. Every item is still reachable without voice.
export default function TodayScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const refresh = useCallback(async () => {
    setHabits(await listHabits());
    setReminders(await listReminders());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  async function handleToggleHabit(habitId: string) {
    await toggleHabitToday(habitId);
    refresh();
  }

  async function handleToggleReminder(reminderId: string) {
    await toggleReminderComplete(reminderId);
    refresh();
  }

  const today = new Date().toISOString().slice(0, 10);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  // Due today or overdue and not yet completed — that's what belongs on a
  // "today" list, as opposed to Reminders' full upcoming list.
  const dueReminders = reminders.filter((r) => !r.completed && new Date(r.dueAt) <= endOfToday);

  const items: TodayItem[] = [
    ...habits.map((habit): TodayItem => ({ kind: 'habit', id: habit.id, habit })),
    ...dueReminders.map((reminder): TodayItem => ({ kind: 'reminder', id: reminder.id, reminder })),
  ];

  return (
    <Screen>
      <View style={styles.headerRow}>
        <Text variant="h1">Today</Text>
        <Button label="+ Add" variant="secondary" onPress={() => router.push('/growth')} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => `${item.kind}-${item.id}`}
        ListEmptyComponent={
          <Text variant="body" color={Color.textSecondary}>
            Nothing to do yet. Add a habit or reminder from their tabs.
          </Text>
        }
        renderItem={({ item }) =>
          item.kind === 'habit' ? (
            <View style={styles.row}>
              <DomainChip domain="growth" />
              <ListRow
                title={item.habit.name}
                subtitle={`${getHabitStreak(item.habit)} day streak`}
                onPress={() => handleToggleHabit(item.habit.id)}
                trailing={
                  <View
                    style={[styles.checkbox, item.habit.completedDates.includes(today) && styles.checkboxDone]}
                  />
                }
              />
            </View>
          ) : (
            <View style={styles.row}>
              <DomainChip domain="reminders" />
              <ListRow
                title={item.reminder.title}
                subtitle={new Date(item.reminder.dueAt).toLocaleString()}
                onPress={() => handleToggleReminder(item.reminder.id)}
                trailing={<View style={[styles.checkbox, item.reminder.completed && styles.checkboxDone]} />}
              />
            </View>
          )
        }
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
