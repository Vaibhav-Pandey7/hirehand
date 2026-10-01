import { BASE } from "../browser/session.js";

// Compare what we THINK happened with what the tracker actually holds
export async function verify(state) {
  const apps = await (await fetch(`${BASE}/api/applications`)).json();
  const verified = state.results.map((r) => {
    const saved = apps.filter(
      (a) => a.company === r.company && a.jobId === r.jobId && a.email === state.candidate.email
    ).length;
    return { ...r, saved };
  });
  return { verified };
}