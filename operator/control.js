import fs from "node:fs";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const PAUSE_FILE = ".pause";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Asks one question in the terminal and returns the lowercase answer
export async function ask(question) {
  const rl = readline.createInterface({ input, output });
  const answer = await rl.question(question);
  rl.close();
  return answer.trim().toLowerCase();
}

export function setPaused(on) {
  if (on) fs.writeFileSync(PAUSE_FILE, new Date().toISOString());
  else if (fs.existsSync(PAUSE_FILE)) fs.unlinkSync(PAUSE_FILE);
}

// Called between steps. Blocks while the pause file exists.
export async function waitIfPaused(where) {
  if (!fs.existsSync(PAUSE_FILE)) return;
  console.log(`\n[paused] stopped ${where}. Run "npm run unpause" in another terminal to continue.`);
  while (fs.existsSync(PAUSE_FILE)) await sleep(500);
  console.log("[resumed] continuing\n");
}