import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ReminderState } from './types';

const STORAGE_KEY = 'amp.domains.reminders.v1';

const EMPTY_STATE: ReminderState = { reminders: [] };

export async function loadReminderState(): Promise<ReminderState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return EMPTY_STATE;
  try {
    return JSON.parse(raw) as ReminderState;
  } catch {
    return EMPTY_STATE;
  }
}

export async function saveReminderState(state: ReminderState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
