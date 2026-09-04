import { Body, Controller, Get, Headers, Param, Patch, Post, Query, Res } from "@nestjs/common";

import { InternalOrdersService } from "./internal-orders.service";

interface InternalOrdersQuery {
  limit?: string;
  status?: string;
}

interface HeaderResponse {
  setHeader(name: string, value: string): void;
}

interface InternalOrderShipmentBody {
  carrier?: unknown;
  carrierCode?: unknown;
  customCarrier?: unknown;
  internalNote?: unknown;
  shippedDate?: unknown;
  trackingNumber?: unknown;
  trackingUrl?: unknown;
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

  @Patch(":publicReference/shipment")
  updateShipment(
    @Res({ passthrough: true }) response: HeaderResponse,
    @Headers("x-internal-orders-token") requestToken: string | string[] | undefined,
    @Param("publicReference") publicReference: string,
    @Body() body: InternalOrderShipmentBody
  ): Promise<unknown> {
    setInternalResponseHeaders(response);

    return this.internalOrdersService.updateShipment(requestToken, publicReference, body);
  }

  @Post(":publicReference/emails/:kind/retry")
  retryEmail(
    @Res({ passthrough: true }) response: HeaderResponse,
    @Headers("x-internal-orders-token") requestToken: string | string[] | undefined,
    @Param("publicReference") publicReference: string,
    @Param("kind") kind: string
  ): Promise<unknown> {
    setInternalResponseHeaders(response);

    return this.internalOrdersService.retryEmail(requestToken, publicReference, kind);
  }
}

function setInternalResponseHeaders(response: HeaderResponse): void {
  for (const [name, value] of Object.entries(INTERNAL_RESPONSE_HEADERS)) {
    response.setHeader(name, value);
  }
}
