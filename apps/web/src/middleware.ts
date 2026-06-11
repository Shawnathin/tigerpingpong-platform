import { NextRequest, NextResponse } from "next/server";

const BASIC_AUTH_REALM = "Tiger Ping Pong Internal";

export const config = {
  matcher: ["/internal/:path*"]
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

  return NextResponse.next();
}

function unauthorized(): NextResponse {
  return new NextResponse("Authentication required.", {
    headers: {
      "Cache-Control": "no-store",
      "WWW-Authenticate": `Basic realm="${BASIC_AUTH_REALM}", charset="UTF-8"`
    },
    status: 401
  });
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
