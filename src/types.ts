import { EOF } from "node:dns";

export interface SkillManifest {
    name: string;
    description: string;
    version: string;
    entry_point: string;
    readonly: boolean;
    parameters: SkillsParameter[];
}

export interface SkillsParameter {
    name: string;
    type: string;
    description: string;
    required: boolean;
}

export interface SkillInvocation {
    skillName: string;
    parameters: Record<string, string>;
    dir: string;
    manifest: SkillManifest;
}

export interface SkillResult {
  status: "ok" | "error";
  output: string;
  raw: unknown;
  duration_ms: number;
}
EOF
