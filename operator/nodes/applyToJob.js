import { getPage } from "../runtime.js";
import { BASE, alreadyApplied } from "../browser/session.js";
import { applyGeneric } from "../browser/apply.js";
import { waitIfPaused } from "../control.js";

export async function applyToJob(state) {
  const { current: job, candidate } = state;
  const base = { company: job.company, jobId: job.id, title: job.title };

  // Second pause point: covers a pause requested while the approval prompt was open
  await waitIfPaused(`before applying to ${job.title}`);

  // Duplicate check against the tracker's real state before touching the form
  if (await alreadyApplied(job.company, job.id, candidate.email)) {
    console.log(`[applyToJob] skip ${job.title}: already in tracker`);
    return {
      outcome: { status: "skipped" },
      results: [{ ...base, status: "skipped", reason: "already in tracker" }],
    };
  }

  const page = await getPage();
  const outcome = await applyGeneric(page, `${BASE}/${job.company}/apply/${job.id}`, candidate, job.title);
  console.log(`[applyToJob] ${job.title}: ${outcome.status}${outcome.reason ? " (" + outcome.reason + ")" : ""}`);

  if (outcome.status === "submitted") return { outcome, results: [{ ...base, ...outcome }] };

  // Failed: no final result yet. The recover node decides what the outcome is.
  return { outcome, attempts: (state.attempts ?? 0) + 1 };
}