import { parseGoal } from "../nodes/parseGoal.js";
import { parseResume } from "../nodes/parseResume.js";

const goals = [
  "Find 3 backend roles for this candidate and apply",
  "Only remote roles, max 2 applications, then message me on WhatsApp",
  "Apply to Zenith jobs that need under 2 years of experience",
];

for (const g of goals) {
  console.log("\nGOAL:", g);
  console.log(await parseGoal(g));
}

for (const f of ["samples/resume-aarav.txt", "samples/resume-meera.txt"]) {
  console.log("\nRESUME:", f);
  console.log(await parseResume(f));
}