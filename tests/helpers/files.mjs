import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const projectRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../..",
);

export function collectFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if ([".git", "node_modules"].includes(entry.name)) return [];
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
