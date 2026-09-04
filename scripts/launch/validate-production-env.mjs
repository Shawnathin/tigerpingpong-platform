#!/usr/bin/env node

const VALID_SURFACES = ["web", "api", "all"];
const VALID_MODES = ["test", "live"];

const WEB_VARIABLES = [
  {
    name: "NEXT_PUBLIC_API_BASE_URL",
    surface: "web",
    required: true,
    validator: "public-url"
  },
  {
    name: "NEXT_PUBLIC_SITE_URL",
    surface: "web",
    required: true,
    validator: "public-url"
  },
  {
    name: "INTERNAL_ORDERS_API_TOKEN",
    surface: "web",
    required: true,
    validator: "present"
  },
  {
    name: "INTERNAL_ORDERS_BASIC_AUTH_USER",
    surface: "web",
    required: true,
    validator: "present"
  },
  {
    name: "INTERNAL_ORDERS_BASIC_AUTH_PASSWORD",
    surface: "web",
    required: true,
    validator: "present"
  },
  {
    name: "CLOUDINARY_CLOUD_NAME",
    surface: "web",
    required: false,
    validator: "cloudinary-cloud-name",
    optionalFor: "needs verification"
  },
  {
    name: "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
    surface: "web",
    required: false,
    validator: "cloudinary-cloud-name",
    optionalFor: "needs verification"
  }
];

const API_VARIABLES = [
  {
    name: "DATABASE_URL",
    surface: "api",
    required: true,
    validator: "postgres-url"
  },
  {
    name: "SUPABASE_URL",
    surface: "api",
    required: false,
    validator: "url"
  },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    surface: "api",
    required: false,
    validator: "present"
  },
  {
    name: "CORS_ORIGIN",
    surface: "api",
    required: true,
    validator: "cors-origin"
  },
  {
    name: "PORT",
    surface: "api",
    required: true,
    validator: "port"
  },
  {
    name: "APP_ENV",
    surface: "api",
    required: false,
    validator: "app-env"
  },
  {
    name: "STRIPE_SECRET_KEY",
    surface: "api",
    required: true,
    validator: "stripe-secret"
  },
  {
    name: "STRIPE_WEBHOOK_SECRET",
    surface: "api",
    required: true,
    validator: "stripe-webhook-secret"
  },
  {
    name: "STRIPE_EXPECTED_LIVEMODE",
    surface: "api",
    required: false,
    validator: "livemode"
  },
  {
    name: "STRIPE_TAX_ENABLED",
    surface: "api",
    required: false,
    validator: "boolean"
  },
  {
    name: "CHECKOUT_SUCCESS_URL",
    surface: "api",
    required: true,
    validator: "checkout-success-url"
  },
  {
    name: "CHECKOUT_CANCEL_URL",
    surface: "api",
    required: true,
    validator: "url"
  },
  {
    name: "INTERNAL_ORDERS_API_TOKEN",
    surface: "api",
    required: true,
    validator: "present"
  },
  {
    name: "RESEND_API_KEY",
    surface: "api",
    required: true,
    validator: "resend-api-key"
  },
  {
    name: "ORDER_EMAIL_FROM",
    surface: "api",
    required: true,
    validator: "present"
  },
  {
    name: "ORDER_EMAIL_REPLY_TO",
    surface: "api",
    required: false,
    validator: "present"
  },
  {
    name: "STAFF_ORDER_EMAIL_TO",
    surface: "api",
    required: true,
    validator: "email"
  },
  {
    name: "CLOUDINARY_API_KEY",
    surface: "api",
    required: false,
    validator: "cloudinary-api-key",
    optionalFor: "needs verification"
  },
  {
    name: "CLOUDINARY_API_SECRET",
    surface: "api",
    required: false,
    validator: "present",
    optionalFor: "needs verification"
  },
  {
    name: "DIRECT_URL",
    surface: "api",
    required: false,
    validator: "postgres-url",
    optionalFor: "needs verification"
  },
  {
    name: "NEXT_PUBLIC_API_URL",
    surface: "api",
    required: false,
    validator: "url",
    optionalFor: "needs verification"
  }
];

