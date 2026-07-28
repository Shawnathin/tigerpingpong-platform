import mediaManifestData from "../../../../data/media/replacement-parts-launch-media-v1.json";

interface SupportMediaEntry {
  assetId: string;
  assetType: "image" | "manual";
  deliveryStatus: "approved" | "uploaded" | "implemented";
  downloadUrl: string | null;
  revision?: string;
  title: string;
}

interface SupportMediaManifest {
  entries: SupportMediaEntry[];
}

export interface TableSupportResource {
  assetId: string;
  downloadUrl: string;
  productSlug: string;
  revision: string;
  title: string;
  videoUrl?: string;
}

interface TableSupportConfiguration {
  assetId: string;
  productSlug: string;
  videoUrl?: string;
}

const supportMediaManifest = mediaManifestData as SupportMediaManifest;
const mediaByAssetId = new Map(
  supportMediaManifest.entries.map((entry) => [entry.assetId, entry] as const)
);

const TABLE_SUPPORT_CONFIGURATIONS = [
  {
    assetId: "manual-expo-outdoor",
    productSlug: "tiger-expo-outdoor-table",
    videoUrl: "https://www.youtube.com/watch?v=3WAdtN03EJ4"
  },
  {
    assetId: "manual-portland-indoor",
    productSlug: "tiger-portland-indoor-table",
    videoUrl: "https://www.youtube.com/watch?v=EDCxiCuWoIo"
  },
  {
    assetId: "manual-portland-outdoor",
    productSlug: "tiger-portland-outdoor-table",
    videoUrl: "https://www.youtube.com/watch?v=mUmB-HPWHHs"
  },
  {
    assetId: "manual-whistler-indoor",
    productSlug: "tiger-whistler-indoor-table",
    videoUrl: "https://www.youtube.com/watch?v=tuvacihKUCk"
  },
  {
    assetId: "manual-plaza-outdoor",
    productSlug: "tiger-plaza-outdoor-table-grey"
  }
] satisfies TableSupportConfiguration[];

function resolveSupportResource(configuration: TableSupportConfiguration): TableSupportResource {
  const entry = mediaByAssetId.get(configuration.assetId);
  const deliveryIsAllowed =
    entry?.deliveryStatus === "implemented" || process.env.NODE_ENV !== "production";

  if (
    entry?.assetType !== "manual" ||
    !entry.downloadUrl ||
    !entry.revision ||
    !deliveryIsAllowed
  ) {
    throw new Error(`Table support manual is not delivery-ready: ${configuration.assetId}`);
  }

  return {
    ...configuration,
    downloadUrl: entry.downloadUrl,
    revision: entry.revision,
    title: entry.title
  };
}

export const tableSupportResources = TABLE_SUPPORT_CONFIGURATIONS.map(resolveSupportResource);

const resourcesByProductSlug = new Map(
  tableSupportResources.map((resource) => [resource.productSlug, resource] as const)
);

export function getTableSupportResource(productSlug: string): TableSupportResource | null {
  return resourcesByProductSlug.get(productSlug) ?? null;
}
