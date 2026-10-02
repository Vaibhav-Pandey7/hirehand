import fs from "fs";
import { app } from "./graph.js";
import { setPaused } from "./control.js";

const raw = process.argv.slice(2);
if (raw.includes("--yes")) process.env.AUTO_APPROVE = "1"; // testing only
const usePanel = raw.includes("--panel");
const args = raw.filter((a) => a !== "--yes" && a !== "--panel");

if (usePanel) {
  const { startServer } = await import("./server.js");
  startServer();
}

const resumeIdx = args.indexOf("--resume");
let config;
let input;

if (resumeIdx !== -1) {
  // Continue a crashed run: same thread id, no new input
  const threadId = args[resumeIdx + 1] || fs.readFileSync(".last-run", "utf8").trim();
  config = { configurable: { thread_id: threadId } };
  input = null;
  console.log(`Resuming run ${threadId}`);
} else {
  const [goalText, resumePath] = args;
  if (!goalText || !resumePath) {
    console.log('Usage: npm run operator -- "<goal>" <resume path> [--yes] [--panel]');
    console.log("   or: npm run operator -- --resume [thread id] [--panel]");
    process.exit(1);
  }
  setPaused(false); // a stale pause file from an old run must not freeze a fresh run
  const threadId = `run-${Date.now()}`;
  fs.writeFileSync(".last-run", threadId); // remember it so --resume can find it
  console.log(`Run id: ${threadId}`);
  config = { configurable: { thread_id: threadId } };
  input = { goalText, resumePath };
}

await app.invoke(input, config);

if (usePanel) console.log("[done] Run finished. The panel stays open. Press Ctrl+C to exit.");