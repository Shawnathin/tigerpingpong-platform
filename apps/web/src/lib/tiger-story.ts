import aboutStoryImageMapData from "../../../../data/media/about-story-image-map-v1.json";

export interface TigerStoryImage {
  altText: string;
  assetId: string;
  caption: string;
  cloudinaryPublicId: string;
  displayMaxWidth?: number;
  finalUrl: string;
  role: string;
  sourceDimensions: {
    height: number;
    width: number;
  };
}

interface TigerStoryImageMapEntry extends Omit<TigerStoryImage, "finalUrl"> {
  finalUrl: string | null;
  rightsStatus: string;
  status: string;
}

interface TigerStoryImageMap {
  entries: TigerStoryImageMapEntry[];
}

export interface TigerProductNameStory {
  body: string;
  cta: string;
  href: string;
  id: "expo" | "whistler" | "portland";
  name: string;
}

const aboutStoryImageMap = aboutStoryImageMapData as TigerStoryImageMap;
const imageByAssetId = new Map(
  aboutStoryImageMap.entries.map((entry) => [entry.assetId, entry] as const)
);

function requireStoryImage(assetId: string): TigerStoryImage {
  const image = imageByAssetId.get(assetId);

  if (!image?.finalUrl || image.status !== "implemented") {
    throw new Error(`Tiger story image is not implementation-ready: ${assetId}`);
  }

  return {
    altText: image.altText,
    assetId: image.assetId,
    caption: image.caption,
    cloudinaryPublicId: image.cloudinaryPublicId,
    displayMaxWidth: image.displayMaxWidth,
    finalUrl: image.finalUrl,
    role: image.role,
    sourceDimensions: image.sourceDimensions
  };
}

