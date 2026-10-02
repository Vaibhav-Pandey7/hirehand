import fs from "node:fs";
import { EventEmitter } from "node:events";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const PAUSE_FILE = ".pause";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const bus = new EventEmitter(); // tells the control panel when something changes

let waiting = false;   // true while the operator is actually stopped at a pause point
let pending = null;    // the approval question currently open, if any
let webAnswer = null;  // lets the web panel answer that question

export function getStatus() {
  return { pauseRequested: fs.existsSync(PAUSE_FILE), waiting, approval: pending };
}

export function setPaused(on) {
  if (on) fs.writeFileSync(PAUSE_FILE, new Date().toISOString());
  else if (fs.existsSync(PAUSE_FILE)) fs.unlinkSync(PAUSE_FILE);
  bus.emit("status");
}

// Called between steps. Blocks while the pause file exists.
export async function waitIfPaused(where) {
  if (!fs.existsSync(PAUSE_FILE)) return;
  console.log(`\n[paused] stopped ${where}. Run "npm run unpause" or press Resume in the panel.`);
  waiting = true;
  bus.emit("status");
  while (fs.existsSync(PAUSE_FILE)) await sleep(500);
  waiting = false;
  bus.emit("status");
  console.log("[resumed] continuing\n");
}

// Called by the control panel server when you click Approve or Reject
export function resolveApproval(answer) {
  if (!webAnswer) return false;
  webAnswer(answer);
  return true;
}

// Asks a question. The terminal and the web panel both get a chance to answer, first one wins.
export async function ask(question) {
  const rl = readline.createInterface({ input, output });
  const ac = new AbortController();

  const fromWeb = new Promise((resolve) => {
    webAnswer = (a) => resolve({ a, from: "control panel" });
  });
  const fromTerminal = rl
    .question(question, { signal: ac.signal })
    .then((a) => ({ a: a.trim().toLowerCase(), from: "terminal" }));

  pending = { question: question.trim() };
  bus.emit("status");

  try {
    const winner = await Promise.race([fromTerminal, fromWeb]);
    if (winner.from === "control panel") console.log(`[approval] answered in control panel: ${winner.a}`);
    return winner.a;  
  } finally {
    ac.abort(); // stops the terminal prompt if the web answered first
    rl.close();
    webAnswer = null;
    pending = null;
    bus.emit("status");
  }
}