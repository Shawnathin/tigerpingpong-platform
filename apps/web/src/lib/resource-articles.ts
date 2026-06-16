export type ResourceArticleCategory =
  | "Buying Guide"
  | "Rules"
  | "Room Planning"
  | "Indoor vs Outdoor";

export interface ResourceArticle {
  slug: string;
  title: string;
  subtitle?: string;
  postedBy: string;
  publishedDate: string;
  excerpt: string;
  category: ResourceArticleCategory;
  metaTitle: string;
  metaDescription: string;
  relatedLinks: Array<{ label: string; href: string }>;
  ctas: Array<{ label: string; href: string; variant: "primary" | "secondary" }>;
  highlights: string[];
}

export const RESOURCE_ARTICLES: ResourceArticle[] = [
  {
    slug: "choose-a-ping-pong-table",
    title: "How to Choose a Ping Pong Table - Ultimate Buyer's Guide",
    subtitle: "A practical starting point for matching table type, room, storage, and play style.",
    postedBy: "Tiger PingPong",
    publishedDate: "2022-08-12",
    excerpt:
      "Compare indoor and outdoor tables, room needs, tabletop materials, storage, portability, and the features that matter before choosing a table.",
    category: "Buying Guide",
    metaTitle: "How to Choose a Ping Pong Table | Tiger PingPong",
    metaDescription:
      "A Tiger PingPong buying guide for choosing a ping pong table by room, indoor or outdoor use, storage, materials, and play style.",
    relatedLinks: [
      { label: "Shop tables", href: "/tables/" },
      { label: "Indoor tables", href: "/tables/indoor-tables/" },
      { label: "Outdoor tables", href: "/tables/outdoor-tables/" }
    ],
    ctas: [
      {
        label: "Read the Buyer's Guide",
        href: "/resources/choose-a-ping-pong-table",
        variant: "primary"
      },
      { label: "Shop tables", href: "/tables/", variant: "secondary" }
    ],
    highlights: [
      "Start with where the table will live: indoors, outdoors, garage, patio, or another non-controlled space.",
      "Plan for a full-size table footprint plus clear space around the ends and sides before buying.",
      "Compare surface, frame stability, folding design, wheels, leg levellers, and storage needs."
    ]
  },
  {
    slug: "room-size",
    title: "Ping Pong Room Size",
    subtitle:
      "Room planning notes for table footprint, clearances, lighting, and small-space play.",
    postedBy: "Tiger PingPong",
    publishedDate: "2022-05-06",
    excerpt:
      "Understand table dimensions, room clearance, ceiling height, lighting, temperature, and practical ways to make a smaller room work.",
    category: "Room Planning",
    metaTitle: "Ping Pong Room Size | Tiger PingPong",
    metaDescription:
      "Plan your ping pong room size with Tiger PingPong guidance on table dimensions, clearance, ceiling height, lighting, and small-space setup.",
    relatedLinks: [
      { label: "Shop tables", href: "/tables/" },
      { label: "Contact Tiger PingPong", href: "/contact" }
    ],
    ctas: [
      { label: "Check Room Size", href: "/resources/room-size", variant: "primary" },
      { label: "Ask for help", href: "/contact", variant: "secondary" }
    ],
    highlights: [
      "Use the table footprint and player movement space together when planning a room.",
      "Leave practical clearance around the ends and sides so rallies do not feel cramped.",
      "Consider ceiling height, lighting, temperature, storage, and whether the table needs to fold away."
    ]
  },
  {
    slug: "indoor-vs-outdoor-ping-pong-tables",
    title: "Indoor Vs Outdoor Ping Pong Tables",
    subtitle: "A clear comparison of table construction, storage, durability, and use cases.",
    postedBy: "Tiger PingPong",
    publishedDate: "2014-02-15",
    excerpt:
      "Compare indoor and outdoor table tennis tables by storage location, weather exposure, durability, playing surface, and everyday use.",
    category: "Indoor vs Outdoor",
    metaTitle: "Indoor vs Outdoor Ping Pong Tables | Tiger PingPong",
    metaDescription:
      "Compare indoor and outdoor ping pong tables with Tiger PingPong guidance on use cases, storage, weather exposure, durability, and playing surface.",
    relatedLinks: [
      { label: "Indoor tables", href: "/tables/indoor-tables/" },
      { label: "Outdoor tables", href: "/tables/outdoor-tables/" },
      { label: "Shop all tables", href: "/tables/" }
    ],
    ctas: [
      {
        label: "Compare Indoor vs Outdoor",
        href: "/resources/indoor-vs-outdoor-ping-pong-tables",
        variant: "primary"
      },
      { label: "View outdoor tables", href: "/tables/outdoor-tables/", variant: "secondary" }
    ],
    highlights: [
      "Indoor tables are usually the right fit for homes and controlled rooms.",
      "Outdoor tables are better suited to patios, backyards, garages, and areas with moisture or temperature swings.",
      "Compare durability, surface quality, wheels, weight, and storage before deciding."
    ]
  },
  {
    slug: "ping-pong-rules",
    title: "Ping Pong Rules - Learn The Basics & Start Playing",
    subtitle: "Beginner-friendly table tennis rules for casual games and confident starts.",
    postedBy: "Tiger PingPong",
    publishedDate: "2022-05-06",
    excerpt:
      "Learn the basic laws and common playing rules that help casual and beginner players start a table tennis match.",
    category: "Rules",
    metaTitle: "Ping Pong Rules | Tiger PingPong",
    metaDescription:
      "Learn basic ping pong rules with Tiger PingPong, including beginner-friendly table tennis guidance for casual players.",
    relatedLinks: [
      { label: "Shop paddles", href: "/accessories/paddles/" },
      { label: "Shop balls", href: "/accessories/ping-pong-balls/" },
      { label: "Shop nets", href: "/accessories/nets/" }
    ],
    ctas: [
      { label: "Learn the Rules", href: "/resources/ping-pong-rules", variant: "primary" },
      { label: "Shop accessories", href: "/accessories/", variant: "secondary" }
    ],
    highlights: [
      "Use the basic rules to get a casual game started without needing tournament-level detail.",
      "Keep serves, scoring, lets, and common beginner questions easy to reference.",
      "Pair the rules with paddles, balls, and a ready net setup so new players can start quickly."
    ]
  }
];

export function getResourceArticle(slug: string): ResourceArticle | undefined {
  return RESOURCE_ARTICLES.find((article) => article.slug === slug);
}

export function formatResourceDate(date: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric"
  }).format(new Date(`${date}T00:00:00Z`));
}
