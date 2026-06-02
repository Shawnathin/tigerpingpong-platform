import "reflect-metadata";

import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { getApiConfig } from "./config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = getApiConfig();

  app.enableCors({
    origin: config.corsOrigins
  });

  await app.listen(config.port);
}

void bootstrap();
