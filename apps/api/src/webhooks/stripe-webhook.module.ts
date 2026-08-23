import { Module } from "@nestjs/common";

import { OrderEmailModule } from "../order-emails/order-email.module";
import { StripeWebhookController } from "./stripe-webhook.controller";
import { StripeWebhookService } from "./stripe-webhook.service";

@Module({
  imports: [OrderEmailModule],
  controllers: [StripeWebhookController],
  providers: [StripeWebhookService]
})
export class StripeWebhookModule {}
