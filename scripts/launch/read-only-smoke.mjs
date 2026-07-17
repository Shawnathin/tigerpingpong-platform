#!/usr/bin/env node

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!["--web-url", "--api-url", "--expected-origin"].includes(key) || !value) {
      throw new Error(
        "Usage: read-only-smoke.mjs --web-url URL --api-url URL --expected-origin URL"
      );
    }
    values[key.slice(2)] = value;
  }

  for (const key of ["web-url", "api-url", "expected-origin"]) {
    if (!values[key]) {
      throw new Error(`Missing --${key}`);
    }
  }

  return {
    apiUrl: normalizeHttpsBaseUrl(values["api-url"]),
    expectedOrigin: normalizeHttpsBaseUrl(values["expected-origin"]),
    webUrl: normalizeHttpsBaseUrl(values["web-url"])
  };
}

function normalizeHttpsBaseUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "https:") {
    throw new Error("Smoke URLs must use HTTPS.");
  }
  return url.origin;
}

async function checkRoute(name, url, expectedStatus, requiredHeaders = []) {
  try {
    const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(20_000) });
    const missingHeaders = requiredHeaders.filter((header) => !response.headers.has(header));
    const passed = response.status === expectedStatus && missingHeaders.length === 0;
    console.log(
      `${passed ? "PASS" : "FAIL"} ${name}: HTTP ${response.status}; missing headers=${missingHeaders.join(",") || "none"}`
    );
    return passed;
  } catch (error) {
    console.log(`FAIL ${name}: ${error instanceof Error ? error.name : "request error"}`);
    return false;
  }
}

async function checkCors(apiUrl, expectedOrigin) {
  try {
    const response = await fetch(`${apiUrl}/checkout/sessions`, {
      method: "OPTIONS",
      headers: {
        Origin: expectedOrigin,
        "Access-Control-Request-Method": "POST"
      },
      signal: AbortSignal.timeout(20_000)
    });
    const allowOrigin = response.headers.get("access-control-allow-origin");
    const passed = response.ok && allowOrigin === expectedOrigin;
    console.log(
      `${passed ? "PASS" : "FAIL"} final-origin CORS: HTTP ${response.status}; exact origin allowed=${allowOrigin === expectedOrigin}`
    );
    return passed;
  } catch (error) {
    console.log(`FAIL final-origin CORS: ${error instanceof Error ? error.name : "request error"}`);
    return false;
  }
}

async function main() {
  const { apiUrl, expectedOrigin, webUrl } = parseArgs(process.argv.slice(2));
  console.log(
    "TigerPingPong read-only launch smoke. No credentials or response bodies are printed."
  );

  const checks = await Promise.all([
    checkRoute("web home", `${webUrl}/`, 200, ["x-frame-options", "x-content-type-options"]),
    checkRoute("privacy policy", `${webUrl}/privacy-policy`, 200, ["x-frame-options"]),
    checkRoute("terms", `${webUrl}/terms-and-conditions`, 200, ["x-frame-options"]),
    checkRoute("returns policy", `${webUrl}/returns-policy`, 200, ["x-frame-options"]),
    checkRoute("protected admin", `${webUrl}/admin`, 401, ["www-authenticate", "x-robots-tag"]),
    checkRoute("protected internal orders", `${webUrl}/internal/orders`, 401, [
      "www-authenticate",
      "x-robots-tag"
    ]),
    checkRoute("API health", `${apiUrl}/health`, 200, [
      "x-frame-options",
      "x-content-type-options"
    ]),
    checkRoute("catalog readiness", `${apiUrl}/catalog/health`, 200, ["x-frame-options"]),
    checkCors(apiUrl, expectedOrigin)
  ]);

  const failed = checks.filter((passed) => !passed).length;
  console.log(`Read-only smoke complete: ${checks.length - failed} passed, ${failed} failed.`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Read-only smoke failed.");
  process.exit(1);
});
