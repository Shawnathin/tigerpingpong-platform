import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(path.resolve(".github/workflows/branch-policy.yml"), "utf8");

describe("protected branch promotion policy", () => {
  it("allows only this repository's develop branch to target main", () => {
    expect(workflow).toContain('if [ "$BASE_REF" = "main" ]; then');
    expect(workflow).toContain('[ "$HEAD_REF" != "develop" ]');
    expect(workflow).toContain('[ "$HEAD_REPOSITORY" != "$TARGET_REPOSITORY" ]');
  });

  it("requires dedicated task branches for pull requests into develop", () => {
    expect(workflow).toContain(
      'if [ "$BASE_REF" = "develop" ] && { [ "$HEAD_REF" = "main" ] || [ "$HEAD_REF" = "develop" ]; }; then'
    );
  });

  it("does not recreate the release-only merge ancestry cycle", () => {
    expect(workflow).not.toContain("/compare/");
    expect(workflow).not.toContain("must be an ancestor of develop");
    expect(workflow).not.toContain("history-only reconciliation");
  });

  it("continues to require the merge-only protected-lane ruleset", () => {
    expect(workflow).toContain('select(.type == "pull_request"');
    expect(workflow).toContain('.parameters.allowed_merge_methods == ["merge"]');
  });
});
