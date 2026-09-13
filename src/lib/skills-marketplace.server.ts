import { promises as fs } from "node:fs";
import path from "node:path";

export type SkillPackage = {
  id: string;
  name: string;
  description: string;
  version: string;
  tags: string[];
  systemPrompt: string;
};

export const BUILTIN_SKILLS: SkillPackage[] = [
  { id: "frontend", name: "Frontend Engineer", description: "React, TypeScript, UI and accessibility workflows.", version: "1.0.0", tags: ["react", "typescript", "ui"], systemPrompt: "Prefer accessible, composable React and TypeScript. Preserve existing design tokens." },
  { id: "backend", name: "Backend Engineer", description: "APIs, server-side code, validation and reliability.", version: "1.0.0", tags: ["api", "server", "reliability"], systemPrompt: "Validate inputs, handle failures explicitly and keep server-only code isolated." },
  { id: "testing", name: "Testing Engineer", description: "Unit, integration and regression testing workflows.", version: "1.0.0", tags: ["test", "quality"], systemPrompt: "Prefer targeted tests first, then broader checks. Report evidence instead of assumptions." },
  { id: "devops", name: "DevOps", description: "Build, deploy, observability and configuration.", version: "1.0.0", tags: ["deploy", "ci", "vercel"], systemPrompt: "Verify environment assumptions and deployment state before changing production." },
  { id: "research", name: "Research Analyst", description: "Multi-source research, comparison and citation workflows.", version: "1.0.0", tags: ["research", "web"], systemPrompt: "Separate sourced facts from inference and prefer current primary sources when available." },
];

function fileFor(workspaceDir: string) { return path.join(workspaceDir, ".roxan", "skills.json"); }

export async function listInstalledSkills(workspaceDir: string): Promise<SkillPackage[]> {
  try {
    const ids = JSON.parse(await fs.readFile(fileFor(workspaceDir), "utf8")) as string[];
    return BUILTIN_SKILLS.filter((skill) => ids.includes(skill.id));
  } catch { return []; }
}

export async function installSkill(workspaceDir: string, id: string) {
  const skill = BUILTIN_SKILLS.find((item) => item.id === id);
  if (!skill) throw new Error(`Skill not found: ${id}`);
  const file = fileFor(workspaceDir);
  await fs.mkdir(path.dirname(file), { recursive: true });
  let ids: string[] = [];
  try { ids = JSON.parse(await fs.readFile(file, "utf8")); } catch { /* first install */ }
  if (!ids.includes(id)) ids.push(id);
  await fs.writeFile(file, JSON.stringify(ids, null, 2), "utf8");
  return skill;
}

export async function uninstallSkill(workspaceDir: string, id: string) {
  const file = fileFor(workspaceDir);
  let ids: string[] = [];
  try { ids = JSON.parse(await fs.readFile(file, "utf8")); } catch { return []; }
  ids = ids.filter((item) => item !== id);
  await fs.writeFile(file, JSON.stringify(ids, null, 2), "utf8");
  return ids;
}
