// Override the base port to run isolated worktrees without disturbing other local servers.
export const webPort = Number(process.env.E2E_BASE_PORT ?? 3100);
if (!Number.isInteger(webPort) || webPort < 1024 || webPort > 65533)
  throw new Error("Invalid E2E_BASE_PORT");
export const mockPort = webPort + 1;
export const apiPort = webPort + 2;
export const webOrigin = `http://127.0.0.1:${webPort}`;
export const mockOrigin = `http://127.0.0.1:${mockPort}`;
export const apiOrigin = `http://127.0.0.1:${apiPort}`;
