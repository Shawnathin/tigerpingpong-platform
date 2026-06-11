import { Controller, Get, Headers, Param, Query, Res } from "@nestjs/common";

import { InternalOrdersService } from "./internal-orders.service";

interface InternalOrdersQuery {
  limit?: string;
  status?: string;
}

interface HeaderResponse {
  setHeader(name: string, value: string): void;
}

const INTERNAL_RESPONSE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Expires: "0",
  Pragma: "no-cache",
  "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet"
};

@Controller("internal/orders")
export class InternalOrdersController {
  constructor(private readonly internalOrdersService: InternalOrdersService) {}

  @Get()
  listOrders(
    @Res({ passthrough: true }) response: HeaderResponse,
    @Headers("x-internal-orders-token") requestToken: string | string[] | undefined,
    @Query() query: InternalOrdersQuery
  ): Promise<unknown> {
    setInternalResponseHeaders(response);

    return this.internalOrdersService.listOrders(requestToken, query);
  }

  @Get(":publicReference")
  getOrder(
    @Res({ passthrough: true }) response: HeaderResponse,
    @Headers("x-internal-orders-token") requestToken: string | string[] | undefined,
    @Param("publicReference") publicReference: string
  ): Promise<unknown> {
    setInternalResponseHeaders(response);

    return this.internalOrdersService.getOrder(requestToken, publicReference);
  }
}

function setInternalResponseHeaders(response: HeaderResponse): void {
  for (const [name, value] of Object.entries(INTERNAL_RESPONSE_HEADERS)) {
    response.setHeader(name, value);
  }
}
