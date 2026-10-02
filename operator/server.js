import express from "express";
import path from "node:path";
import util from "node:util";
import { fileURLToPath } from "node:url";
import { bus, getStatus, setPaused, resolveApproval } from "./control.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 4100;
const logs = [];       // recent log lines, so a page opened late still sees the history
const clients = new Set(); // open browser connections (Server-Sent Events)

function broadcast(event, data) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) res.write(msg);
}

export function startServer() {
  // Copy everything the operator prints into the panel too
  const original = console.log;
  console.log = (...args) => {
    original(...args);
    const line = util.format(...args);
    logs.push(line);
    if (logs.length > 500) logs.shift();
    broadcast("log", line);
  };

  bus.on("status", () => broadcast("status", getStatus()));
  setInterval(() => broadcast("status", getStatus()), 1000); // also catches `npm run pause` from another terminal

  const app = express();
  app.use(express.json());

  app.get("/", (req, res) => res.sendFile(path.join(__dirname, "..", "control-panel", "index.html")));

  // Live stream: the browser opens this once and keeps receiving events
  app.get("/events", (req, res) => {
    res.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
    res.flushHeaders();
    for (const line of logs) res.write(`event: log\ndata: ${JSON.stringify(line)}\n\n`);
    res.write(`event: status\ndata: ${JSON.stringify(getStatus())}\n\n`);
    clients.add(res);
    req.on("close", () => clients.delete(res));
  });

  app.post("/pause", (req, res) => {
    setPaused(true);
    res.json(getStatus());
  });
  app.post("/resume", (req, res) => {
    setPaused(false);
    res.json(getStatus());
  });
  app.post("/approve", (req, res) => {
    const answered = resolveApproval(req.body.answer === "y" ? "y" : "n");
    res.json({ answered });
  });

  // Localhost only: the panel has no login, so it must not be reachable from other machines
  app.listen(PORT, "127.0.0.1", () => original(`Control panel: http://localhost:${PORT}`));
}