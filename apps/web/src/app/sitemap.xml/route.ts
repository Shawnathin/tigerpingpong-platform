import { getSitemapEntries, serializeSitemap } from "../../lib/sitemap";

export async function GET(): Promise<Response> {
  const entries = await getSitemapEntries();

  return new Response(serializeSitemap(entries), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8"
    }
  });
}
