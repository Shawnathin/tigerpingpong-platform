import { Module } from "@nestjs/common";

import { OrderEmailModule } from "../order-emails/order-email.module";
import { InternalOrdersController } from "./internal-orders.controller";
import { InternalOrdersService } from "./internal-orders.service";

@Module({
  imports: [OrderEmailModule],
  controllers: [InternalOrdersController],
  providers: [InternalOrdersService]
})
export class InternalOrdersModule {}
