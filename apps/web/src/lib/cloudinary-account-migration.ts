import migrationData from "../../../../data/media/cloudinary-account-migration-v1.json";

interface MigratedAsset {
  publicId: string;
  resourceType: string;
  version: number;
}

const migratedAssets = new Map(
  migrationData.assets.map((asset) => [`${asset.resourceType}:${asset.publicId}`, asset] as const)
);

/** Bridge stored legacy URLs during the reviewed media cutover; only copied IDs qualify. */
export function remapTigerMediaUrl(source: string): string {
  let url: URL;
  try {
    url = new URL(source);
  } catch {
    return source;
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (
    url.protocol !== "https:" ||
    url.hostname !== "res.cloudinary.com" ||
    parts[0] !== migrationData.sourceCloud ||
    parts[2] !== "upload"
  ) {
    return source;
  }

  const resourceType = parts[1];
  const folderIndex = parts.findIndex(
    (part, index) => index >= 3 && (part === "tigerpingpong" || part === "tiger-pingpong")
  );
  if (folderIndex === -1) return source;

  const deliveryPath = parts.slice(folderIndex).join("/");
  const extension =
    resourceType === "raw" ? "" : (deliveryPath.match(/\.[a-zA-Z0-9]+$/)?.[0] ?? "");
  const publicId = extension ? deliveryPath.slice(0, -extension.length) : deliveryPath;
  const asset: MigratedAsset | undefined = migratedAssets.get(`${resourceType}:${publicId}`);
  if (!asset) return source;

  const transformations = parts.slice(3, folderIndex).filter((part) => !/^v\d+$/.test(part));
  url.pathname = [
    "",
    migrationData.destinationCloud,
    resourceType,
    "upload",
    ...transformations,
    `v${asset.version}`,
    `${asset.publicId}${extension}`
  ].join("/");
  return url.toString();
}

/** Remap public catalog delivery fields without writing back to the catalog database. */
export function remapCatalogMedia<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => remapCatalogMedia(item)) as T;
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      key === "cloudinarySecureUrl" && typeof item === "string"
        ? remapTigerMediaUrl(item)
        : remapCatalogMedia(item)
    ])
  ) as T;
}
