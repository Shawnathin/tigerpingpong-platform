import { spawn } from "node:child_process";
import { assertPreviewEnvironment } from "./preview-environment.mjs";

assertPreviewEnvironment(process.env, "api");
const child = spawn(
  process.execPath,
  ["--import", "./scripts/railway/api-network-guard.mjs", "apps/api/dist/main.js"],
  {
    stdio: "inherit",
    env: process.env
  }
);
for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => child.kill(signal));
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
