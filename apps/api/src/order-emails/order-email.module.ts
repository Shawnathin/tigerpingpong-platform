import { Global, Module } from "@nestjs/common";

import { OrderEmailService } from "./order-email.service";

@Global()
@Module({
  exports: [OrderEmailService],
  providers: [OrderEmailService]
})
export class OrderEmailModule {}
