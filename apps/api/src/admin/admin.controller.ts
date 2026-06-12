import { Controller, Get, Headers, Param, Query, Res } from "@nestjs/common";

import { AdminService } from "./admin.service";
import { AdminAuthHeaderValue, assertAdminApiAuthorized } from "./admin-auth";

interface HeaderResponse {
  setHeader(name: string, value: string): void;
}

interface AdminListQuery {
  limit?: string;
  status?: string;
}

const ADMIN_RESPONSE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Expires: "0",
  Pragma: "no-cache",
  "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet"
};

@Controller("api/admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("dashboard/summary")
  getDashboardSummary(
    @Res({ passthrough: true }) response: HeaderResponse,
    @Headers("x-internal-orders-token") requestToken: AdminAuthHeaderValue
  ): Promise<unknown> {
    this.assertAuthorized(response, requestToken);

    return this.adminService.getDashboardSummary();
  }

  @Get("products")
  listProducts(
    @Res({ passthrough: true }) response: HeaderResponse,
    @Headers("x-internal-orders-token") requestToken: AdminAuthHeaderValue,
    @Query() query: AdminListQuery
  ): Promise<unknown> {
    this.assertAuthorized(response, requestToken);

    return this.adminService.listProducts(query);
  }

  @Get("products/:id")
  getProduct(
    @Res({ passthrough: true }) response: HeaderResponse,
    @Headers("x-internal-orders-token") requestToken: AdminAuthHeaderValue,
    @Param("id") id: string
  ): Promise<unknown> {
    this.assertAuthorized(response, requestToken);

    return this.adminService.getProduct(id);
  }

  @Get("orders")
  listOrders(
    @Res({ passthrough: true }) response: HeaderResponse,
    @Headers("x-internal-orders-token") requestToken: AdminAuthHeaderValue,
    @Query() query: AdminListQuery
  ): Promise<unknown> {
    this.assertAuthorized(response, requestToken);

    return this.adminService.listOrders(query);
  }

  @Get("orders/:id")
  getOrder(
    @Res({ passthrough: true }) response: HeaderResponse,
    @Headers("x-internal-orders-token") requestToken: AdminAuthHeaderValue,
    @Param("id") id: string
  ): Promise<unknown> {
    this.assertAuthorized(response, requestToken);

    return this.adminService.getOrder(id);
  }

  @Get("customers")
  listCustomers(
    @Res({ passthrough: true }) response: HeaderResponse,
    @Headers("x-internal-orders-token") requestToken: AdminAuthHeaderValue
  ): Promise<unknown> {
    this.assertAuthorized(response, requestToken);

    return this.adminService.listCustomers();
  }

  @Get("inventory")
  getInventory(
    @Res({ passthrough: true }) response: HeaderResponse,
    @Headers("x-internal-orders-token") requestToken: AdminAuthHeaderValue
  ): Promise<unknown> {
    this.assertAuthorized(response, requestToken);

    return this.adminService.getInventory();
  }

  @Get("settings")
  getSettings(
    @Res({ passthrough: true }) response: HeaderResponse,
    @Headers("x-internal-orders-token") requestToken: AdminAuthHeaderValue
  ): Promise<unknown> {
    this.assertAuthorized(response, requestToken);

    return this.adminService.getSettings();
  }

  @Get("audit-log")
  getAuditLog(
    @Res({ passthrough: true }) response: HeaderResponse,
    @Headers("x-internal-orders-token") requestToken: AdminAuthHeaderValue
  ): Promise<unknown> {
    this.assertAuthorized(response, requestToken);

    return this.adminService.getAuditLog();
  }

  private assertAuthorized(
    response: HeaderResponse,
    requestToken: AdminAuthHeaderValue
  ): void {
    setAdminResponseHeaders(response);
    assertAdminApiAuthorized(requestToken);
  }
}

function setAdminResponseHeaders(response: HeaderResponse): void {
  for (const [name, value] of Object.entries(ADMIN_RESPONSE_HEADERS)) {
    response.setHeader(name, value);
  }
}
