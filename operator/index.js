import fs from "fs";
import { app } from "./graph.js";

const args = process.argv.slice(2);
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
    console.log('Usage: npm run operator -- "<goal>" <resume path>');
    console.log("   or: npm run operator -- --resume [thread id]");
    process.exit(1);
  }
  const threadId = `run-${Date.now()}`;
  fs.writeFileSync(".last-run", threadId); // remember it, so --resume can find it
  console.log(`Run id: ${threadId}`);
  config = { configurable: { thread_id: threadId } };
  input = { goalText, resumePath };
}

await app.invoke(input, config);