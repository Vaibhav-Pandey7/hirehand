const DEFAULT_MAX = 3;

// plain code, no LLM: matching must be predictable and explainable
export function selectJobs(state) {
  const { goal, candidate, jobs } = state;
  const have = new Set(candidate.skills.map((s) => s.toLowerCase()));
  const maxYears = goal.maxExperienceYears ?? candidate.experienceYears + 1;

  const queue = jobs
    .filter((j) => !goal.remoteOnly || j.remote)
    .filter((j) => goal.roleKeywords.length === 0 || goal.roleKeywords.some((k) => j.title.toLowerCase().includes(k)))
    .filter((j) => j.minExp <= maxYears)
    .map((j) => ({ ...j, score: j.skills.filter((s) => have.has(s.toLowerCase())).length }))
    .filter((j) => j.score > 0) // needs at least one matching skill
    .sort((a, b) => b.score - a.score)
    .slice(0, goal.maxApplications ?? DEFAULT_MAX);

  console.log(`[selectJobs] ${queue.length} selected:`, queue.map((j) => `${j.company}/${j.title}`));
  return { queue };
}

export function pickNextJob(state) {
  const [current, ...rest] = state.queue;
  console.log(`[pickNextJob] ${current.company}/${current.title}`);
  return { current, queue: rest };
}