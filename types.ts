
export type Translation = 'KJV' | 'AMP' | 'GNT' | 'NLT';

export interface Verse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation: Translation;
  fullReference: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  verses: Verse[];
  tags: string[];
}

export interface SpiritualInsight {
  theme: string;
  correlation: string;
  questions: string[];
}

export interface StreakData {
  count: number;
  lastEntryDate: string;
}
