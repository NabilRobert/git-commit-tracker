import * as path from "path";
import * as fs from "fs";
import { spawn } from "child_process";
import { SkillInvocation, SkillResult } from "./types";

export async function runSkill(invocation: SkillInvocation): Promise<SkillResult> {
  const entryPoint = path.resolve(invocation.dir, invocation.manifest.entry_point);

  if (!fs.existsSync(entryPoint)) {
    return {
      status: "error",
      output: `Entry point not found: ${entryPoint}`,
      raw: null,
      duration_ms: 0
    };
  }

  const args = Object.entries(invocation.parameters).map(
    ([key, val]) => `${key}=${val}`
  );

  const start = Date.now();

  return new Promise((resolve) => {
    const child = spawn("node", [entryPoint, ...args], {
      cwd: invocation.dir
    });

    const stdoutChunks: Buffer[] = [];
    let stderrOutput = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdoutChunks.push(chunk);
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderrOutput += chunk.toString();
    });

    const timeout = setTimeout(() => {
      child.kill();
      resolve({
        status: "error",
        output: "Skill timed out after 30 seconds",
        raw: null,
        duration_ms: Date.now() - start
      });
    }, 30000);

    child.on("close", (code) => {
      clearTimeout(timeout);
      const duration_ms = Date.now() - start;
      const raw = Buffer.concat(stdoutChunks).toString("utf-8");

      if (code !== 0) {
        resolve({
          status: "error",
          output: stderrOutput || `Skill exited with code ${code}`,
          raw: null,
          duration_ms
        });
        return;
      }

      try {
        const parsed = JSON.parse(raw);
        resolve({
          status: "ok",
          output: parsed.output ?? JSON.stringify(parsed, null, 2),
          raw: parsed,
          duration_ms
        });
      } catch {
        resolve({
          status: "error",
          output: `Failed to parse skill output as JSON. Raw output:\n${raw}\nStderr:\n${stderrOutput}`,
          raw: null,
          duration_ms
        });
      }
    });
  });
}