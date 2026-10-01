import { getPage } from "../runtime.js";
import { BASE } from "../browser/session.js";

const COMPANIES = ["acme", "zenith"];

export async function findJobs(state) {
  const page = await getPage();
  const wanted = state.goal.companies.length ? state.goal.companies : COMPANIES;
  const jobs = [];

  for (const company of wanted.filter((c) => COMPANIES.includes(c))) {
    await page.goto(`${BASE}/${company}/jobs`);
    // Runs inside the page: reads each job card's text into a plain object
    const found = await page.$$eval(".job", (cards) =>//runs this callback function in the browser 
      cards.map((el) => {
        const [title, meta, skills] = el.innerText.split("\n").map((s) => s.trim()).filter(Boolean);
        const [location, mode, yrs] = meta.split("|").map((s) => s.trim());
        const [minExp, maxExp] = yrs.replace(/yrs?/, "").trim().split("-").map(Number);
        return {
          id: el.dataset.jobId,
          title,
          location,
          remote: mode === "Remote",
          minExp,
          maxExp,
          skills: skills.replace("Skills:", "").split(",").map((s) => s.trim()),
        };
      })
    );
    jobs.push(...found.map((j) => ({ ...j, company })));
  }
  console.log(`[findJobs] found ${jobs.length} jobs`);
  return { jobs };
}