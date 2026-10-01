import { openBrowser, BASE, alreadyApplied } from "../browser/session.js";
import { applyGeneric } from "../browser/apply.js";

(async () => {
  const candidate = {
    name: "Test Candidate",
    email: "candidate@example.com",
    resume: "resume.pdf",
    skills: ["Node.js", "MongoDB"],
  };
  const { browser, page } = await openBrowser();
  for (const [co, id] of [
    ["acme", "a1"],
    ["zenith", "z1"],
  ]) {
    if (await alreadyApplied(co, id, candidate.email)) {
      console.log(co, id, "already applied, skipping");
      continue;
    }
    console.log(
      co,
      id,
      await applyGeneric(
        page,
        `${BASE}/${co}/apply/${id}`,
        candidate,
        "Backend role",
      ),
    );
  }
  await page.waitForTimeout(2000);
  await browser.close();
})();
