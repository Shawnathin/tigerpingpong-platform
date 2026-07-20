export const CANONICAL_SITE_ORIGIN = "https://tigerpingpong.ca";

export const LEGACY_REDIRECT_HOSTS = [
  "tigerpingpong.com",
  "www.tigerpingpong.com",
  "www.tigerpingpong.ca"
] as const;

export const LEGACY_PATH_REDIRECTS = [
  ["/paddles/aqua-outdoor-indoor-paddle", "/catalog/products/tiger-aqua-outdoor-indoor-paddle"],
  ["/accessories/aqua-single-coral", "/catalog/products/tiger-aqua-outdoor-indoor-paddle"],
  ["/accessories/aqua-single-ocean-blue", "/catalog/products/tiger-aqua-outdoor-indoor-paddle"],
  [
    "/accessories/aqua-outdoor-paddle-pack-2-pack",
    "/catalog/products/tiger-aqua-outdoor-indoor-paddle"
  ],
  [
    "/accessories/aqua-outdoor-paddle-pack-4-pack",
    "/catalog/products/tiger-aqua-outdoor-indoor-paddle"
  ],
  ["/accessories/table-tennis-net-post-set", "/catalog/products/tiger-net-post-set"],
  [
    "/tables/expo-outdoor-ping-pong-table-grey-green-blue",
    "/catalog/products/tiger-expo-outdoor-table"
  ],
  [
    "/tables/plaza-outdoor-ping-pong-table-grey",
    "/catalog/products/tiger-plaza-outdoor-table-grey"
  ],
  [
    "/tables/portland-indoor-ping-pong-table-grey-green-blue",
    "/catalog/products/tiger-portland-indoor-table"
  ],
  [
    "/tables/portland-outdoor-ping-pong-table-grey-blue",
    "/catalog/products/tiger-portland-outdoor-table"
  ],
  [
    "/accessories/ping-pong-balls-premium-3-star-140-balls-white-orange",
    "/catalog/products/tiger-premium-balls-140"
  ],
  [
    "/accessories/ping-pong-balls-premium-3-star-6-balls-orange",
    "/catalog/products/tiger-premium-balls-6-orange"
  ],
  [
    "/accessories/ping-pong-balls-premium-3-star-white",
    "/catalog/products/tiger-premium-balls-6-white"
  ],
  ["/accessories/ping-pong-table-cover", "/catalog/products/tiger-table-cover-black-polyester"],
  ["/accessories/premium-table-cover", "/catalog/products/tiger-table-cover-black-polyester"],
  ["/accessories/vice-ping-pong-paddle", "/catalog/products/tiger-vice-paddle"],
  [
    "/tables/whistler-indoor-ping-pong-table-in-green-blue",
    "/catalog/products/tiger-whistler-indoor-table"
  ],
  ["/tables/expo-indoor-ping-pong-table-grey-green-blue", "/tables/indoor-tables"],
  ["/replacement-parts/tiger-pingpong-replacement-part-40", "/replacement-parts#part-40"],
  ["/accessories/replacement-net", "/accessories/nets"],
  ["/accessories/tiger-pingpong-table-net-replacement-set", "/accessories/nets"],
  ["/accessories/ping-pong-paddle-case", "/accessories/paddles"],
  ["/accessories/newgy-table-tennis-balls-orange", "/accessories/ping-pong-balls"],
  ["/brands", "/catalog"],
  ["/tiger-pingpong", "/catalog"],
  ["/xmlsitemap.php", "/sitemap.xml"],
  ["/sitemap.php", "/sitemap.xml"],
  ["/shipping", "/shipping-returns"]
] as const satisfies ReadonlyArray<readonly [source: string, destination: string]>;

const legacyRedirectHostSet = new Set<string>(LEGACY_REDIRECT_HOSTS);
const legacyPathRedirectMap = new Map<string, string>(LEGACY_PATH_REDIRECTS);

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

export function getLegacyPathRedirect(pathname: string): string | null {
  return legacyPathRedirectMap.get(normalizePathname(pathname)) ?? null;
}

export function isLegacyRedirectHost(hostname: string): boolean {
  return legacyRedirectHostSet.has(hostname.toLowerCase());
}

export function toCanonicalRedirectUrl(destination: string): URL {
  return new URL(destination, `${CANONICAL_SITE_ORIGIN}/`);
}
