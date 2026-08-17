export type JournalEntry = {
  id: string;
  text: string;
  createdAt: string; // ISO timestamp
};

export type Habit = {
  id: string;
  name: string;
  createdAt: string; // ISO timestamp
  /** ISO date strings (YYYY-MM-DD) on which this habit was completed. */
  completedDates: string[];
};

export type GrowthState = {
  journalEntries: JournalEntry[];
  habits: Habit[];
};
