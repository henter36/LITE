import { execSync } from "child_process";
import { readFileSync, readdirSync, statSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");

const GENERATED_DIRS = [
  "lib/api-client-react/src/generated",
  "lib/api-zod/src/generated",
];

function readDir(dir: string): Record<string, string> {
  const abs = join(ROOT, dir);
  const snapshot: Record<string, string> = {};
  try {
    for (const f of readdirSync(abs)) {
      if (statSync(join(abs, f)).isFile()) {
        snapshot[f] = readFileSync(join(abs, f), "utf8");
      }
    }
  } catch {
    // dir may not exist yet
  }
  return snapshot;
}

// 1. Snapshot generated files before codegen
const before: Record<string, Record<string, string>> = {};
for (const dir of GENERATED_DIRS) {
  before[dir] = readDir(dir);
}

// 2. Run codegen
console.log("Running codegen…");
try {
  execSync("pnpm --filter @workspace/api-spec run codegen", {
    cwd: ROOT,
    stdio: "inherit",
  });
} catch {
  console.error("✗  Codegen failed. Fix the OpenAPI spec or orval config before continuing.");
  process.exit(1);
}

// 3. Compare
const stale: string[] = [];

for (const dir of GENERATED_DIRS) {
  const after = readDir(dir);
  const allFiles = new Set([...Object.keys(before[dir] ?? {}), ...Object.keys(after)]);
  for (const f of allFiles) {
    if (before[dir]?.[f] !== after[f]) {
      stale.push(`${dir}/${f}`);
    }
  }
}

if (stale.length > 0) {
  console.error("\n✗  Generated client was stale. Updated files:");
  for (const f of stale) {
    console.error(`     ${f}`);
  }
  console.error(
    "\n   The generated files have now been updated. Commit them together with the OpenAPI spec change.\n" +
      "   Re-run this check to confirm everything is in sync.",
  );
  process.exit(1);
}

console.log("✓  Generated client is up to date with the OpenAPI spec.");
process.exit(0);
