import { Module } from "@nestjs/common";

import { InternalOrdersController } from "./internal-orders.controller";
import { InternalOrdersService } from "./internal-orders.service";

@Module({
  controllers: [InternalOrdersController],
  providers: [InternalOrdersService]
})
export class InternalOrdersModule {}
