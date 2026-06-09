import { Controller, Headers, Post, Req } from "@nestjs/common";

import { StripeWebhookService } from "./stripe-webhook.service";

interface RawBodyRequest {
  rawBody?: Buffer;
}

@Controller("webhooks")
export class StripeWebhookController {
  constructor(private readonly stripeWebhookService: StripeWebhookService) {}

  @Post("stripe")
  receiveStripeWebhook(
    @Req() request: RawBodyRequest,
    @Headers("stripe-signature") signature: string | string[] | undefined
  ): Promise<unknown> {
    return this.stripeWebhookService.receiveWebhook(request.rawBody, signature);
  }
}