export const tigerStory = {
  hero: {
    anchor: "start",
    eyebrow: "Our story",
    heading: "Raised on the West Coast.",
    body: "Vancouver is our home court. It shaped the gear we make, the way we help, and the kind of company we wanted to be. Now we’re bringing that rally to the rest of Canada.",
    bridge: "The story starts with a much worse table.",
    image: requireStoryImage("MAY-011")
  },
  origin: {
    anchor: "first-serve",
    eyebrow: "Where it started",
    heading: "Good energy. Questionable table.",
    body: "Tiger started with a table we were pretty excited about. It had skinny legs, questionable construction, and taught us most of what not to do. But we took it everywhere. Chinatown nights. Rainy street festivals. Driveways. Packed rooms. The table was not great. The people around it were exactly right.",
    images: [requireStoryImage("Y13-003"), requireStoryImage("EXT-001")]
  },
  vancouver: {
    anchor: "vancouver",
    eyebrow: "Our home court",
    heading: "Then Vancouver showed up.",
    body: "Food Cart Fest. Science World. The Shipyards. Schools, universities, corporate events, and community festivals from Vancouver to Whistler. We set up, people played, and every rally taught us something. Gear for real life has to handle kids, crowds, weather, parties, spilled drinks, and the occasional person who gets a little carried away. That became our brief.",
    pullLine: "The city wasn’t our backdrop. It was our product test.",
    images: [
      requireStoryImage("FCF-002"),
      requireStoryImage("NIT-034"),
      requireStoryImage("UBC-001"),
      requireStoryImage("GOF-253")
    ]
  },
  outdoor: {
    eyebrow: "What Vancouver taught us",
    heading: "Outside is one of our rooms.",
    body: "We’re outdoor people. If we waited for perfect weather, we’d never get anything done. That’s why Tiger makes so much outdoor gear—and why outdoor gear can make sense inside too. Patios, garages, basements, breweries, schools, and busy game rooms all reward equipment that’s a little less precious and a lot harder to wreck."
  },
  manufacturing: {
    anchor: "built-better",
    eyebrow: "The gear catches up",
    heading: "So we stopped settling.",
    body: "Our first table wasn’t good enough. We owned that. Then we searched for people who cared about the details as much as we did. Today, every Tiger table is made in Germany. For our injection-moulded gear, we design and own custom moulds and work with specialist manufacturing partners to make the products we wish had existed when we started.",
    closingLine: "Serious about the gear. Easygoing about the game.",
    images: [requireStoryImage("EXT-037"), requireStoryImage("FAC-034")]
  },
  names: {
    anchor: "names",
    eyebrow: "What’s with the names?",
    heading: "A little map of home.",
    intro: "Tiger products carry pieces of the places and culture that made us.",
    stories: [
      {
        id: "expo",
        name: "Expo",
        body: "Named for Expo 86, when Vancouver welcomed the world. Its theme was ‘World in Motion—World in Touch.’ Honestly, that still sounds like a pretty good brief for a PingPong table.",
        cta: "Meet Expo",
        href: "/catalog/products/tiger-expo-outdoor-table"
      },
      {
        id: "whistler",
        name: "Whistler",
        body: "No complicated backstory. We’re West Coast kids. Whistler is part of the landscape, so it became part of ours.",
        cta: "Meet Whistler",
        href: "/catalog/products/tiger-whistler-indoor-table"
      },
      {
        id: "portland",
        name: "Portland",
        body: "Rainy patios, independent spirit, and very good beer. We’re brewery people. The name made sense.",
        cta: "Meet Portland",
        href: "/catalog/products/tiger-portland-outdoor-table"
      }
    ] satisfies TigerProductNameStory[]
  },
  roadshow: {
    anchor: "across-canada",
    eyebrow: "Better gear. Bigger map.",
    heading: "Then we pointed the truck east.",
    body: "Whistler. UBC. Stampede Park. The Ontario border. Even a Royal Caribbean ship. Tiger grew one table, one event, and one long drive at a time. We still live and work in Vancouver. We still answer the phone. We’re just bringing the rally to more neighbours now—from the West Coast to the rest of Canada.",
    images: [
      requireStoryImage("EXT-098"),
      requireStoryImage("EXT-101"),
      requireStoryImage("EXT-102")
    ]
  },
  contact: {
    phone: {
      display: "1-888-552-5259",
      href: "tel:+18885525259"
    },
    email: {
      display: "info@tigerpingpong.com",
      href: "mailto:info@tigerpingpong.com"
    },
    hero: {
      eyebrow: "Real help from Vancouver",
      heading: "Need a hand? We’ve got you.",
      body: "Choosing a table? Tracking down a part? Wondering what works on the patio? Call or email us. You’ll get a real person in Vancouver who knows the gear and will help you sort it out.",
      primaryAction: "Call 1-888-552-5259",
      secondaryAction: "Email a real person",
      image: requireStoryImage("NIT-034")
    },
    topics: {
      eyebrow: "What’s up?",
      heading: "Start wherever you are.",
      items: [
        {
          heading: "Help me choose.",
          body: "Basement, patio, school, community centre—we’ll help you find the right setup."
        },
        {
          heading: "Where’s my order?",
          body: "Have your order reference and checkout email handy. We’ll help figure out what’s happening."
        },
        {
          heading: "Something needs fixing.",
          body: "Replacement parts, setup questions, or something behaving strangely? Tell us what’s up."
        },
        {
          heading: "Canada is large.",
          body: "Questions about delivery, timing, or getting a table to your part of it? Ask away."
        }
      ]
    },
    orderHelp: {
      eyebrow: "Already ordered?",
      heading: "Give us the clues.",
      body: "Your order reference, checkout email, and product name help us find the right answer faster. If something arrived looking weird, a photo helps too.",
      details: ["Order reference", "Checkout email", "Product name", "A photo, if it helps"],
      action: "Email the details"
    },
    closing: {
      heading: "Good gear. Real help. No runaround.",
      body: "Call us. Email us. Tell us what’s going on. We’ll take it from there. Because it’s PingPong. This part should be easy too.",
      signature: "Vancouver, BC · Helping across Canada",
      primaryAction: "Call Tiger",
      secondaryAction: "Email Tiger"
    }
  },
  closing: {
    heading: "Good gear. Real help. No runaround.",
    body: "Need help choosing a table for a basement, patio, school, or brewery? Call us. You’ll get a real person in Vancouver, and we’ll get it sorted. Because it’s PingPong. It should be fun—even the part where you buy it.",
    signature: "Raised on the West Coast. Ready for Canada.",
    actions: [
      { href: "/tables/", label: "Find your table" },
      { href: "/contact", label: "Talk to a real person" }
    ]
  }
} as const;
