import AsyncStorage from '@react-native-async-storage/async-storage';

import type { GrowthState } from './types';

const STORAGE_KEY = 'amp.domains.growth.v1';

const EMPTY_STATE: GrowthState = { journalEntries: [], habits: [] };

export async function loadGrowthState(): Promise<GrowthState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return EMPTY_STATE;
  try {
    return JSON.parse(raw) as GrowthState;
  } catch {
    return EMPTY_STATE;
  }
}

export async function saveGrowthState(state: GrowthState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
