import http from "node:http";
import https from "node:https";
import { syncBuiltinESMExports } from "node:module";
import { assertPreviewEnvironment } from "./preview-environment.mjs";

assertPreviewEnvironment(process.env, "api");
// Install before loading Nest/Stripe. Database TCP is restricted separately by
// host validation and the synthetic marker. API never needs outbound HTTP in review mode.
const blocked = () => {
  throw new Error("Outbound HTTP is disabled in the isolated Tiger preview.");
};
http.request = blocked;
http.get = blocked;
https.request = blocked;
https.get = blocked;
globalThis.fetch = blocked;
syncBuiltinESMExports();
