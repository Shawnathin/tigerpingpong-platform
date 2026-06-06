import { Module } from "@nestjs/common";

import { CatalogModule } from "./catalog/catalog.module";
import { CheckoutModule } from "./checkout/checkout.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [CatalogModule, CheckoutModule],
  controllers: [HealthController]
})
export class AppModule {}
