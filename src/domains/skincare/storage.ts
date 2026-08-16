import AsyncStorage from '@react-native-async-storage/async-storage';

import type { SkincareState } from './types';

const STORAGE_KEY = 'amp.domains.skincare.v1';

const EMPTY_STATE: SkincareState = {
  steps: [],
  products: [],
  logEntries: [],
  reminders: {
    morning: { timeOfDay: 'morning', enabled: false, hour: 8, minute: 0, notificationId: null },
    evening: { timeOfDay: 'evening', enabled: false, hour: 21, minute: 0, notificationId: null },
  },
};

export async function loadSkincareState(): Promise<SkincareState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return EMPTY_STATE;
  try {
    return JSON.parse(raw) as SkincareState;
  } catch {
    return EMPTY_STATE;
  }
}

export async function saveSkincareState(state: SkincareState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
