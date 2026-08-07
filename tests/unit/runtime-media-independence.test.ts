import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const WEB_SOURCE_ROOT = path.resolve("apps/web/src");
const SOURCE_EXTENSIONS = new Set([".css", ".js", ".jsx", ".mjs", ".ts", ".tsx"]);

function listSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return listSourceFiles(entryPath);
    }

    return SOURCE_EXTENSIONS.has(path.extname(entry.name)) ? [entryPath] : [];
  });
}

describe("runtime media independence", () => {
  it("does not depend on BigCommerce-hosted assets in active web source", () => {
    const legacyHost = ["bigcommerce", "com"].join(".");
    const dependentFiles = listSourceFiles(WEB_SOURCE_ROOT).filter((filePath) =>
      readFileSync(filePath, "utf8").includes(legacyHost)
    );

    expect(dependentFiles).toEqual([]);
  });
});
