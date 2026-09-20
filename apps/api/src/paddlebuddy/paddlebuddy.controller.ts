import { Body, Controller, Post } from "@nestjs/common";

import { PaddleBuddyService } from "./paddlebuddy.service";

@Controller("paddlebuddy")
export class PaddleBuddyController {
  constructor(private readonly paddleBuddyService: PaddleBuddyService) {}

  @Post("submissions")
  createSubmission(@Body() body: unknown): Promise<{ accepted: true }> {
    return this.paddleBuddyService.createSubmission(body);
  }
}
