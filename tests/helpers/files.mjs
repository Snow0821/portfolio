import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const projectRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../..",
);

export function collectFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if ([".git", ".worktrees", "node_modules"].includes(entry.name)) return [];
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? collectFiles(path) : [path];
  });
}

export function referenceExists(sourcePath, reference) {
  const cleanReference = reference.split(/[?#]/)[0];
  const target = resolve(dirname(sourcePath), cleanReference);
  if (!existsSync(target)) return false;
  return !statSync(target).isDirectory() || existsSync(resolve(target, "index.html"));
}

export function countLines(source) {
  if (source === "") return 0;
  const lines = source.split(/\r?\n/).length;
  return source.endsWith("\n") ? lines - 1 : lines;
}

export function findFileLengthViolations(records, exceptions = {}) {
  return records.flatMap(({ path, lines }) => {
    if (lines > 300) return [`${path}: ${lines} lines exceeds 300`];
    if (lines > 200 && !exceptions[path]) {
      return [`${path}: ${lines} lines requires a documented exception`];
    }
    return [];
  });
}

export function extractLocalModuleReferences(source) {
  const patterns = [
    /(?<![@\w])(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g,
    /(?<![@\w])import\(\s*["']([^"']+)["']\s*\)/g,
  ];

  return patterns
    .flatMap((pattern) => [...source.matchAll(pattern)].map((match) => match[1]))
    .filter((reference) => reference.startsWith("./") || reference.startsWith("../"));
}
