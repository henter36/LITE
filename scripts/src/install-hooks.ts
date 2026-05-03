import { copyFileSync, chmodSync, existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const HOOKS_SRC = join(__dirname, "../hooks");
const HOOKS_DEST = join(ROOT, ".git/hooks");

const hooks = ["pre-commit"];

if (!existsSync(HOOKS_DEST)) {
  mkdirSync(HOOKS_DEST, { recursive: true });
}

for (const hook of hooks) {
  const src = join(HOOKS_SRC, hook);
  const dest = join(HOOKS_DEST, hook);
  copyFileSync(src, dest);
  chmodSync(dest, 0o755);
  console.log(`✓  Installed ${hook} → .git/hooks/${hook}`);
}

console.log("\nHooks installed. Run 'git commit' normally to activate them.");
