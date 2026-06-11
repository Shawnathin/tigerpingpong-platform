import { Controller, Get, Headers, Param, Query } from "@nestjs/common";

import { InternalOrdersService } from "./internal-orders.service";

interface InternalOrdersQuery {
  limit?: string;
  status?: string;
}

@Controller("internal/orders")
export class InternalOrdersController {
  constructor(private readonly internalOrdersService: InternalOrdersService) {}

  @Get()
  listOrders(
    @Headers("x-internal-orders-token") requestToken: string | string[] | undefined,
    @Query() query: InternalOrdersQuery
  ): Promise<unknown> {
    return this.internalOrdersService.listOrders(requestToken, query);
  }

  @Get(":publicReference")
  getOrder(
    @Headers("x-internal-orders-token") requestToken: string | string[] | undefined,
    @Param("publicReference") publicReference: string
  ): Promise<unknown> {
    return this.internalOrdersService.getOrder(requestToken, publicReference);
  }
}
