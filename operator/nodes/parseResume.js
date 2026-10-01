import path from "path";
import { askJSON } from "../agent.js";

export async function parseResume(filePath) {
  const raw = await askJSON(
    `Extract a candidate profile from the attached resume.
Return JSON with exactly these keys:
- name: string
- email: string
- skills: array of strings
- experienceYears: number (total professional experience, 0 if none)
- roles: array of job titles the candidate has held or targets
- location: string or null
Use only what the resume says. Use null if something is missing. Never invent details.`,
    { filePath }
  );

  if (!raw.name || !raw.email) throw new Error("Resume is missing a name or email");

  return {
    name: String(raw.name),
    email: String(raw.email),
    skills: Array.isArray(raw.skills) ? raw.skills.map(String) : [],
    experienceYears: Number.isFinite(raw.experienceYears) ? raw.experienceYears : 0,
    roles: Array.isArray(raw.roles) ? raw.roles.map(String) : [],
    location: raw.location ?? null,
    resume: path.basename(filePath), // set by code, not by the LLM
  };
}   