#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const PATTERNS = [
  { name: "Stripe secret key", expression: "sk_(live|test)_[A-Za-z0-9]{16,}" },
  { name: "Stripe webhook secret", expression: "whsec_[A-Za-z0-9]{16,}" },
  {
    name: "JWT-like token",
    expression: "eyJ[A-Za-z0-9_-]{20,}\\.[A-Za-z0-9_-]{20,}\\.[A-Za-z0-9_-]{20,}"
  },
  { name: "Private key header", expression: "-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----" }
];

let findingCount = 0;

for (const pattern of PATTERNS) {
  const result = spawnSync(
    "git",
    ["grep", "--cached", "-IlE", "-e", pattern.expression, "--", ":(exclude)pnpm-lock.yaml"],
    { encoding: "utf8" }
  );

  if (![0, 1].includes(result.status ?? 1)) {
    console.error(`Secret scan could not check ${pattern.name}.`);
    process.exit(1);
  }

  const files = result.stdout.trim().split("\n").filter(Boolean);
  findingCount += files.length;
  console.log(`${pattern.name}: ${files.length} tracked file(s)`);
  for (const file of files) {
    console.log(`  ${file}`);
  }
}

console.log(`Tracked secret scan complete: ${findingCount} finding(s). Values were not printed.`);
process.exit(findingCount === 0 ? 0 : 1);
