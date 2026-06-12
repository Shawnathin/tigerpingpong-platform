import { UnauthorizedException } from "@nestjs/common";
import { timingSafeEqual } from "crypto";

import { getInternalOrdersApiConfig } from "../config";

export type AdminAuthHeaderValue = string | string[] | undefined;

export function assertAdminApiAuthorized(requestTokenValue: AdminAuthHeaderValue): void {
  const requestToken = normalizeHeaderValue(requestTokenValue);

  try {
    const config = getInternalOrdersApiConfig();

    if (requestToken && isSameToken(config.apiToken, requestToken)) {
      return;
    }
  } catch {
    // Missing server-side token fails closed with the same response as a bad token.
  }

  throw new UnauthorizedException({
    message: "Unauthorized."
  });
}

function normalizeHeaderValue(value: AdminAuthHeaderValue): string | null {
  if (Array.isArray(value)) {
    if (value.length !== 1) {
      return null;
    }

    return normalizeOptionalString(value[0]);
  }

  return normalizeOptionalString(value);
}

function normalizeOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized || null;
}

function isSameToken(expectedToken: string, requestToken: string): boolean {
  const expected = Buffer.from(expectedToken);
  const actual = Buffer.from(requestToken);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
