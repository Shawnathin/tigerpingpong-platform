import type { MetadataRoute } from "next";

import { getCanonicalUrl } from "../lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/internal/", "/api/", "/catalog-preview/", "/checkout/"]
    },
    sitemap: getCanonicalUrl("/sitemap.xml")
  };
}
