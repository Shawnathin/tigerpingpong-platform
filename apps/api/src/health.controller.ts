import { Controller, Get } from "@nestjs/common";
import { createApiHealthResponse, type ApiHealthResponse } from "@tigerpingpong/shared";

@Controller()
export class HealthController {
  @Get("health")
  check(): ApiHealthResponse {
    return createApiHealthResponse();
  }
}
