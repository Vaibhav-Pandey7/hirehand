import { getPage } from "../runtime.js";
import { sendWhatsApp } from "../browser/whatsapp.js";
import { ask, waitIfPaused } from "../control.js";

// Plain code, no LLM: the message must only say what the verified results say
function buildMessage(state) {
  const rows = state.verified;
  const done = rows.filter((r) => r.status === "submitted" && r.saved === 1);
  const problems = rows.filter(
    (r) => r.status === "failed" || (r.status === "submitted" && r.saved !== 1)
  );

  const parts = [`HireHand update for ${state.candidate.name}:`];
  parts.push(
    done.length
      ? `Applied to ${done.length}: ${done.map((r) => `${r.title} at ${r.company}`).join("; ")}.`
      : "No applications were completed."
  );
  if (problems.length) {
    parts.push(
      `Needs attention: ${problems
        .map((r) => `${r.title} at ${r.company} (${r.reason ?? "not confirmed in tracker"})`)
        .join("; ")}.`
    );
  }
  return parts.join(" "); // one line, so there are no newline surprises
}

export async function notify(state) {
  if (!state.goal.sendWhatsApp) return { notice: { status: "not requested" } };

  await waitIfPaused("before sending the WhatsApp message");
  const text = buildMessage(state);

  // Sending a message on someone's behalf needs approval (skipped only by --yes, for testing)
  if (process.env.AUTO_APPROVE !== "1") {
    const answer = await ask(`Send this WhatsApp message?\n"${text}" [y/n] `);
    if (answer !== "y" && answer !== "yes") {
      console.log("[notify] rejected by user");
      return { notice: { status: "skipped", reason: "rejected by user", text } };
    }
  }

  const page = await getPage();
  const outcome = await sendWhatsApp(page, text);
  console.log(`[notify] WhatsApp: ${outcome.status}${outcome.reason ? " (" + outcome.reason + ")" : ""}`);
  return { notice: { ...outcome, text } };
}