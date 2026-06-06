import { Body, Controller, Post } from "@nestjs/common";

import { CheckoutService } from "./checkout.service";

@Controller("checkout")
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post("sessions")
  createSession(@Body() body: unknown): Promise<unknown> {
    return this.checkoutService.createCheckoutSession(body);
  }
}
