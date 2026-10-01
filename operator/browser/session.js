import { chromium } from "playwright";

const BASE = "http://localhost:4000";

async function openBrowser() {
  const browser = await chromium.launch({ headless: false, slowMo: 800 }); // visible, for the demo
  const page = await browser.newPage();
  page.setDefaultTimeout(8000); // so a hung page becomes an error instead of waiting forever
  return { browser, page };
}

// Duplicate check: asks the tracker what was ACTUALLY saved

async function alreadyApplied(company, jobId, email) {
  // Retry a few times: the tracker may be briefly unreachable (restart, network blip).
  // If it stays down we throw instead of returning false, because "can't check" must
  // never be treated as "not applied yet", or we could submit a duplicate.
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${BASE}/api/applications`);
      const apps = await res.json();
      return apps.some(
        (a) => a.company === company && a.jobId === jobId && a.email === email,
      );
    } catch (err) {
      if (attempt === 3) throw new Error("tracker unreachable: " + err.message);
      await new Promise((r) => setTimeout(r, 1000));//adds 1 second delay before retrying
    }
  }
}

export { openBrowser, BASE, alreadyApplied };
