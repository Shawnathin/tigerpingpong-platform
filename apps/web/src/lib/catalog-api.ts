import type {
  CatalogCategoriesResponse,
  CatalogCategory,
  CatalogFamiliesResponse,
  CatalogFamily,
  CatalogFamilyResponse,
  CatalogHealth,
  CatalogProductDetail,
  CatalogProductResponse,
  CatalogProductsResponse,
  CatalogProductSummary
} from "../types/catalog";

const DEFAULT_API_BASE_URL = "http://localhost:3001";

export class CatalogApiError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly url: string
  ) {
    super(message);
    this.name = "CatalogApiError";
  }
}

export function getCatalogApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/$/, "");
}

async function readErrorBody(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.trim();
  } catch {
    return "";
  }
}

async function fetchCatalog<TResponse>(path: string): Promise<TResponse> {
  const url = `${getCatalogApiBaseUrl()}${path}`;

  let response: Response;

  try {
    response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Catalog API request failed.";
    throw new CatalogApiError(message, null, url);
  }

  if (!response.ok) {
    const body = await readErrorBody(response);
    const detail = body ? `: ${body}` : "";

    throw new CatalogApiError(
      `Catalog API returned HTTP ${response.status}${detail}`,
      response.status,
      url
    );
  }

  return response.json() as Promise<TResponse>;
}

export function getCatalogHealth(): Promise<CatalogHealth> {
  return fetchCatalog<CatalogHealth>("/catalog/health");
}

export async function getCategories(): Promise<CatalogCategory[]> {
  const response = await fetchCatalog<CatalogCategoriesResponse>("/catalog/categories");
  return response.categories;
}

export async function getProductFamilies(): Promise<CatalogFamily[]> {
  const response = await fetchCatalog<CatalogFamiliesResponse>("/catalog/product-families");
  return response.productFamilies;
}

export async function getProducts(): Promise<CatalogProductSummary[]> {
  const response = await fetchCatalog<CatalogProductsResponse>("/catalog/products");
  return response.products;
}

export async function getProductBySlug(slug: string): Promise<CatalogProductDetail> {
  const response = await fetchCatalog<CatalogProductResponse>(
    `/catalog/products/${encodeURIComponent(slug)}`
  );
  return response.product;
}

export async function getFamilyBySlug(slug: string): Promise<CatalogFamily> {
  const response = await fetchCatalog<CatalogFamilyResponse>(
    `/catalog/families/${encodeURIComponent(slug)}`
  );
  return response.productFamily;
}
