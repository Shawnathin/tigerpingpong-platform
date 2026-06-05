import { Controller, Get, Param, Query } from "@nestjs/common";

import { CatalogService } from "./catalog.service";

interface CatalogQuery {
  includeInternal?: string;
  includeReplacementParts?: string;
}

function isEnabled(value: string | undefined): boolean {
  return value === "1" || value === "true" || value === "yes";
}

@Controller("catalog")
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get("health")
  health(): Promise<unknown> {
    return this.catalogService.getHealth();
  }

  @Get("categories")
  categories(@Query() query: CatalogQuery): Promise<unknown> {
    return this.catalogService.getCategories({
      includeInternal: isEnabled(query.includeInternal)
    });
  }

  @Get("product-families")
  productFamilies(@Query() query: CatalogQuery): Promise<unknown> {
    return this.catalogService.getProductFamilies({
      includeInternal: isEnabled(query.includeInternal)
    });
  }

  @Get("families/:slug")
  familyBySlug(
    @Param("slug") slug: string,
    @Query() query: CatalogQuery
  ): Promise<unknown> {
    return this.catalogService.getFamilyBySlug(slug, {
      includeInternal: isEnabled(query.includeInternal),
      includeReplacementParts: isEnabled(query.includeReplacementParts)
    });
  }

  @Get("products")
  products(@Query() query: CatalogQuery): Promise<unknown> {
    return this.catalogService.getProducts({
      includeInternal: isEnabled(query.includeInternal),
      includeReplacementParts: isEnabled(query.includeReplacementParts)
    });
  }

  @Get("products/:slug")
  productBySlug(
    @Param("slug") slug: string,
    @Query() query: CatalogQuery
  ): Promise<unknown> {
    return this.catalogService.getProductBySlug(slug, {
      includeInternal: isEnabled(query.includeInternal),
      includeReplacementParts: isEnabled(query.includeReplacementParts)
    });
  }
}
