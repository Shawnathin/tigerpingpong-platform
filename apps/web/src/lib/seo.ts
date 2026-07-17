import type { Metadata } from "next";

const DEFAULT_SITE_URL = "https://tigerpingpong.ca";

function normalizeSiteUrl(value: string | undefined): string {
  if (!value) {
    return DEFAULT_SITE_URL;
  }

  try {
    const parsedUrl = new URL(value);

    if (parsedUrl.hostname === "localhost" || parsedUrl.hostname.endsWith(".localhost")) {
      return DEFAULT_SITE_URL;
    }

    if (parsedUrl.hostname.endsWith(".onrender.com")) {
      return DEFAULT_SITE_URL;
    }

    parsedUrl.hash = "";
    parsedUrl.pathname = "";
    parsedUrl.search = "";

    return parsedUrl.toString().replace(/\/$/, "");
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export function getSiteUrl(): string {
  return normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
}

export function getCanonicalUrl(pathname: string): string {
  const normalizedPathname = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return new URL(normalizedPathname, `${getSiteUrl()}/`).toString();
}

export function getPathMetadata({
  description,
  pathname,
  title,
  type = "website"
}: {
  description?: string;
  pathname: string;
  title: string;
  type?: "website" | "article";
}): Metadata {
  const url = getCanonicalUrl(pathname);

  return {
    title,
    description,
    alternates: {
      canonical: url
    },
    openGraph: {
      title,
      description,
      type,
      url,
      siteName: "Tiger Ping Pong"
    }
  };
}
