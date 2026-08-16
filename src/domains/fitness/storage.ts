import AsyncStorage from '@react-native-async-storage/async-storage';

import type { FitnessState } from './types';

const STORAGE_KEY = 'amp.domains.fitness.v1';

const EMPTY_STATE: FitnessState = { checkIns: [] };

export async function loadFitnessState(): Promise<FitnessState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return EMPTY_STATE;
  try {
    return JSON.parse(raw) as FitnessState;
  } catch {
    return EMPTY_STATE;
  }
}

export async function saveFitnessState(state: FitnessState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
