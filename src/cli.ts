import { Command } from "commander";
import { loadSkills } from "./loader";
import { runSkill } from "./runner";

const program = new Command();

program
  .name("openclaw")
  .description("Local CLI agent for running skills")
  .version("0.1.0");

program
  .command("list")
  .description("List all installed skills")
  .action(async () => {
    const skills = await loadSkills();

    if (skills.size === 0) {
      console.log("No skills found in ~/.openclaw/skills/");
      return;
    }

    console.log("\nInstalled skills:\n");
    for (const [name, skill] of skills) {
      console.log(`  ${name} v${skill.version}`);
      console.log(`    ${skill.description}`);
      console.log(`    readonly: ${skill.readonly}`);
      console.log();
    }
  });

program
  .command("run <skillName>")
  .description("Run a skill by name")
  .option("-p, --param <items...>", "Parameters as key=value pairs")
  .action(async (skillName: string, options: { param?: string[] }) => {
    const skills = await loadSkills();
    const skill = skills.get(skillName);

    if (!skill) {
      console.error(`Skill "${skillName}" not found. Run "openclaw list" to see available skills.`);
      process.exit(1);
    }

    const params: Record<string, string> = {};
    if (options.param) {
      for (const p of options.param) {
        const [key, ...rest] = p.split("=");
        params[key] = rest.join("=");
      }
    }

    const result = await runSkill({
      skillName,
      parameters: params,
      dir: skill.dir,
      manifest: skill
    });

    if (result.status === "ok") {
      console.log(`\n${result.output}`);
      console.log(`\nCompleted in ${result.duration_ms}ms`);
    } else {
      console.error(`\nError: ${result.output}`);
      process.exit(1);
    }
  });

program.parse(process.argv);