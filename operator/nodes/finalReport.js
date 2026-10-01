import { closeBrowser } from "../runtime.js";

export async function finalReport(state) {
  const rows = state.verified;
  const ok = rows.filter((r) => r.status === "submitted" && r.saved === 1);
  const problems = rows.filter((r) => r.status === "failed" || (r.status === "submitted" && r.saved !== 1));

  console.log("\n========== FINAL REPORT ==========");
  console.log(`Candidate: ${state.candidate.name}`);
  console.log(`Targeted: ${rows.length} | Verified applied: ${ok.length} | Skipped: ${rows.filter((r) => r.status === "skipped").length} | Problems: ${problems.length}`);
  for (const r of rows) {
    console.log(` - ${r.company}/${r.title}: ${r.status}${r.reason ? " (" + r.reason + ")" : ""} | rows in tracker: ${r.saved}`);
  }
  if (problems.length) console.log("INCOMPLETE: see problems above");
  console.log("==================================\n");

  await closeBrowser();
  return {};
}