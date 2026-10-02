import { alreadyApplied } from "../browser/session.js";

const MAX_ATTEMPTS = 2;

export async function recover(state) {
  const { current: job, candidate, outcome, attempts } = state;
  const base = { company: job.company, jobId: job.id, title: job.title };
  const fail = (reason) => ({ results: [{ ...base, status: "failed", reason }] });

  // Nothing was submitted, so retrying can't create a duplicate
  if (!outcome.maybeSaved) {
    if (outcome.retryable && attempts < MAX_ATTEMPTS) {
      console.log(`[recover] ${job.title}: failed before submit, retrying (${attempts}/${MAX_ATTEMPTS})`);
      return { outcome: { status: "retry" } };
    }
    return fail(outcome.reason);
  }

  // A button was clicked, so the server may have saved it. Ask the tracker.
  let saved;
  try {
    saved = await alreadyApplied(job.company, job.id, candidate.email);
  } catch (err) {
    return fail(`cannot confirm tracker state (${err.message}); not retrying, to avoid a duplicate`);
  }

  if (saved) {
    console.log(`[recover] ${job.title}: saved despite error, no retry needed`);
    return { results: [{ ...base, status: "submitted", reason: `saved despite error: ${outcome.reason}` }] };
  }

  if (attempts < MAX_ATTEMPTS) {
    console.log(`[recover] ${job.title}: not saved, retrying (${attempts}/${MAX_ATTEMPTS})`);
    return { outcome: { status: "retry" } };
  }
  return fail(`blocked after ${attempts} attempts: ${outcome.reason}`);
}