function printHelp() {
  const text = `TigerPingPong production environment validator (read-only)

Usage:
  node scripts/launch/validate-production-env.mjs [--surface web|api|all] [--expected-mode test|live] [--expected-origin https://example.com] [--help]

Options:
  --surface web|api|all     Scope validation to one surface (default: all)
  --expected-mode test|live Validate STRIPE_EXPECTED_LIVEMODE against intended checkout mode
  --expected-origin URL     Require the HTTPS origin in site, CORS, and checkout return URLs
  --help                    Show this help output

Validation mode:
  * required/optional status
  * safe checks for URL shape, boolean/mode values, and basic required secret prefixes
  * no secret values are printed

Exit code:
  0 = all required variables present and shape-validated
  1 = one or more required variables missing or invalid`;
  console.log(text);
}

function parseArgs(argv) {
  const options = {
    surface: "all",
    expectedMode: null,
    expectedOrigin: null,
    showHelp: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      options.showHelp = true;
      continue;
    }

    if (arg === "--surface") {
      const value = argv[index + 1];
      if (!value || !VALID_SURFACES.includes(value)) {
        throw new Error("--surface must be one of web|api|all");
      }
      options.surface = value;
      index += 1;
      continue;
    }

    if (arg === "--expected-mode") {
      const value = argv[index + 1];
      if (!value || !VALID_MODES.includes(value)) {
        throw new Error("--expected-mode must be one of test|live");
      }
      options.expectedMode = value;
      index += 1;
      continue;
    }

    if (arg === "--expected-origin") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("--expected-origin requires an HTTPS origin");
      }
      options.expectedOrigin = normalizeExpectedOrigin(value);
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function hasValue(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function makeResult(name, surface, required, status, reason) {
  return {
    name,
    surface,
    required: required ? "required" : "optional",
    status,
    reason
  };
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeExpectedOrigin(value) {
  if (!isHttpsUrl(value)) {
    throw new Error("--expected-origin must be a valid HTTPS origin");
  }

  const parsed = new URL(value);
  if (parsed.pathname !== "/" || parsed.search || parsed.hash) {
    throw new Error("--expected-origin must not include a path, query, or fragment");
  }

  return parsed.origin;
}

function isPostgresUrl(value) {
  try {
    const parsed = new URL(value.trim());
    return ["postgres:", "postgresql:"].includes(parsed.protocol) && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

function isBooleanValue(value) {
  return ["true", "false", "1", "0"].includes(value.trim().toLowerCase());
}

function parseBooleanMode(value) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") {
    return "live";
  }
  if (normalized === "false" || normalized === "0") {
    return "test";
  }
  return null;
}

function isAllowedAppEnv(value) {
  return ["local", "staging", "production", "test", "live"].includes(value.trim().toLowerCase());
}

function validatePresenceOnly(name, surface, required) {
  const value = process.env[name];
  if (!hasValue(value)) {
    return makeResult(
      name,
      surface,
      required,
      required ? "missing" : "needs review",
      required ? "required variable is missing" : "optional variable not set"
    );
  }
  return makeResult(name, surface, required, "present", "present (non-empty)");
}

function validateEmail(name, surface, required, value) {
  if (!hasValue(value)) {
    return makeResult(
      name,
      surface,
      required,
      required ? "missing" : "needs review",
      required ? "required variable is missing" : "optional variable not set"
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    return makeResult(name, surface, required, "invalid", "must be a valid email address");
  }

  return makeResult(name, surface, required, "present", "valid email address shape");
}

function validateUrl(name, surface, required, value, expectedOrigin = null) {
  if (!hasValue(value)) {
    return makeResult(
      name,
      surface,
      required,
      required ? "missing" : "needs review",
      required ? "required variable is missing" : "optional variable not set"
    );
  }

  if (!isHttpsUrl(value)) {
    return makeResult(name, surface, required, "invalid", "must be a valid HTTPS URL");
  }

  if (expectedOrigin && new URL(value).origin !== expectedOrigin) {
    return makeResult(
      name,
      surface,
      required,
      "invalid",
      "origin does not match --expected-origin"
    );
  }

  return makeResult(name, surface, required, "present", "valid HTTPS URL");
}

function validatePostgresUrl(name, surface, required, value) {
  if (!hasValue(value)) {
    return makeResult(
      name,
      surface,
      required,
      required ? "missing" : "needs review",
      required ? "required variable is missing" : "optional variable not set"
    );
  }

  if (!isPostgresUrl(value)) {
    return makeResult(name, surface, required, "invalid", "must be a valid PostgreSQL URL");
  }

  return makeResult(name, surface, required, "present", "valid PostgreSQL URL shape");
}

function validateCorsOrigin(name, surface, required, value, expectedOrigin) {
  if (!hasValue(value)) {
    return makeResult(
      name,
      surface,
      required,
      required ? "missing" : "needs review",
      required ? "required variable is missing" : "optional variable not set"
    );
  }

  const origins = value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (origins.length === 0) {
    return makeResult(
      name,
      surface,
      required,
      "invalid",
      "must include at least one HTTP(S) origin"
    );
  }

  for (const origin of origins) {
    if (!isHttpsUrl(origin)) {
      return makeResult(
        name,
        surface,
        required,
        "invalid",
        "one or more origins are not HTTPS URLs"
      );
    }
  }

  const normalizedOrigins = origins.map((origin) => new URL(origin).origin);
  if (expectedOrigin && !normalizedOrigins.includes(expectedOrigin)) {
    return makeResult(name, surface, required, "invalid", "does not include --expected-origin");
  }

  return makeResult(name, surface, required, "present", `${origins.length} origin(s) configured`);
}

function validateBoolean(name, surface, required, value, reasonIfMissing) {
  if (!hasValue(value)) {
    return makeResult(
      name,
      surface,
      required,
      required ? "missing" : "needs review",
      reasonIfMissing || (required ? "required variable is missing" : "optional variable not set")
    );
  }

  if (!isBooleanValue(value)) {
    return makeResult(name, surface, required, "invalid", "allowed values: true, false, 1, 0");
  }

  return makeResult(name, surface, required, "present", "valid boolean shape");
}

function validateAppEnv(name, surface, required, value) {
  if (!hasValue(value)) {
    return makeResult(name, surface, required, "needs review", "optional variable not set");
  }

  if (!isAllowedAppEnv(value)) {
    return makeResult(
      name,
      surface,
      required,
      "invalid",
      "must be one of: local, staging, production, test, live"
    );
  }

  return makeResult(name, surface, required, "present", "allowed runtime mode");
}

function validatePort(name, surface, required, value) {
  if (!hasValue(value)) {
    return makeResult(
      name,
      surface,
      required,
      required ? "missing" : "needs review",
      required ? "required variable is missing" : "optional variable not set"
    );
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return makeResult(name, surface, required, "invalid", "must be a positive integer");
  }

  return makeResult(name, surface, required, "present", `port parsed as ${parsed}`);
}

function validateStripeExpectedMode(name, surface, required, value, expectedMode) {
  const modeRequired = required || Boolean(expectedMode);
  if (!hasValue(value)) {
    return makeResult(
      name,
      surface,
      modeRequired,
      modeRequired ? "missing" : "needs review",
      expectedMode
        ? `--expected-mode ${expectedMode} was requested but variable is not set`
        : "optional variable not set"
    );
  }

  const resolvedMode = parseBooleanMode(value);
  if (!resolvedMode) {
    return makeResult(name, surface, modeRequired, "invalid", "allowed values: true, false, 1, 0");
  }

  if (expectedMode && expectedMode !== resolvedMode) {
    return makeResult(
      name,
      surface,
      modeRequired,
      "invalid",
      `resolved to ${resolvedMode} but --expected-mode is ${expectedMode}`
    );
  }

  return makeResult(name, surface, modeRequired, "present", "value is present and mode-checks");
}

function validateCheckoutSuccessUrl(name, surface, required, value, expectedOrigin) {
  const baseResult = validateUrl(name, surface, required, value, expectedOrigin);
  if (baseResult.status !== "present") {
    return baseResult;
  }

  if (!value.includes("{CHECKOUT_SESSION_ID}")) {
    return makeResult(
      name,
      surface,
      required,
      "invalid",
      "must include {CHECKOUT_SESSION_ID} placeholder"
    );
  }

  return makeResult(
    name,
    surface,
    required,
    "present",
    "valid URL with checkout session placeholder"
  );
}

function validateCloudinaryCloudName(name, surface, required, value) {
  if (!hasValue(value)) {
    return makeResult(
      name,
      surface,
      required,
      required ? "needs review" : "needs review",
      required ? "required variable not set" : "optional variable not set"
    );
  }
  const trimmed = value.trim();
  if (!/^[a-z0-9][a-z0-9_-]{1,58}[a-z0-9]$/i.test(trimmed)) {
    return makeResult(name, surface, required, "invalid", "cloud name format looks unsafe");
  }
  return makeResult(name, surface, required, "present", "present (non-empty)");
}

function validateCloudinaryApiKey(name, surface, required, value) {
  if (!hasValue(value)) {
    return makeResult(
      name,
      surface,
      required,
      required ? "needs review" : "needs review",
      required ? "required variable not set" : "optional variable not set"
    );
  }

  if (!/^\d+$/.test(value.trim())) {
    return makeResult(name, surface, required, "invalid", "cloudinary key should be numeric");
  }

  return makeResult(name, surface, required, "present", "present and numeric");
}

function validateSecret(name, surface, required, value, expectedPrefix) {
  if (!hasValue(value)) {
    return makeResult(
      name,
      surface,
      required,
      required ? "missing" : "needs review",
      required ? "required variable is missing" : "optional variable not set"
    );
  }

  if (expectedPrefix && !value.trim().startsWith(expectedPrefix)) {
    return makeResult(
      name,
      surface,
      required,
      "invalid",
      `does not start with expected prefix ${expectedPrefix}`
    );
  }

  return makeResult(name, surface, required, "present", "present and non-empty");
}

function validateStripeSecret(name, surface, required, value, expectedMode) {
  const expectedPrefix =
    expectedMode === "test" ? "sk_test_" : expectedMode === "live" ? "sk_live_" : "sk_";
  return validateSecret(name, surface, required, value, expectedPrefix);
}

function validateDefinition(definition, expectedMode, expectedOrigin) {
  const value = process.env[definition.name];

  switch (definition.validator) {
    case "present":
      return validatePresenceOnly(definition.name, definition.surface, definition.required);
    case "email":
      return validateEmail(definition.name, definition.surface, definition.required, value);
    case "public-url":
      return validateUrl(
        definition.name,
        definition.surface,
        definition.required,
        value,
        definition.name === "NEXT_PUBLIC_SITE_URL" ? expectedOrigin : null
      );
    case "url":
      return validateUrl(
        definition.name,
        definition.surface,
        definition.required,
        value,
        definition.name === "CHECKOUT_CANCEL_URL" ? expectedOrigin : null
      );
    case "postgres-url":
      return validatePostgresUrl(definition.name, definition.surface, definition.required, value);
    case "cors-origin":
      return validateCorsOrigin(
        definition.name,
        definition.surface,
        definition.required,
        value,
        expectedOrigin
      );
    case "port":
      return validatePort(definition.name, definition.surface, definition.required, value);
    case "app-env":
      return validateAppEnv(definition.name, definition.surface, definition.required, value);
    case "stripe-secret":
      return validateStripeSecret(
        definition.name,
        definition.surface,
        definition.required,
        value,
        expectedMode
      );
    case "stripe-webhook-secret":
      return validateSecret(
        definition.name,
        definition.surface,
        definition.required,
        value,
        "whsec_"
      );
    case "resend-api-key":
      return validateSecret(definition.name, definition.surface, definition.required, value, "re_");
    case "livemode":
      return validateStripeExpectedMode(
        definition.name,
        definition.surface,
        definition.required,
        value,
        expectedMode
      );
    case "boolean":
      return validateBoolean(definition.name, definition.surface, definition.required, value);
    case "checkout-success-url":
      return validateCheckoutSuccessUrl(
        definition.name,
        definition.surface,
        definition.required,
        value,
        expectedOrigin
      );
    case "cloudinary-cloud-name":
      return validateCloudinaryCloudName(
        definition.name,
        definition.surface,
        definition.required,
        value
      );
    case "cloudinary-api-key":
      return validateCloudinaryApiKey(
        definition.name,
        definition.surface,
        definition.required,
        value
      );
    default:
      return makeResult(
        definition.name,
        definition.surface,
        definition.required,
        "needs review",
        "no validator mapped"
      );
  }
}

function buildRows(surface, expectedMode, expectedOrigin) {
  const all = [...WEB_VARIABLES, ...API_VARIABLES];
  const selected = all.filter((entry) => (surface === "all" ? true : entry.surface === surface));
  return selected.map((definition) => validateDefinition(definition, expectedMode, expectedOrigin));
}

function printRow(value, width) {
  const valueAsString = String(value);
  return valueAsString.padEnd(width, " ");
}

function printReport(results, targetSurface, expectedMode, expectedOrigin) {
  console.log("");
  console.log("TigerPingPong production environment validator");
  console.log(`Execution surface: ${targetSurface}`);
  console.log(`Expected Stripe mode check: ${expectedMode || "not set"}`);
  console.log(`Expected public origin check: ${expectedOrigin || "not set"}`);
  console.log("No secret values are printed. This command is read-only.");
  console.log("");

  const headers = {
    name: "Variable",
    surface: "Surface",
    required: "Required",
    status: "Status",
    reason: "Safe reason"
  };

  const rows = results.map((result) => ({
    name: result.name,
    surface: result.surface,
    required: result.required,
    status: result.status,
    reason: result.reason
  }));

  const widths = {
    name: Math.max(headers.name.length, ...rows.map((row) => row.name.length)),
    surface: Math.max(headers.surface.length, ...rows.map((row) => row.surface.length)),
    required: Math.max(headers.required.length, ...rows.map((row) => row.required.length)),
    status: Math.max(headers.status.length, ...rows.map((row) => row.status.length)),
    reason: Math.max(headers.reason.length, ...rows.map((row) => row.reason.length))
  };

  const headerLine = `${printRow(headers.name, widths.name)} | ${printRow(
    headers.surface,
    widths.surface
  )} | ${printRow(headers.required, widths.required)} | ${printRow(headers.status, widths.status)} | ${headers.reason}`;

  const separator = `${"-".repeat(widths.name)}-+-${"-".repeat(
    widths.surface
  )}-+-${"-".repeat(widths.required)}-+-${"-".repeat(widths.status)}-+${"-".repeat(widths.reason)}`;

  console.log(headerLine);
  console.log(separator);

  for (const row of rows) {
    console.log(
      `${printRow(row.name, widths.name)} | ${printRow(row.surface, widths.surface)} | ${printRow(
        row.required,
        widths.required
      )} | ${printRow(row.status, widths.status)} | ${row.reason}`
    );
  }

  const requiredFailures = results.filter(
    (result) =>
      result.required === "required" && (result.status === "missing" || result.status === "invalid")
  ).length;
  const optionalWarnings = results.filter(
    (result) =>
      result.required === "optional" &&
      (result.status === "invalid" || result.status === "needs review")
  ).length;

  console.log("");
  console.log(
    `Summary: required failures=${requiredFailures}, optional warnings/review=${optionalWarnings}`
  );
  console.log("Tip: run this from the intended shell so the expected environment is loaded.");
  return requiredFailures > 0 ? 1 : 0;
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.showHelp) {
      printHelp();
      return;
    }

    const results = buildRows(options.surface, options.expectedMode, options.expectedOrigin);
    const exitCode = printReport(
      results,
      options.surface,
      options.expectedMode,
      options.expectedOrigin
    );
    process.exit(exitCode);
  } catch (error) {
    if (error && error instanceof Error) {
      console.error(error.message);
    } else {
      console.error("failed to run validator");
    }
    process.exit(1);
  }
}

main();
