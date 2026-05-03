import { readFileSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const ROUTES_DIR = join(ROOT, "artifacts/api-server/src/routes");
const OPENAPI_FILE = join(ROOT, "lib/api-spec/openapi.yaml");

/**
 * Auth and internal routes intentionally excluded from the OpenAPI spec.
 * These are session-based endpoints consumed only by the frontend at runtime.
 */
const EXCLUDED_PATHS = new Set([
  "/auth/login",
  "/auth/logout",
  "/auth/me",
  "/auth/register",
  "/auth/switch-workspace",
]);

/** Convert Express :param → {param} */
function expressToOpenAPIPath(p: string): string {
  return p.replace(/:([A-Za-z_][A-Za-z0-9_]*)/g, "{$1}");
}

/**
 * Normalise a path for comparison: replace every {anything} with {_}
 * so that /workspaces/{workspaceId}/members and /workspaces/{id}/members
 * are treated as the same structural path.
 */
function normalisePath(p: string): string {
  return p.replace(/\{[^}]+\}/g, "{_}");
}

function extractBackendRoutes(): string[] {
  const paths = new Set<string>();
  const files = readdirSync(ROUTES_DIR).filter((f) => f.endsWith(".ts"));

  for (const file of files) {
    const content = readFileSync(join(ROUTES_DIR, file), "utf8");
    // Handles both inline:  router.get("/path", ...)
    // and split-line:       router.get(
    //                         "/path", ...)
    const re = /router\.(get|post|put|patch|delete)\s*\(\s*["']([^"']+)["']/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) {
      const path = expressToOpenAPIPath(m[2]);
      paths.add(path);
    }
  }
  return [...paths];
}

function extractOpenAPIPaths(): Map<string, string[]> {
  const content = readFileSync(OPENAPI_FILE, "utf8");
  const paths = new Map<string, string[]>();

  const lines = content.split("\n");
  let inPaths = false;
  let currentPath: string | null = null;

  for (const line of lines) {
    if (line === "paths:") { inPaths = true; continue; }
    if (!inPaths) continue;
    if (/^\S/.test(line) && line !== "paths:") { inPaths = false; continue; }

    // Path entry:    "  /something:"
    const pathMatch = line.match(/^  (\/[^:]+):/);
    if (pathMatch) {
      currentPath = pathMatch[1].trim();
      paths.set(currentPath, []);
      continue;
    }

    // operationId:   "      operationId: xxx"
    const opIdMatch = line.match(/^\s+operationId:\s+(\S+)/);
    if (opIdMatch && currentPath) {
      paths.get(currentPath)!.push(opIdMatch[1]);
    }
  }

  return paths;
}

const backendPaths = extractBackendRoutes();
const openAPIPaths = extractOpenAPIPaths();

// Build a set of normalised OpenAPI paths for structural comparison
const normalisedOpenAPI = new Set([...openAPIPaths.keys()].map(normalisePath));

let failures = 0;

console.log(
  `Checking ${backendPaths.length} backend routes against ${openAPIPaths.size} OpenAPI paths…\n`,
);

// Check 1: every non-excluded backend route must appear (structurally) in OpenAPI
for (const path of backendPaths) {
  if (EXCLUDED_PATHS.has(path)) continue;
  if (!normalisedOpenAPI.has(normalisePath(path))) {
    console.error(`  FAIL  Missing from OpenAPI: ${path}`);
    failures++;
  }
}

// Check 2: every OpenAPI path must have at least one operationId
for (const [path, opIds] of openAPIPaths) {
  if (opIds.length === 0) {
    console.error(`  FAIL  Missing operationId on OpenAPI path: ${path}`);
    failures++;
  }
}

if (failures === 0) {
  console.log(`✓  OpenAPI parity check passed.`);
  process.exit(0);
} else {
  console.error(`\n✗  OpenAPI parity check FAILED with ${failures} issue(s).`);
  console.error(
    `   Add missing paths to lib/api-spec/openapi.yaml, or add them to EXCLUDED_PATHS if intentionally internal.`,
  );
  process.exit(1);
}
