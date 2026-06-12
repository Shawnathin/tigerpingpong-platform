import { Module } from "@nestjs/common";

import { AdminModule } from "./admin/admin.module";
import { CatalogModule } from "./catalog/catalog.module";
import { CheckoutModule } from "./checkout/checkout.module";
import { HealthController } from "./health.controller";
import { InternalOrdersModule } from "./internal-orders/internal-orders.module";
import { StripeWebhookModule } from "./webhooks/stripe-webhook.module";

@Module({
  imports: [AdminModule, CatalogModule, CheckoutModule, InternalOrdersModule, StripeWebhookModule],
  controllers: [HealthController]
})
export class AppModule {}
