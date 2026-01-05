
import { Translation } from './types';

export const TRANSLATIONS: Translation[] = ['KJV', 'AMP', 'GNT', 'NLT'];

/**
 * Full 66-book Protestant Canon
 */
export const BOOKS_OF_BIBLE = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", 
  "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", 
  "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", 
  "Ezra", "Nehemiah", "Esther", "Job", "Psalms", 
  "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", 
  "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", 
  "Amos", "Obadiah", "Jonah", "Micah", "Nahum", 
  "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
  "Matthew", "Mark", "Luke", "John", "Acts", 
  "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", 
  "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", 
  "2 Timothy", "Titus", "Philemon", "Hebrews", "James", 
  "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"
];

// Fallback translations mapping for the free Bible-API.com
// Since AMP/NLT are proprietary, we map them to the closest open alternatives for the 'Real API' requirement
export const TRANSLATION_MAP: Record<Translation, string> = {
  KJV: 'kjv',
  AMP: 'web', // World English Bible (closest to modern/expanded free)
  GNT: 'bbe', // Bible in Basic English (simple language)
  NLT: 'web'  // World English Bible (modern)
};

// We will no longer rely on MOCK_VERSES for primary lookup
export const MOCK_VERSES: Record<string, Record<Translation, string>> = {};
