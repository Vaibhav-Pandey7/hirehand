import { getPage } from "../runtime.js";
import { BASE, alreadyApplied } from "../browser/session.js";
import { applyGeneric } from "../browser/apply.js";

export async function applyToJob(state) {
  const { current: job, candidate } = state;
  const base = { company: job.company, jobId: job.id, title: job.title };

  // Duplicate check against the tracker's real state before touching the form
  if (await alreadyApplied(job.company, job.id, candidate.email)) {
    console.log(`[applyToJob] skip ${job.title}: already in tracker`);
    return {
      outcome: { status: "skipped" }, // <-- ADDED: So graph.js knows it didn't fail
      results: [{ ...base, status: "skipped", reason: "already in tracker" }]
    };
  }

  const page = await getPage();
  const outcome = await applyGeneric(page, `${BASE}/${job.company}/apply/${job.id}`, candidate, job.title);
  console.log(`[applyToJob] ${job.title}: ${outcome.status}${outcome.reason ? " (" + outcome.reason + ")" : ""}`);

  if (outcome.status === "submitted") {
    return { outcome, results: [{ ...base, ...outcome }] }; // <-- Success: write the result
  }

  // Failed: no final result yet. The recover node decides what the outcome is.
  return { outcome, attempts: (state.attempts ?? 0) + 1 }; // <-- Failure: defer result, increment attempts
}