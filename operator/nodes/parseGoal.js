import { askJSON } from "../agent.js";

export async function parseGoal(goalText) {
  const raw = await askJSON(`You convert a job-hunting goal into filters.
Goal: "${goalText}"
Return JSON with exactly these keys:
- maxApplications: number or null
- remoteOnly: true or false
- roleKeywords: array of lowercase words from wanted job titles ([] if none)
- maxExperienceYears: number or null (the most years of experience a job may ask for)
- companies: array of lowercase company names mentioned ([] means all)
- sendWhatsApp: true only if the goal asks to message or notify someone
Use null, false or [] when the goal doesn't say. Never invent constraints.`);

  // Don't trust the LLM's types: normalize everything
  return {
    maxApplications: Number.isFinite(raw.maxApplications) ? raw.maxApplications : null,
    remoteOnly: raw.remoteOnly === true,
    roleKeywords: Array.isArray(raw.roleKeywords) ? raw.roleKeywords.map((s) => String(s).toLowerCase()) : [],
    maxExperienceYears: Number.isFinite(raw.maxExperienceYears) ? raw.maxExperienceYears : null,
    companies: Array.isArray(raw.companies) ? raw.companies.map((s) => String(s).toLowerCase()) : [],
    sendWhatsApp: raw.sendWhatsApp === true,
  };
}