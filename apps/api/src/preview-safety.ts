import { PrismaClient } from "@tigerpingpong/db";

export async function verifyPreviewDatabase(): Promise<void> {
  if (process.env.TIGER_PREVIEW_MODE !== "true") return;
  const prisma = new PrismaClient();
  try {
    const marker = await prisma.platformMetadata.findUnique({ where: { key: "preview_dataset" } });
    if (marker?.value !== "synthetic-v1") {
      throw new Error("Preview startup requires the isolated synthetic dataset.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

export function previewReadOnlyGate(
  request: { method: string },
  response: {
    setHeader(name: string, value: string): void;
    status(code: number): { json(body: unknown): void };
  },
  next: () => void
): void {
  response.setHeader("X-Tiger-Preview", "synthetic-read-only");
  response.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    response
      .status(409)
      .json({ message: "Preview is read-only. Payments, webhooks and submissions are disabled." });
    return;
  }
  next();
}
