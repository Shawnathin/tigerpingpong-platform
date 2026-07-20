import { getSitemapEntries, serializeSitemap } from "../../lib/sitemap";

export async function GET(): Promise<Response> {
  try {
    const entries = await getSitemapEntries();

    return new Response(serializeSitemap(entries), {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
        "Content-Type": "application/xml; charset=utf-8"
      }
    });
  } catch {
    return new Response("Sitemap temporarily unavailable.", {
      status: 503,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8",
        "Retry-After": "300"
      }
    });
  }
}
