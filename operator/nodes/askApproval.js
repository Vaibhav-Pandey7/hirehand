import { ask } from "../control.js";

export async function askApproval(state) {
  const job = state.current;

  // --yes skips the question. For testing only: the demo should show real approval.
  if (process.env.AUTO_APPROVE === "1") {
    console.log(`[askApproval] auto-approved: ${job.title}`);
    return { approved: true };
  }

  const answer = await ask(
    `\nApply to "${job.title}" at ${job.company} (skill matches: ${job.score})? [y/n] `
  );
  const approved = answer === "y" || answer === "yes";

  if (!approved) {
    console.log(`[askApproval] rejected: ${job.title}`);
    // Record the rejection so the final report shows it instead of silence
    return {
      approved,
      results: [
        { company: job.company, jobId: job.id, title: job.title, status: "skipped", reason: "rejected by user" },
      ],
    };
  }
  return { approved };
}