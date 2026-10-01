import "dotenv/config";
import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite"; 

export async function askJSON(prompt, { filePath } = {}) {//default filePath is undefined
  let contents = prompt;

  if (filePath && path.extname(filePath).toLowerCase() === ".pdf") {
    const data = fs.readFileSync(filePath).toString("base64");
    contents = [{ inlineData: { mimeType: "application/pdf", data } }, { text: prompt }];
  } else if (filePath) {
    contents = `${prompt}\n\nDOCUMENT:\n${fs.readFileSync(filePath, "utf8")}`;
  }

  const res = await ai.models.generateContent({
    model: MODEL,
    contents,
    config: { responseMimeType: "application/json" },
  });

  try {
    return JSON.parse(res.text);
  } catch {
    throw new Error("Gemini returned invalid JSON: " + res.text);
  }
}