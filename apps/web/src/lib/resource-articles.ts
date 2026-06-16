export type ResourceArticleCategory =
  | "Buying Guide"
  | "Rules"
  | "Room Planning"
  | "Indoor vs Outdoor";

export interface ResourceLink {
  label: string;
  href: string;
}

export interface ResourceTable {
  columns: string[];
  rows: string[][];
}

export interface ResourceCallout {
  title: string;
  body?: string;
  items?: string[];
}

export interface ResourceSection {
  heading: string;
  body: string[];
  bullets?: string[];
  table?: ResourceTable;
  callout?: ResourceCallout;
  links?: ResourceLink[];
}

export interface ResourceArticle {
  slug: string;
  title: string;
  subtitle?: string;
  postedBy: string;
  publishedDate: string;
  updatedDate: string;
  excerpt: string;
  category: ResourceArticleCategory;
  metaTitle: string;
  metaDescription: string;
  relatedLinks: ResourceLink[];
  ctas: Array<ResourceLink & { variant: "primary" | "secondary" }>;
  highlights: string[];
  sections: ResourceSection[];
}

export const RESOURCE_ARTICLES: ResourceArticle[] = [
  {
    slug: "choose-a-ping-pong-table",
    title: "How to Choose a Ping Pong Table - Ultimate Buyer's Guide",
    subtitle:
      "A practical buyer's guide for matching table type, room, storage, and playing style.",
    postedBy: "Tiger PingPong",
    publishedDate: "2022-08-12",
    updatedDate: "2026-06-15",
    excerpt:
      "Compare indoor and outdoor tables, room needs, tabletop materials, storage, portability, and the features that matter before choosing a table.",
    category: "Buying Guide",
    metaTitle: "How to Choose a Ping Pong Table | Tiger PingPong Buyer's Guide",
    metaDescription:
      "Learn how to choose a ping pong table for your home, office, garage, or outdoor space. Compare indoor vs outdoor tables, room size, materials, storage, and key features.",
    relatedLinks: [
      { label: "Ping pong room size guide", href: "/resources/room-size" },
      {
        label: "Indoor vs outdoor comparison",
        href: "/resources/indoor-vs-outdoor-ping-pong-tables"
      },
      { label: "Shop indoor tables", href: "/tables/indoor-tables/" },
      { label: "Shop outdoor tables", href: "/tables/outdoor-tables/" }
    ],
    ctas: [
      { label: "Shop ping pong tables", href: "/tables/", variant: "primary" },
      { label: "Ask for help choosing", href: "/contact", variant: "secondary" }
    ],
    highlights: [
      "Start with where the table will live: indoors, outdoors, garage, patio, or another space that is not temperature controlled.",
      "Plan for a full-size table footprint plus clear space around the ends and sides before buying.",
      "Compare surface, frame stability, folding design, wheels, leg levellers, and storage needs."
    ],
    sections: [
      {
        heading: "Start with where the table will live",
        body: [
          "The first buying question is simple: will the table live in a controlled indoor room, or will it face moisture, temperature swings, direct sun, garage storage, or regular outdoor use?",
          "Indoor tables are usually the right fit for homes, offices, basements, and other controlled spaces. Outdoor tables are the better starting point for patios, backyards, garages, and spaces where the table may be exposed to dampness, heat, cold, or changing conditions."
        ],
        links: [
          { label: "Shop indoor tables", href: "/tables/indoor-tables/" },
          { label: "Shop outdoor tables", href: "/tables/outdoor-tables/" },
          {
            label: "Compare indoor vs outdoor tables",
            href: "/resources/indoor-vs-outdoor-ping-pong-tables"
          }
        ]
      },
      {
        heading: "Know the table dimensions and room size",
        body: [
          "A full-size ping pong table is 9 feet long, 5 feet wide, and 2.5 feet high. The table itself is only part of the fit: players also need room behind each end and along both sides.",
          "For casual home play, use 19 feet by 11 feet as a simple minimum room size. That allows about 5 feet behind each end and 3 feet along each side. More space is always more comfortable, especially for stronger players or faster rallies."
        ],
        callout: {
          title: "Simple fit check",
          items: [
            "Full-size table: 9 ft x 5 ft x 2.5 ft",
            "Minimum casual room: 19 ft x 11 ft",
            "Side clearance: use 3 ft as a practical minimum",
            "More space behind the table makes play feel much better"
          ]
        },
        links: [{ label: "Read the room size guide", href: "/resources/room-size" }]
      },
      {
        heading: "Set a budget around how the table will be used",
        body: [
          "Table prices vary widely by construction, playing surface, frame strength, indoor or outdoor design, folding systems, wheels, levellers, and overall finish.",
          "Instead of starting with the lowest possible price, decide what the table needs to do. A casual family table, a garage-friendly table, and a table for serious practice do not need the same feature set."
        ],
        bullets: [
          "Prioritize durability if the table will move often or live outside a controlled room.",
          "Prioritize tabletop quality and stability if bounce and playing feel matter most.",
          "Ask about shipping, warranty coverage, assembly, maintenance, and replacement parts before buying."
        ]
      },
      {
        heading: "Compare materials and playing surface",
        body: [
          "Indoor tables commonly use wood-based tops because weather exposure is not part of the job. These surfaces are chosen for smoothness, consistency, and bounce.",
          "Outdoor tables need weather-resistant construction. The exact materials vary by model, so check the product details before assuming how a table will handle moisture, heat, cold, or direct sunlight."
        ],
        bullets: [
          "A thicker, higher-quality tabletop usually improves playing feel and long-term durability.",
          "Outdoor tables trade some competition-style bounce for better resistance to changing conditions.",
          "A matte finish helps reduce glare so players can track the ball more easily."
        ]
      },
      {
        heading: "Check the frame, wheels, portability, and storage",
        body: [
          "The frame should keep the table stable during play. Look for sturdy legs, a locking folding system where applicable, and adjustable leg levellers if the floor is not perfectly even.",
          "If the table needs to move around a room, patio, garage, or storage area, wheels matter. Locking wheels help keep the table in place during play and make storage less of a wrestling match."
        ],
        bullets: [
          "Folding tables are easier to store in compact rooms.",
          "Playback mode can be useful for solo practice when one half folds upright.",
          "One-piece tables make sense when the table will stay permanently set up."
        ]
      },
      {
        heading: "Where to buy and what to ask",
        body: [
          "Buying in person can be helpful if you are new to ping pong because you can see how the table folds, rolls, and feels. Buying online can be convenient, but it is worth checking who you are buying from and what support is available after the sale.",
          "A dedicated ping pong seller can usually give clearer guidance than a general marketplace listing, especially when you are comparing indoor, outdoor, storage, and room-size needs."
        ],
        bullets: [
          "What are the tabletop and frame made of?",
          "How easy is the table to assemble and move?",
          "How should the table be maintained?",
          "What does shipping cost, and what is included?",
          "What does the warranty cover?"
        ],
        links: [
          { label: "Shop all tables", href: "/tables/" },
          { label: "Contact Tiger PingPong", href: "/contact" }
        ]
      }
    ]
  },
  {
    slug: "room-size",
    title: "Ping Pong Room Size",
    subtitle:
      "Room planning notes for table footprint, clearances, lighting, and small-space play.",
    postedBy: "Tiger PingPong",
    publishedDate: "2022-05-06",
    updatedDate: "2026-06-15",
    excerpt:
      "Understand table dimensions, room clearance, ceiling height, lighting, temperature, and practical ways to make a smaller room work.",
    category: "Room Planning",
    metaTitle: "Ping Pong Room Size Guide | How Much Space Do You Need?",
    metaDescription:
      "Find out how much room you need for a ping pong table, including table dimensions, minimum clearance, ceiling height, lighting, and small-space tips.",
    relatedLinks: [
      { label: "Shop tables", href: "/tables/" },
      { label: "Indoor vs outdoor tables", href: "/resources/indoor-vs-outdoor-ping-pong-tables" },
      { label: "Buyer's guide", href: "/resources/choose-a-ping-pong-table" },
      { label: "Contact Tiger PingPong", href: "/contact" }
    ],
    ctas: [
      { label: "Shop tables", href: "/tables/", variant: "primary" },
      { label: "Ask if it will fit", href: "/contact", variant: "secondary" }
    ],
    highlights: [
      "A full-size table is 9 ft x 5 ft x 2.5 ft.",
      "Use 19 ft x 11 ft as a simple casual minimum with 3 ft side clearance.",
      "Ceiling height, lighting, temperature, flooring, and storage all affect the playing experience."
    ],
    sections: [
      {
        heading: "The standard table footprint",
        body: [
          "A full-size ping pong table is 9 feet long, 5 feet wide, and 2.5 feet high. That size gives you the standard table experience, but the table footprint is only the starting point.",
          "Players need space to step back, swing, move side to side, and retrieve the ball without running into walls, furniture, lights, or stored items."
        ],
        callout: {
          title: "Room-size quick guide",
          items: [
            "Minimum casual room: 19 ft x 11 ft",
            "Comfortable recreational room: 28 ft x 13 ft",
            "Competitive/local play: 30 ft x 16.5 ft+"
          ]
        }
      },
      {
        heading: "Minimum room size for casual play",
        body: [
          "For a full-size table, a practical casual minimum is 19 feet long by 11 feet wide. That allows the 9-foot table length, about 5 feet behind each end, and about 3 feet along each side.",
          "This is a shopper-friendly minimum, not a promise that every player will feel comfortable. If your players swing hard, back up often, or play faster rallies, more space will make the table feel much better."
        ],
        bullets: [
          "Tight but workable: 19 ft x 11 ft.",
          "Better for family and recreational play: about 28 ft x 13 ft.",
          "Better for competitive local play: about 30 ft x 16.5 ft or more."
        ]
      },
      {
        heading: "Ceiling height, lights, and net clearance",
        body: [
          "A 10-foot ceiling is a helpful target for comfortable play. Lower ceilings can still work for casual rallies, but hanging lights, beams, and low fixtures can interrupt serves, lobs, and higher returns.",
          "A standard net is about 6 inches high and extends slightly beyond each side of the table. Keep the area around the net and table edges clear so players are not reaching around clutter during points."
        ]
      },
      {
        heading: "Small-space tips",
        body: [
          "A smaller room does not always mean the table is impossible. It does mean expectations matter. The game may be more casual, players may stand closer, and storage can become just as important as play space."
        ],
        bullets: [
          "Choose a folding table if the room needs to serve another purpose.",
          "Use playback mode for solo practice when there is not enough space for two players.",
          "Consider a smaller table if the room cannot fit a full-size table safely.",
          "Look at an outdoor table if you have a level outdoor area or garage-style space."
        ],
        links: [
          { label: "Shop ping pong tables", href: "/tables/" },
          {
            label: "Compare indoor and outdoor tables",
            href: "/resources/indoor-vs-outdoor-ping-pong-tables"
          }
        ]
      },
      {
        heading: "Lighting, temperature, and flooring",
        body: [
          "Good lighting helps players see the ball clearly. Natural light is useful, but direct glare on the table can make the ball harder to track, so aim for bright, even light.",
          "Comfortable room temperature helps people play longer. Flooring should be smooth and stable enough for movement; avoid surfaces that are slippery, uneven, or likely to trip players."
        ],
        bullets: [
          "Avoid glare on the tabletop.",
          "Keep the playing area clear of loose rugs, cords, and furniture edges.",
          "Use indoor tables in controlled indoor spaces, and consider outdoor tables for garages or areas with changing conditions."
        ]
      }
    ]
  },
  {
    slug: "indoor-vs-outdoor-ping-pong-tables",
    title: "Indoor Vs Outdoor Ping Pong Tables",
    subtitle: "A clear comparison of table construction, storage, durability, and use cases.",
    postedBy: "Tiger PingPong",
    publishedDate: "2014-02-15",
    updatedDate: "2026-06-15",
    excerpt:
      "Compare indoor and outdoor table tennis tables by storage location, weather exposure, durability, playing surface, and everyday use.",
    category: "Indoor vs Outdoor",
    metaTitle: "Indoor vs Outdoor Ping Pong Tables | Which Table Should You Buy?",
    metaDescription:
      "Compare indoor and outdoor ping pong tables, including playing quality, storage, weather resistance, garage use, durability, and which option is best for your space.",
    relatedLinks: [
      { label: "Shop indoor tables", href: "/tables/indoor-tables/" },
      { label: "Shop outdoor tables", href: "/tables/outdoor-tables/" },
      { label: "Buyer's guide", href: "/resources/choose-a-ping-pong-table" },
      { label: "Room size guide", href: "/resources/room-size" }
    ],
    ctas: [
      { label: "Shop indoor tables", href: "/tables/indoor-tables/", variant: "primary" },
      { label: "Shop outdoor tables", href: "/tables/outdoor-tables/", variant: "secondary" }
    ],
    highlights: [
      "Indoor tables are best for controlled spaces and the most consistent playing feel.",
      "Outdoor tables are better for patios, garages, moisture, temperature swings, and permanent outdoor setups.",
      "Do not leave an indoor table outdoors or in harsh storage conditions unless the product guidance explicitly allows it."
    ],
    sections: [
      {
        heading: "The right choice depends on the room",
        body: [
          "The decision is not really about which table is better in every situation. It is about where the table will live and what kind of play matters most.",
          "If the table will stay in a controlled indoor space, an indoor table usually gives the best bounce and playing feel. If the table will live on a patio, in a garage, or anywhere with moisture and temperature changes, start by looking at outdoor tables."
        ],
        table: {
          columns: ["Need / Situation", "Better choice", "Why"],
          rows: [
            ["Best playing surface", "Indoor table", "Better bounce and competitive feel"],
            ["Permanent outdoor setup", "Outdoor table", "Built for weather exposure"],
            [
              "Garage storage",
              "Usually outdoor table",
              "Handles temperature and moisture changes better"
            ],
            ["Competitive practice", "Indoor table", "More similar to club/tournament play"],
            [
              "Casual family patio use",
              "Outdoor table",
              "Durability matters more than perfect bounce"
            ],
            [
              "Lowest glare/controlled conditions",
              "Indoor table",
              "Lighting and environment are easier to manage"
            ]
          ]
        }
      },
      {
        heading: "When an indoor table makes sense",
        body: [
          "Indoor tables are the right choice for homes, offices, basements, clubs, and other spaces that stay dry and reasonably temperature controlled.",
          "They are usually chosen for playing quality. If you care most about consistent bounce, competitive feel, and a controlled environment, indoor is the better direction."
        ],
        links: [{ label: "Shop indoor tables", href: "/tables/indoor-tables/" }]
      },
      {
        heading: "Why indoor tables should not live outdoors",
        body: [
          "An indoor table can be damaged by direct sunlight, moisture, and temperature swings. Even short outdoor use can be risky if the table is left in sun, wind, dampness, or changing weather.",
          "Garage storage can also be a problem for indoor tables when the garage is not dry or temperature controlled. If the table will spend most of its life in a garage, an outdoor table is usually the safer starting point."
        ],
        callout: {
          title: "Garage rule of thumb",
          body: "If the garage gets damp, very hot, very cold, or changes temperature quickly, compare outdoor tables before buying an indoor model."
        }
      },
      {
        heading: "When an outdoor table makes sense",
        body: [
          "Outdoor tables are designed for places where durability matters more than perfect club-style bounce. They are the better fit for patios, backyards, garages, and permanent outdoor setups.",
          "Outdoor tables can often be used indoors too, but their playing feel may differ from a higher-end indoor competition-style table. For casual family play, the storage freedom and resistance to changing conditions can be the better tradeoff."
        ],
        links: [{ label: "Shop outdoor tables", href: "/tables/outdoor-tables/" }]
      },
      {
        heading: "Still deciding?",
        body: [
          "If you are unsure, start with the exact space: indoors or outdoors, dry or damp, heated or unheated, permanent setup or folded storage. Then decide whether playing feel or environmental durability matters more.",
          "Room size is the other half of the decision. A table that fits the environment still needs enough clearance to play comfortably."
        ],
        links: [
          { label: "Read the buyer's guide", href: "/resources/choose-a-ping-pong-table" },
          { label: "Check room size", href: "/resources/room-size" }
        ]
      }
    ]
  },
  {
    slug: "ping-pong-rules",
    title: "Ping Pong Rules - Learn The Basics & Start Playing",
    subtitle: "Beginner-friendly table tennis rules for casual games and confident starts.",
    postedBy: "Tiger PingPong",
    publishedDate: "2022-05-06",
    updatedDate: "2026-06-15",
    excerpt:
      "Learn the basic laws and common playing rules that help casual and beginner players start a table tennis match.",
    category: "Rules",
    metaTitle: "Ping Pong Rules for Beginners | How to Play Table Tennis",
    metaDescription:
      "Learn the basic ping pong rules, including serving, scoring, lets, doubles, equipment, games, and matches. A simple beginner guide from Tiger PingPong.",
    relatedLinks: [
      { label: "Shop tables", href: "/tables/" },
      { label: "Shop paddles", href: "/accessories/paddles/" },
      { label: "Shop balls", href: "/accessories/ping-pong-balls/" },
      { label: "Shop nets", href: "/accessories/nets/" },
      { label: "Buyer's guide", href: "/resources/choose-a-ping-pong-table" }
    ],
    ctas: [
      { label: "Shop tables", href: "/tables/", variant: "primary" },
      { label: "Shop accessories", href: "/accessories/", variant: "secondary" }
    ],
    highlights: [
      "Use the basic rules to get a casual game started without needing tournament-level detail.",
      "Games are commonly played to 11 points, and a player or pair must win by two.",
      "Serves, lets, doubles order, and common beginner questions are easy to reference."
    ],
    sections: [
      {
        heading: "Equipment basics",
        body: [
          "For a standard game, you need a table, net assembly, ball, and paddle. A full-size table is 9 feet long, 5 feet wide, and 2.5 feet high, with the playing surface divided by a net.",
          "A standard table tennis ball is 40 mm and lightweight. Paddles vary widely, but beginner players mostly need something comfortable, controlled, and appropriate for their level."
        ],
        links: [
          { label: "Shop tables", href: "/tables/" },
          { label: "Shop paddles", href: "/accessories/paddles/" },
          { label: "Shop balls", href: "/accessories/ping-pong-balls/" },
          { label: "Shop nets", href: "/accessories/nets/" }
        ]
      },
      {
        heading: "How a point starts",
        body: [
          "A point starts with a serve. In casual play, players often decide who serves first by a coin toss or a simple hand-guess game with the ball.",
          "The server holds the ball in an open palm, tosses it upward, and strikes it as it falls. A legal serve bounces once on the server's side, passes over or around the net, and then bounces on the receiver's side."
        ],
        bullets: [
          "In singles, the serve does not need to be diagonal.",
          "In doubles, the serve goes from the server's right half to the receiver's right half.",
          "If a serve clips the net and still lands legally, replay the serve as a let."
        ]
      },
      {
        heading: "Order of play",
        body: [
          "In singles, the server serves, the receiver returns, and the rally continues until someone wins the point.",
          "In doubles, players hit in order: server, receiver, server's partner, receiver's partner, then that sequence continues. Hitting out of turn loses the point."
        ]
      },
      {
        heading: "Scoring and number of serves",
        body: [
          "A beginner-friendly modern game is played to 11 points, and the winner needs a two-point lead. Points can be won whether or not you served.",
          "Each player serves two points, then service switches. At 10-10, service alternates every point until one player or pair leads by two."
        ],
        callout: {
          title: "Quick scoring reminder",
          items: [
            "Game to 11 points",
            "Win by 2",
            "Two serves each before switching",
            "At 10-10, switch server every point"
          ]
        }
      },
      {
        heading: "Lets, returns, and common point losses",
        body: [
          "If a serve touches the net and still lands correctly, it is a let and the serve is replayed. If it touches the net and does not land on the receiver's side, the server loses the point.",
          "During a rally, a ball that clips the net and still lands on the opponent's side stays in play."
        ],
        bullets: [
          "You lose the point if the ball bounces twice on your side.",
          "You usually must let the ball bounce before hitting it.",
          "You lose the point if your return misses the opponent's side.",
          "You lose the point if you move the table or put your free hand on the table during play.",
          "In doubles, hitting out of order loses the point."
        ]
      },
      {
        heading: "Games, matches, and doubles basics",
        body: [
          "A match is usually the best of an odd number of games, such as best of 3, 5, or 7. Players normally switch ends after each game.",
          "For casual doubles, remember the two biggest differences: the serve is diagonal from right half to right half, and teammates alternate shots after the return."
        ]
      },
      {
        heading: "Common beginner questions",
        body: [
          "Can you only score on your serve? No. Either player or pair can win any point.",
          "What happens if the ball spins back over the net after landing on the opponent's side? In a basic casual game, the player who hit that shot wins the point if the opponent cannot legally reach and return it."
        ],
        links: [{ label: "Read the buyer's guide", href: "/resources/choose-a-ping-pong-table" }]
      }
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
