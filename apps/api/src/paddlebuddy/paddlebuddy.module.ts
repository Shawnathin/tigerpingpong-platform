import { Module } from "@nestjs/common";

import { PaddleBuddyController } from "./paddlebuddy.controller";
import { PaddleBuddyService } from "./paddlebuddy.service";

@Module({
  controllers: [PaddleBuddyController],
  providers: [PaddleBuddyService]
})
export class PaddleBuddyModule {}
