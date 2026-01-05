
import { GoogleGenAI, Type } from "@google/genai";
import { JournalEntry, SpiritualInsight } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getCounselorInsight = async (
  currentEntry: string,
  history: JournalEntry[]
): Promise<SpiritualInsight | null> => {
  const historyContext = history
    .slice(0, 5)
    .map(e => `[${e.date}] Note: ${e.content} | Verses: ${e.verses.map(v => v.fullReference).join(', ')}`)
    .join('\n');

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `You are 'The Counselor', a theological AI for a spiritual journal called Lumina. 
      Analyze the user's current thought and correlate it with their past entries and the Bible.
      
      CURRENT ENTRY: ${currentEntry}
      
      PAST ENTRIES FOR CONTEXT:
      ${historyContext}
      
      Provide:
      1. A dominant theme for today.
      2. A 'Semantic Correlation': How today's thought relates to specific past entries or general biblical wisdom. (Be specific like 'On Oct 12, you studied...')
      3. Three 'Deep Dive' questions to encourage further reflection.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            theme: { type: Type.STRING },
            correlation: { type: Type.STRING },
            questions: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["theme", "correlation", "questions"]
        }
      }
    });

    const text = response.text?.trim();
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return null;
  }
};

/**
 * Generates a summary based on a specific duration of entries with strict formatting
 */
export const getDurationSummary = async (entries: JournalEntry[], days: number): Promise<string> => {
  if (entries.length === 0) return "No entries found to synthesize.";

  const now = new Date();
  const filteredEntries = entries.filter(e => {
    const entryDate = new Date(parseInt(e.id)); // Use the ID (timestamp) for accurate filtering
    const diffTime = Math.abs(now.getTime() - entryDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= days;
  });

  if (filteredEntries.length === 0) return `You haven't recorded any entries in the last ${days} days.`;

  try {
    const content = filteredEntries.map(e => `[${e.date}]: ${e.content}`).join('\n---\n');
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Act as Lumina's Spirit-Scribe. Synthesize the spiritual trajectory of the user over the last ${days} days based on their journal entries. 
      
      ENTRIES TO ANALYZE:
      ${content}

      STRICT OUTPUT FORMAT (NO FLUFF, DIRECT & INSIGHTFUL):

      ### The Dominant Theme
      [A 1-sentence evocative title]
      [A 2-sentence explanation of why this specific theme emerged from the entries.]

      ### Observed Correlations
      Identify 2–3 non-obvious links between different days. 
      Example format: "On [Date] you noted [Thought]; by [Date], your study of [Scripture] provided the exact theological framework for that struggle."

      ### Actionable Integration
      Provide one "Spiritual Exercise" or "Practical Step" the user can take this coming week to apply the observed theme.

      ### Recommended Reading
      - Old Testament: [Book Chapter] - [Brief reason for choice]
      - New Testament: [Book Chapter] - [Brief reason for choice]

      ### Contextual Truth
      Provide one historically accurate and fascinating fun fact about the Bible, its translation history, or the ancient culture mentioned in the user's notes (e.g., Greek/Hebrew word origins or Near Eastern customs).`,
    });
    
    return response.text || "The Oracle is silent. Try again later.";
  } catch (error) {
    console.error("Gemini Synthesis Error:", error);
    return "Error generating spiritual trajectory. Please ensure your API key is valid.";
  }
};

export const getWeeklySynthesis = async (entries: JournalEntry[]): Promise<string> => {
  return getDurationSummary(entries, 7);
};
