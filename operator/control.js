import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

// Asks one question in the terminal and returns the lowercase answer
export async function ask(question) {
  const rl = readline.createInterface({ input, output });
  const answer = await rl.question(question);
  rl.close();
  return answer.trim().toLowerCase();
}