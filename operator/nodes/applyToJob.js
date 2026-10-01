import { getPage } from "../runtime.js";
import { BASE, alreadyApplied } from "../browser/session.js";
import { applyGeneric } from "../browser/apply.js";

export async function applyToJob(state) {
  const { current: job, candidate } = state;
  const base = { company: job.company, jobId: job.id, title: job.title };

  // Duplicate check against the tracker's real state before touching the form
  if (await alreadyApplied(job.company, job.id, candidate.email)) {
    console.log(`[applyToJob] skip ${job.title}: already in tracker`);
    return { results: [{ ...base, status: "skipped", reason: "already in tracker" }] };
  }

  const page = await getPage();
  const outcome = await applyGeneric(page, `${BASE}/${job.company}/apply/${job.id}`, candidate, job.title);
  console.log(`[applyToJob] ${job.title}: ${outcome.status}`);
  return { results: [{ ...base, ...outcome }] };
}