import "reflect-metadata";

import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { getApiConfig } from "./config";

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
  const app = await NestFactory.create(AppModule, {
    rawBody: true
  });
  const config = getApiConfig();

  app.getHttpAdapter().getInstance().disable("x-powered-by");
  app.use((_request: unknown, response: HeaderResponse, next: () => void) => {
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      response.setHeader(key, value);
    }

    next();
  });

  app.enableCors({
    origin: config.corsOrigins
  });

  await app.listen(config.port);
}

void bootstrap();
