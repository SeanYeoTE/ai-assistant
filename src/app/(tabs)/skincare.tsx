import { useCallback, useState } from 'react';
import { ScrollView, TextInput, View, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { Screen, Text, Button, ListRow, Color, Spacing, Radius } from '@/design-system';
import {
  addProduct,
  addRoutineStep,
  getRoutineReminders,
  listProducts,
  listRoutineSteps,
  logStepDone,
  setRoutineReminder,
  todaysLoggedStepNames,
} from '@/domains/skincare/actions';
import type { Product, RoutineReminder, RoutineStep, TimeOfDay } from '@/domains/skincare/types';

const REMINDER_PRESET: Record<TimeOfDay, { hour: number; minute: number }> = {
  morning: { hour: 8, minute: 0 },
  evening: { hour: 21, minute: 0 },
};

export default function SkincareScreen() {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');
  const [steps, setSteps] = useState<RoutineStep[]>([]);
  const [doneToday, setDoneToday] = useState<Set<string>>(new Set());
  const [reminders, setReminders] = useState<Record<TimeOfDay, RoutineReminder> | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [stepDraft, setStepDraft] = useState('');
  const [productDraft, setProductDraft] = useState('');

  const refresh = useCallback(async () => {
    setSteps((await listRoutineSteps()).filter((s) => s.timeOfDay === timeOfDay));
    setDoneToday(await todaysLoggedStepNames(timeOfDay));
    setReminders(await getRoutineReminders());
    setProducts(await listProducts());
  }, [timeOfDay]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  async function handleLogStep(stepName: string) {
    await logStepDone(stepName, timeOfDay);
    refresh();
  }

  async function handleAddStep() {
    if (!stepDraft.trim()) return;
    await addRoutineStep(stepDraft.trim(), timeOfDay);
    setStepDraft('');
    refresh();
  }

  async function handleAddProduct() {
    if (!productDraft.trim()) return;
    await addProduct(productDraft.trim());
    setProductDraft('');
    refresh();
  }

  async function handleToggleReminder() {
    const current = reminders?.[timeOfDay];
    const preset = REMINDER_PRESET[timeOfDay];
    await setRoutineReminder(timeOfDay, !current?.enabled, preset.hour, preset.minute);
    refresh();
  }

  const reminder = reminders?.[timeOfDay];

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text variant="h1" style={styles.heading}>
          Skincare
        </Text>

        <View style={styles.chipRow}>
          <Button
            label="Morning"
            variant={timeOfDay === 'morning' ? 'primary' : 'secondary'}
            onPress={() => setTimeOfDay('morning')}
          />
          <Button
            label="Evening"
            variant={timeOfDay === 'evening' ? 'primary' : 'secondary'}
            onPress={() => setTimeOfDay('evening')}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.headerRow}>
            <Text variant="h2">Routine</Text>
            <Button
              label={reminder?.enabled ? `Reminder ${String(reminder.hour).padStart(2, '0')}:${String(reminder.minute).padStart(2, '0')} on` : 'Set reminder'}
              variant={reminder?.enabled ? 'primary' : 'secondary'}
              onPress={handleToggleReminder}
            />
          </View>

          {steps.map((step) => (
            <ListRow
              key={step.id}
              title={step.name}
              onPress={() => handleLogStep(step.name)}
              trailing={
                <View style={[styles.checkbox, doneToday.has(step.name) && styles.checkboxDone]} />
              }
            />
          ))}

          <View style={styles.addRow}>
            <TextInput
              value={stepDraft}
              onChangeText={setStepDraft}
              placeholder={`Add ${timeOfDay} step, e.g. "Cleanse"`}
              placeholderTextColor={Color.textSecondary}
              style={styles.input}
            />
            <Button label="Add" onPress={handleAddStep} />
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="h2">Products</Text>
          {products.map((product) => (
            <Text key={product.id} variant="body" color={Color.textSecondary}>
              {product.name}
            </Text>
          ))}
          <View style={styles.addRow}>
            <TextInput
              value={productDraft}
              onChangeText={setProductDraft}
              placeholder="Add product"
              placeholderTextColor={Color.textSecondary}
              style={styles.input}
            />
            <Button label="Add" onPress={handleAddProduct} />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: Spacing.lg, paddingBottom: Spacing.xxl },
  heading: { marginTop: Spacing.lg },
  chipRow: { flexDirection: 'row', gap: Spacing.sm },
  section: { gap: Spacing.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addRow: { flexDirection: 'row', gap: Spacing.sm },
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
