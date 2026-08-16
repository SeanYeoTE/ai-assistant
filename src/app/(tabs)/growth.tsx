import { useCallback, useState } from 'react';
import { FlatList, TextInput, View, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { Screen, Text, Button, ListRow, Color, Spacing, Radius } from '@/design-system';
import {
  addHabit,
  addJournalEntry,
  getHabitStreak,
  listHabits,
  listJournalEntries,
  toggleHabitToday,
} from '@/domains/growth/actions';
import type { Habit, JournalEntry } from '@/domains/growth/types';

export default function GrowthScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [habitDraft, setHabitDraft] = useState('');
  const [journalDraft, setJournalDraft] = useState('');

  const refresh = useCallback(async () => {
    setHabits(await listHabits());
    setEntries(await listJournalEntries());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  async function handleAddHabit() {
    if (!habitDraft.trim()) return;
    await addHabit(habitDraft.trim());
    setHabitDraft('');
    refresh();
  }

  async function handleAddJournal() {
    if (!journalDraft.trim()) return;
    await addJournalEntry(journalDraft.trim());
    setJournalDraft('');
    refresh();
  }

  async function handleToggleHabit(habitId: string) {
    await toggleHabitToday(habitId);
    refresh();
  }

  return (
    <Screen>
      <Text variant="h1" style={styles.heading}>
        Growth
      </Text>

      <View style={styles.section}>
        <Text variant="h2">Habits</Text>
        <View style={styles.addRow}>
          <TextInput
            value={habitDraft}
            onChangeText={setHabitDraft}
            placeholder="New habit, e.g. Drink water"
            placeholderTextColor={Color.textSecondary}
            style={styles.input}
          />
          <Button label="Add" onPress={handleAddHabit} />
        </View>
        <FlatList
          data={habits}
          keyExtractor={(h) => h.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <ListRow
              title={item.name}
              subtitle={`${getHabitStreak(item)} day streak`}
              onPress={() => handleToggleHabit(item.id)}
              trailing={
                <View
                  style={[
                    styles.checkbox,
                    item.completedDates.includes(new Date().toISOString().slice(0, 10)) &&
                      styles.checkboxDone,
                  ]}
                />
              }
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        />
      </View>

      <View style={styles.section}>
        <Text variant="h2">Journal</Text>
        <View style={styles.addRow}>
          <TextInput
            value={journalDraft}
            onChangeText={setJournalDraft}
            placeholder="What's on your mind?"
            placeholderTextColor={Color.textSecondary}
            style={styles.input}
            multiline
          />
          <Button label="Add" onPress={handleAddJournal} />
        </View>
        <FlatList
          data={entries}
          keyExtractor={(e) => e.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <ListRow title={item.text} subtitle={new Date(item.createdAt).toLocaleString()} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { marginTop: Spacing.lg },
  section: { gap: Spacing.md },
  addRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  input: {
    flex: 1,
    backgroundColor: Color.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Color.textPrimary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Color.textSecondary,
  },
  checkboxDone: { backgroundColor: Color.success, borderColor: Color.success },
});
