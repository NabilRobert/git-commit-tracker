'EOF'
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { SkillManifest } from "./types";
import { EOF } from "dns";

export type LoadedSkill = SkillManifest & { dir: string};

function getSkillsDir(): string {
  const settingsPath = path.join(os.homedir(), ".openclaw", "config", "settings.json");
  const raw = fs.readFileSync(settingsPath, "utf-8");
  const settings = JSON.parse(raw);
  return path.resolve(settings.skills_dir.replace("~", os.homedir()));
}

export async function loadSkills(): Promise<Map<string, LoadedSkill>> {
  const skillsDir = getSkillsDir();
  const result = new Map<string, LoadedSkill>();

  if (!fs.existsSync(skillsDir)) {
    return result;
  }

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const skillDir = path.join(skillsDir, entry.name);
    const manifestPath = path.join(skillDir, "manifest.json");

    if (!fs.existsSync(manifestPath)) continue;

    try {
      const raw = fs.readFileSync(manifestPath, "utf-8");
      const manifest: SkillManifest = JSON.parse(raw);
      result.set(manifest.name, { ...manifest, dir: skillDir });
    } catch {
      console.error(`Skipping ${entry.name} — invalid manifest.json`);
    }
  }

  return result;
}
EOF