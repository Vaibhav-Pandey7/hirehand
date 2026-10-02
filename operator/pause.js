import { setPaused } from "./control.js";

const mode = process.argv[2];
if (mode !== "on" && mode !== "off") {
  console.log("Usage: node operator/pause.js on|off");
  process.exit(1);
}
setPaused(mode === "on");
console.log(mode === "on" ? "Pause requested. The operator stops before its next job." : "Unpaused.");