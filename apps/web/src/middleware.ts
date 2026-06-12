import { NextRequest, NextResponse } from "next/server";

const BASIC_AUTH_REALM = "Tiger Ping Pong Staff";
const INTERNAL_RESPONSE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Expires: "0",
  Pragma: "no-cache",
  "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet"
};

export const config = {
  matcher: ["/internal/:path*", "/admin", "/admin/:path*"]
};

export function middleware(request: NextRequest) {
  const username = process.env.INTERNAL_ORDERS_BASIC_AUTH_USER?.trim();
  const password = process.env.INTERNAL_ORDERS_BASIC_AUTH_PASSWORD?.trim();

  if (!username || !password) {
    return unauthorized();
  }

  if (!isBasicAuthMatch(request.headers.get("authorization"), username, password)) {
    return unauthorized();
  }

  const response = NextResponse.next();

  setInternalResponseHeaders(response.headers);

  return response;
}

function unauthorized(): NextResponse {
  const response = new NextResponse("Authentication required.", {
    headers: {
      "WWW-Authenticate": `Basic realm="${BASIC_AUTH_REALM}", charset="UTF-8"`
    },
    status: 401
  });

  setInternalResponseHeaders(response.headers);

  return response;
}

function setInternalResponseHeaders(headers: Headers): void {
  for (const [key, value] of Object.entries(INTERNAL_RESPONSE_HEADERS)) {
    headers.set(key, value);
  }
}

function isBasicAuthMatch(
  authorizationHeader: string | null,
  username: string,
  password: string
): boolean {
  if (!authorizationHeader?.startsWith("Basic ")) {
    return false;
  }

  const decoded = decodeBasicAuth(authorizationHeader.slice("Basic ".length));

  if (!decoded) {
    return false;
  }

  const separatorIndex = decoded.indexOf(":");

  if (separatorIndex < 0) {
    return false;
  }

  return (
    decoded.slice(0, separatorIndex) === username && decoded.slice(separatorIndex + 1) === password
  );
}

function decodeBasicAuth(value: string): string | null {
  try {
    return atob(value);
  } catch {
    return null;
  }
}
