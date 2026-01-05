
import { Verse, Translation } from '../types';
import { TRANSLATION_MAP } from '../constants';

/**
 * Fetches a verse from the Bible-API.com
 */
export const fetchVerseFromApi = async (reference: string, translation: Translation = 'KJV'): Promise<Verse | null> => {
  const apiTranslation = TRANSLATION_MAP[translation];
  const url = `https://bible-api.com/${encodeURIComponent(reference)}?translation=${apiTranslation}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    
    // Bible-api.com returns a single object if one verse, or list if multiple.
    // We'll normalize to the first verse for simplicity.
    const text = data.text || (data.verses && data.verses[0]?.text);
    const ref = data.reference;

    if (!text || !ref) return null;

    // Basic parsing of the reference returned
    const bookMatch = ref.match(/^(.+?)\s+(\d+):(\d+)$/);
    const book = bookMatch ? bookMatch[1] : 'Unknown';
    const chapter = bookMatch ? parseInt(bookMatch[2]) : 0;
    const verseNum = bookMatch ? parseInt(bookMatch[3]) : 0;

    return {
      book,
      chapter,
      verse: verseNum,
      text: text.trim(),
      translation,
      fullReference: ref
    };
  } catch (error) {
    console.error("Bible API Fetch Error:", error);
    return null;
  }
};

/**
 * Fetches multiple translations for a specific reference
 */
export const getVerseTranslations = async (reference: string): Promise<Record<Translation, string> | null> => {
  const translations: Partial<Record<Translation, string>> = {};
  
  const requests = (Object.keys(TRANSLATION_MAP) as Translation[]).map(async (t) => {
    const v = await fetchVerseFromApi(reference, t);
    if (v) translations[t] = v.text;
  });

  await Promise.all(requests);
  return Object.keys(translations).length > 0 ? (translations as Record<Translation, string>) : null;
};
