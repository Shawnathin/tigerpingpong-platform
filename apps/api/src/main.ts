import "reflect-metadata";

import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { getApiConfig } from "./config";
import { previewReadOnlyGate, verifyPreviewDatabase } from "./preview-safety";

const SECURITY_HEADERS = {
  "Permissions-Policy":
    "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY"
} as const;

interface HeaderResponse {
  setHeader(name: string, value: string): void;
}

async function bootstrap() {
  await verifyPreviewDatabase();
  const app = await NestFactory.create(AppModule, {
    rawBody: true
  });
  const config = getApiConfig();

  app.getHttpAdapter().getInstance().disable("x-powered-by");
  app.use((_request: unknown, response: HeaderResponse, next: () => void) => {
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      response.setHeader(key, value);
    }

    if (process.env.TIGER_PREVIEW_MODE === "true") {
      response.setHeader("X-Tiger-Preview", "synthetic-read-only");
      response.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
    }

    next();
  });

  app.enableCors({
    origin: config.corsOrigins
  });

  if (process.env.TIGER_PREVIEW_MODE === "true") app.use(previewReadOnlyGate);

  await app.listen(
    config.port,
    process.env.TIGER_PREVIEW_MODE === "true"
      ? (process.env.TIGER_PREVIEW_BIND_HOST ?? "127.0.0.1")
      : "0.0.0.0"
  );
}

void bootstrap();
