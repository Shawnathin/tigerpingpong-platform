import { spawn } from "node:child_process";
import { assertPreviewEnvironment } from "./preview-environment.mjs";

assertPreviewEnvironment(process.env, "web");
const child = spawn(
  process.execPath,
  [
    "apps/web/node_modules/next/dist/bin/next",
    "start",
    "apps/web",
    "--port",
    process.env.PORT ?? "3000",
    "--hostname",
    process.env.TIGER_PREVIEW_BIND_HOST ?? "127.0.0.1"
  ],
  {
    stdio: "inherit",
    env: process.env
  }
);
for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => child.kill(signal));
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
