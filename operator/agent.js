import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';

async function askJSON(prompt) {
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { responseMimeType: 'application/json' },
  });
  try {
    return JSON.parse(res.text);
  } catch {
    throw new Error('Gemini returned invalid JSON: ' + res.text);
  }
}

export { askJSON };