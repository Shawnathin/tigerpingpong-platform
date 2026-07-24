import { Controller, Get, Headers, Param, Query } from "@nestjs/common";

import { AdminAuthHeaderValue, assertAdminApiAuthorized } from "../admin/admin-auth";
import { CatalogService } from "./catalog.service";

interface CatalogQuery {
  includeInternal?: string;
  includeReplacementParts?: string;
}

function isEnabled(value: string | undefined): boolean {
  return value === "1" || value === "true" || value === "yes";
}

function getCatalogRequestOptions(query: CatalogQuery, requestToken: AdminAuthHeaderValue) {
  const includeInternal = isEnabled(query.includeInternal);
  const includeReplacementParts = isEnabled(query.includeReplacementParts);

  if (includeInternal || includeReplacementParts) {
    assertAdminApiAuthorized(requestToken);
  }

  return {
    includeInternal,
    includeReplacementParts
  };
}

@Controller("catalog")
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get("health")
  health(): Promise<unknown> {
    return this.catalogService.getHealth();
  }

  @Get("categories")
  categories(
    @Headers("x-internal-orders-token") requestToken: AdminAuthHeaderValue,
    @Query() query: CatalogQuery
  ): Promise<unknown> {
    return this.catalogService.getCategories(getCatalogRequestOptions(query, requestToken));
  }

  @Get("product-families")
  productFamilies(
    @Headers("x-internal-orders-token") requestToken: AdminAuthHeaderValue,
    @Query() query: CatalogQuery
  ): Promise<unknown> {
    return this.catalogService.getProductFamilies(getCatalogRequestOptions(query, requestToken));
  }

  @Get("families/:slug")
  familyBySlug(
    @Headers("x-internal-orders-token") requestToken: AdminAuthHeaderValue,
    @Param("slug") slug: string,
    @Query() query: CatalogQuery
  ): Promise<unknown> {
    return this.catalogService.getFamilyBySlug(slug, getCatalogRequestOptions(query, requestToken));
  }

  @Get("products")
  products(
    @Headers("x-internal-orders-token") requestToken: AdminAuthHeaderValue,
    @Query() query: CatalogQuery
  ): Promise<unknown> {
    return this.catalogService.getProducts(getCatalogRequestOptions(query, requestToken));
  }

  @Get("table-accessory-offer/:tableSlug")
  tableAccessoryOffer(@Param("tableSlug") tableSlug: string): Promise<unknown> {
    return this.catalogService.getTableAccessoryOffer(tableSlug);
  }

  @Get("products/:slug")
  productBySlug(
    @Headers("x-internal-orders-token") requestToken: AdminAuthHeaderValue,
    @Param("slug") slug: string,
    @Query() query: CatalogQuery
  ): Promise<unknown> {
    return this.catalogService.getProductBySlug(
      slug,
      getCatalogRequestOptions(query, requestToken)
    );
  }
}
