import { Body, Controller, Post, Req } from "@nestjs/common";

import { PaddleBuddyService } from "./paddlebuddy.service";

interface PaddleBuddyRequest {
  ip?: string;
  socket: { remoteAddress?: string };
}

@Controller("paddlebuddy")
export class PaddleBuddyController {
  constructor(private readonly paddleBuddyService: PaddleBuddyService) {}

  @Post("submissions")
  createSubmission(
    @Body() body: unknown,
    @Req() request: PaddleBuddyRequest
  ): Promise<{ accepted: true }> {
    return this.paddleBuddyService.createSubmission(
      body,
      request.ip || request.socket.remoteAddress || "unknown"
    );
  }
}
