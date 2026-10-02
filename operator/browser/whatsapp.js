import { BASE } from "./session.js";

// Form submission turns newlines into \r\n, so compare in a normalized form
const norm = (s) => String(s).replace(/\r\n/g, "\n").trim();

async function readMessages() {
  const res = await fetch(`${BASE}/api/messages`);
  return res.json();
}

export async function sendWhatsApp(page, text) {
  // Never send the same message twice (a resumed run could try again)
  const before = await readMessages();
  if (before.some((m) => norm(m.text) === norm(text))) {
    return { status: "skipped", reason: "identical message already in chat" };
  }

  let error = null;
  try {
    await page.goto(`${BASE}/whatsapp`);
    await page.fill("#msg", text);
    await page.click("#send");
    await page.waitForLoadState("load");
  } catch (err) {
    error = err.message.split("\n")[0]; // don't give up yet: the message may still have gone out
  }

  // Verify by reading the chat, not by trusting that the click worked
  const after = await readMessages();
  if (after.some((m) => norm(m.text) === norm(text))) {
    return { status: "sent", reason: error ? `sent despite error: ${error}` : undefined };
  }
  return { status: "failed", reason: error || "message not found in chat after sending" };
}