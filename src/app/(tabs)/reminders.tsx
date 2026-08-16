import { useCallback, useState } from 'react';
import { FlatList, TextInput, View, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { Screen, Text, Button, ListRow, Color, Spacing, Radius } from '@/design-system';
import { createReminder, deleteReminder, listReminders, toggleReminderComplete } from '@/domains/reminders/actions';
import type { Reminder, RepeatRule } from '@/domains/reminders/types';

// Quick presets stand in for a native date/time picker for now — still a
// fully manual, voice-free path to create a reminder (AMP_HANDOVER.md §1).
const PRESETS: { label: string; getDueAt: () => Date }[] = [
  {
    label: 'In 1 hour',
    getDueAt: () => new Date(Date.now() + 60 * 60 * 1000),
  },
  {
    label: 'Today 6pm',
    getDueAt: () => {
      const d = new Date();
      d.setHours(18, 0, 0, 0);
      if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
      return d;
    },
  },
  {
    label: 'Tomorrow 9am',
    getDueAt: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      return d;
    },
  },
];

const REPEAT_OPTIONS: RepeatRule[] = ['none', 'daily', 'weekly'];

export default function RemindersScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [titleDraft, setTitleDraft] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [repeat, setRepeat] = useState<RepeatRule>('none');

  const refresh = useCallback(async () => {
    setReminders(await listReminders());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  async function handleAdd() {
    if (!titleDraft.trim()) return;
    const dueAt = PRESETS[selectedPreset].getDueAt().toISOString();
    await createReminder(titleDraft.trim(), dueAt, repeat);
    setTitleDraft('');
    setRepeat('none');
    refresh();
  }

  async function handleToggle(id: string) {
    await toggleReminderComplete(id);
    refresh();
  }

  async function handleDelete(id: string) {
    await deleteReminder(id);
    refresh();
  }

  return (
    <Screen>
      <Text variant="h1" style={styles.heading}>
        Reminders
      </Text>

      <View style={styles.form}>
        <TextInput
          value={titleDraft}
          onChangeText={setTitleDraft}
          placeholder="Remind me to..."
          placeholderTextColor={Color.textSecondary}
          style={styles.input}
        />

        <View style={styles.chipRow}>
          {PRESETS.map((preset, index) => (
            <Button
              key={preset.label}
              label={preset.label}
              variant={selectedPreset === index ? 'primary' : 'secondary'}
              onPress={() => setSelectedPreset(index)}
            />
          ))}
        </View>

        <View style={styles.chipRow}>
          {REPEAT_OPTIONS.map((option) => (
            <Button
              key={option}
              label={option}
              variant={repeat === option ? 'primary' : 'secondary'}
              onPress={() => setRepeat(option)}
            />
          ))}
        </View>

        <Button label="Add reminder" onPress={handleAdd} />
      </View>

      <FlatList
        data={reminders}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => (
          <ListRow
            title={item.title}
            subtitle={`${new Date(item.dueAt).toLocaleString()}${item.repeat !== 'none' ? ` · ${item.repeat}` : ''}`}
            onPress={() => handleToggle(item.id)}
            trailing={
              <View style={styles.trailing}>
                <View style={[styles.checkbox, item.completed && styles.checkboxDone]} />
                <Button label="Delete" variant="ghost" onPress={() => handleDelete(item.id)} />
              </View>
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        ListEmptyComponent={
          <Text variant="body" color={Color.textSecondary}>
            No reminders yet.
          </Text>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { marginTop: Spacing.lg },
  form: { gap: Spacing.sm },
  input: {
    backgroundColor: Color.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Color.textPrimary,
  },
  chipRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Color.textSecondary,
  },
  checkboxDone: { backgroundColor: Color.success, borderColor: Color.success },
});
