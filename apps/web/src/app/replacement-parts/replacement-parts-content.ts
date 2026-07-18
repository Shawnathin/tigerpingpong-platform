import mediaManifestData from "../../../../../data/media/replacement-parts-launch-media-v1.json";

interface ReplacementPartsMediaEntry {
  altText?: string;
  assetId: string;
  assetType: "image" | "manual";
  deliveryStatus: "approved" | "uploaded" | "implemented";
  downloadUrl: string | null;
  finalUrl: string | null;
  revision?: string;
  title: string;
}

interface ReplacementPartsMediaManifest {
  entries: ReplacementPartsMediaEntry[];
  status: "approved" | "uploaded" | "implemented";
}

export interface ReplacementManual {
  assetId: string;
  downloadUrl: string;
  revision: string;
  title: string;
  videoUrl?: string;
}

const mediaManifest = mediaManifestData as ReplacementPartsMediaManifest;
const mediaByAssetId = new Map(
  mediaManifest.entries.map((entry) => [entry.assetId, entry] as const)
);

function requireImplementedMedia(
  assetId: string
): ReplacementPartsMediaEntry & { deliveryStatus: "implemented"; finalUrl: string } {
  const entry = mediaByAssetId.get(assetId);
  const deliveryIsAllowed =
    entry?.deliveryStatus === "implemented" || process.env.NODE_ENV !== "production";

  if (!entry?.finalUrl || !deliveryIsAllowed) {
    throw new Error(`Replacement-parts media is not delivery-ready: ${assetId}`);
  }

  return {
    ...entry,
    deliveryStatus: "implemented",
    finalUrl: entry.finalUrl
  };
}

function requireManual(assetId: string, videoUrl?: string): ReplacementManual {
  const entry = requireImplementedMedia(assetId);

  if (entry.assetType !== "manual" || !entry.downloadUrl || !entry.revision) {
    throw new Error(`Replacement-parts manual is incomplete: ${assetId}`);
  }

  return {
    assetId,
    downloadUrl: entry.downloadUrl,
    revision: entry.revision,
    title: entry.title,
    videoUrl
  };
}

function createEmailHref(subject: string, body: string): string {
  const params = new URLSearchParams({ body, subject });
  return `mailto:info@tigerpingpong.com?${params.toString()}`;
}

const generalPartsEmailHref = createEmailHref(
  "Replacement part help",
  `Hi Tiger,

I need help identifying a replacement part.

Table model:
Indoor or outdoor:
Approximate purchase year:
What happened:
Order number (if available):

I'll attach a photo of the part and the table label.`
);

const part40EmailHref = createEmailHref(
  "Part 40 fit check",
  `Hi Tiger,

I think I need Part 40.

Table model:
Indoor or outdoor:
Approximate purchase year:
What happened:
Order number (if available):

I'll attach a photo of the part and the table label.`
);

const part40Media = requireImplementedMedia("replacement-part-40-primary");

if (part40Media.assetType !== "image" || !part40Media.altText) {
  throw new Error("Part 40 media is missing its image metadata.");
}

export const replacementPartsContent = {
  contact: {
    email: "info@tigerpingpong.com",
    generalPartsEmailHref,
    part40EmailHref,
    phoneDisplay: "1-888-552-5259",
    phoneHref: "tel:+18885525259"
  },
  hero: {
    body: "Something missing, wobbly, or just plain broken? Start with Part 40, find your manual, or send us a photo. You'll get a real person in Vancouver, and we'll get it sorted.",
    eyebrow: "Parts & setup",
    heading: "Keep the rally going.",
    image: {
      altText: part40Media.altText,
      finalUrl: part40Media.finalUrl
    }
  },
  identification: {
    body: "A few useful details usually save a few rounds of email.",
    eyebrow: "Help us spot it",
    heading: "Three things make this faster.",
    items: [
      {
        body: "Tell us the model and whether it's the indoor or outdoor version.",
        heading: "Your table"
      },
      {
        body: "Show us the broken piece and the product label on the table.",
        heading: "Two quick photos"
      },
      {
        body: "Add the approximate purchase year or order number if you still have it.",
        heading: "Anything you remember"
      }
    ]
  },
  manuals: [
    requireManual("manual-expo-outdoor", "https://www.youtube.com/watch?v=3WAdtN03EJ4"),
    requireManual("manual-portland-indoor", "https://www.youtube.com/watch?v=EDCxiCuWoIo"),
    requireManual("manual-portland-outdoor", "https://www.youtube.com/watch?v=mUmB-HPWHHs"),
    requireManual("manual-whistler-indoor", "https://www.youtube.com/watch?v=tuvacihKUCk"),
    requireManual("manual-plaza-outdoor")
  ] satisfies ReplacementManual[],
  part40: {
    body: "If a selected Expo or Portland table gets opened the wrong way, this little clip is often what gives. It's cheap, easy to mail, and a much better fix than replacing the whole opening system.",
    eyebrow: "Most-requested fix",
    fit: "Used on selected Expo Indoor, Expo Outdoor, Portland Indoor, and Portland Outdoor tables. We'll confirm fit before anything ships.",
    heading: "Part 40. Small clip. Big save.",
    punchline: "Good news: Part 40 fits in an envelope. The nearly four-foot rod does not."
  }
} as const;
