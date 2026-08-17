import { useCallback, useState } from 'react';
import { ScrollView, TextInput, View, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { Screen, Text, Button, ListRow, Color, Spacing, Radius } from '@/design-system';
import { addExercise, getStreak, getTodaysLog, saveLift, setSplit } from '@/domains/fitness/actions';
import { EXERCISES_BY_SPLIT } from '@/domains/fitness/types';
import type { LoggedExercise, Split, StreakSummary } from '@/domains/fitness/types';

const SPLITS: Split[] = ['push', 'pull', 'legs', 'upper', 'lower', 'full_body', 'rest'];

const DAY_TAG_COLOR: Record<string, string> = {
  push: Color.domain.fitness,
  pull: Color.domain.fitness,
  legs: Color.domain.fitness,
  upper: Color.domain.fitness,
  lower: Color.domain.fitness,
  full_body: Color.domain.fitness,
  rest: Color.textSecondary,
  missed: 'transparent',
};

export default function FitnessScreen() {
  const [split, setSplitState] = useState<Split | null>(null);
  const [exercises, setExercises] = useState<LoggedExercise[]>([]);
  const [streak, setStreak] = useState<StreakSummary | null>(null);
  const [exerciseDraft, setExerciseDraft] = useState('');
  const [activeExercise, setActiveExercise] = useState<string | null>(null);
  const [weightDraft, setWeightDraft] = useState('');
  const [repsDraft, setRepsDraft] = useState('');

  const refresh = useCallback(async () => {
    const log = await getTodaysLog();
    setSplitState(log.split);
    setExercises(log.exercises);
    setStreak(await getStreak());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  async function handleSetSplit(next: Split) {
    await setSplit(next);
    refresh();
  }

  async function handleAddExercise(name: string) {
    if (!name.trim()) return;
    await addExercise(name.trim());
    setExerciseDraft('');
    refresh();
  }

  async function handleAddSet(exerciseName: string) {
    const weight = Number(weightDraft);
    const reps = Number(repsDraft);
    if (!weightDraft || !repsDraft || Number.isNaN(weight) || Number.isNaN(reps)) return;
    const existing = exercises.find((e) => e.name === exerciseName)?.sets ?? [];
    await saveLift(exerciseName, [...existing, { weight, reps }]);
    setWeightDraft('');
    setRepsDraft('');
    refresh();
  }

  const suggestions = split && split !== 'rest' ? EXERCISES_BY_SPLIT[split] : [];

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text variant="h1" style={styles.heading}>
          Fitness
        </Text>

        {streak && (
          <View style={styles.streakCard}>
            <Text variant="h2">
              {streak.currentStreak} day streak · best {streak.longestStreak}
            </Text>
            <Text variant="caption" color={Color.textSecondary}>
              {streak.totalCheckIns} total check-ins · {streak.graceDaysRemaining} grace days left
            </Text>
            <View style={styles.grid}>
              {streak.last30Days.map((day) => (
                <View
                  key={day.date}
                  style={[
                    styles.gridCell,
                    {
                      backgroundColor: DAY_TAG_COLOR[day.tag],
                      borderWidth: day.tag === 'missed' ? 1 : 0,
                      borderColor: Color.textSecondary,
                      opacity: day.protectedRest ? 0.5 : 1,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text variant="h2">Today&apos;s split</Text>
          <View style={styles.chipRow}>
            {SPLITS.map((s) => (
              <Button
                key={s}
                label={s.replace('_', ' ')}
                variant={split === s ? 'primary' : 'secondary'}
                onPress={() => handleSetSplit(s)}
              />
            ))}
          </View>
        </View>

        {split && split !== 'rest' && (
          <View style={styles.section}>
            <Text variant="h2">Exercises</Text>

            {suggestions.length > 0 && (
              <View style={styles.chipRow}>
                {suggestions.map((name) => (
                  <Button key={name} label={name} variant="secondary" onPress={() => handleAddExercise(name)} />
                ))}
              </View>
            )}

            <View style={styles.addRow}>
              <TextInput
                value={exerciseDraft}
                onChangeText={setExerciseDraft}
                placeholder="Custom exercise name"
                placeholderTextColor={Color.textSecondary}
                style={styles.input}
              />
              <Button label="Add" onPress={() => handleAddExercise(exerciseDraft)} />
            </View>

            {exercises.map((exercise) => (
              <View key={exercise.name} style={styles.exerciseBlock}>
                <ListRow
                  title={exercise.name}
                  subtitle={
                    exercise.sets.length > 0
                      ? exercise.sets.map((s) => `${s.weight}×${s.reps}`).join(', ')
                      : 'No sets logged yet'
                  }
                  onPress={() => setActiveExercise(activeExercise === exercise.name ? null : exercise.name)}
                />
                {activeExercise === exercise.name && (
                  <View style={styles.setForm}>
                    <TextInput
                      value={weightDraft}
                      onChangeText={setWeightDraft}
                      placeholder="Weight"
                      placeholderTextColor={Color.textSecondary}
                      keyboardType="numeric"
                      style={[styles.input, styles.setInput]}
                    />
                    <TextInput
                      value={repsDraft}
                      onChangeText={setRepsDraft}
                      placeholder="Reps"
                      placeholderTextColor={Color.textSecondary}
                      keyboardType="numeric"
                      style={[styles.input, styles.setInput]}
                    />
                    <Button label="Add set" onPress={() => handleAddSet(exercise.name)} />
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: Spacing.lg, paddingBottom: Spacing.xxl },
  heading: { marginTop: Spacing.lg },
  streakCard: { backgroundColor: Color.surface, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: Spacing.xs },
  gridCell: { width: 16, height: 16, borderRadius: 4 },
  section: { gap: Spacing.sm },
  chipRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  addRow: { flexDirection: 'row', gap: Spacing.sm },
  input: {
    flex: 1,
    backgroundColor: Color.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Color.textPrimary,
  },
  exerciseBlock: { gap: Spacing.xs },
  setForm: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.sm },
  setInput: { flex: 0, width: 80 },
});
