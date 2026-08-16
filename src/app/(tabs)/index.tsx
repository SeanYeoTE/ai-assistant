import { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { Screen, Text, VoiceFAB, DomainChip, Color, Spacing, Radius, Elevation } from '@/design-system';
import { getHabitStreak, listHabits, listJournalEntries } from '@/domains/growth/actions';
import { listReminders } from '@/domains/reminders/actions';

export default function HomeScreen() {
  const [habitsDoneToday, setHabitsDoneToday] = useState(0);
  const [habitsTotal, setHabitsTotal] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [journalCount, setJournalCount] = useState(0);
  const [upcomingReminders, setUpcomingReminders] = useState(0);

  const refresh = useCallback(async () => {
    const habits = await listHabits();
    const today = new Date().toISOString().slice(0, 10);
    setHabitsTotal(habits.length);
    setHabitsDoneToday(habits.filter((h) => h.completedDates.includes(today)).length);
    setBestStreak(habits.reduce((max, h) => Math.max(max, getHabitStreak(h)), 0));
    setJournalCount((await listJournalEntries()).length);
    setUpcomingReminders((await listReminders()).filter((r) => !r.completed).length);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return (
    <Screen>
      <Text variant="display" style={styles.heading}>
        A.M.P
      </Text>
      <Text variant="body" color={Color.textSecondary}>
        Your voice-driven life OS.
      </Text>

      <View style={styles.card}>
        <DomainChip domain="growth" />
        <Text variant="h2">
          {habitsDoneToday}/{habitsTotal} habits done today
        </Text>
        <Text variant="caption" color={Color.textSecondary}>
          Best streak: {bestStreak} days · {journalCount} journal entries
        </Text>
      </View>

      <View style={styles.card}>
        <DomainChip domain="reminders" />
        <Text variant="h2">{upcomingReminders} upcoming reminders</Text>
      </View>

      <View style={styles.fabRow}>
        <VoiceFAB onPress={() => router.push('/voice')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { marginTop: Spacing.xl },
  card: {
    backgroundColor: Color.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Elevation.card,
  },
  fabRow: { flex: 1, alignItems: 'flex-end', justifyContent: 'flex-end', paddingBottom: Spacing.xl },
});
