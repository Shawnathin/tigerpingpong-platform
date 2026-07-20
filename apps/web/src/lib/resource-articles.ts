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
    updatedDate: "2026-07-20",
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
          "Table prices vary widely because of tabletop thickness and finish, frame strength, manufacturing location, indoor or outdoor construction, folding systems, wheels, levellers, and overall build quality.",
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
        heading: "Choose a colour and finish you can play on",
        body: [
          "Green, blue, and grey are common table colours, so colour can be chosen to suit the room or outdoor setting. Visibility matters more than decoration: the surface should be dark enough to contrast with the ball and should not create distracting glare.",
          "A matte finish makes the ball easier to track than a glossy or reflective surface. For an outdoor location, also consider how direct sun and the surrounding background will affect visibility and surface temperature."
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
        heading: "Folding versus one-piece tables",
        body: [
          "A folding table is usually the practical choice when the room has another purpose or the table must be rolled away after play. Check the folded footprint, locking mechanism, wheel locks, and whether one half can be raised for solo playback.",
          "A one-piece table is simpler when it has a permanent, level location and never needs compact storage. It still needs a stable frame and enough access around it for setup, cleaning, and play."
        ]
      },
      {
        heading: "Competition-table considerations",
        body: [
          "If the goal is serious club or competition practice, start with the official full-size footprint and prioritize a uniform bounce, a dark matte playing surface, a stable undercarriage, and a correctly fitted net assembly.",
          "A full-size table is not automatically approved for every sanctioned event. If a particular competition standard matters, confirm the current equipment requirements and the exact model's approval status with the event organizer or governing body before buying."
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
      },
      {
        heading: "Final table-buying checklist",
        body: [
          "Before ordering, make sure the table fits the location, the way it will be stored, and the level of play you expect. Then verify the product-specific details instead of assuming every table includes the same features."
        ],
        bullets: [
          "Confirm indoor or outdoor construction for the place the table will live.",
          "Measure the table footprint, player clearance, doorway access, and folded storage space.",
          "Compare tabletop material, thickness, matte finish, frame stability, and levelling feet.",
          "Decide whether folding, playback mode, and locking wheels are required.",
          "Check assembly, shipping, warranty, maintenance, and replacement-parts support.",
          "For competition preparation, verify current event and equipment requirements."
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
    updatedDate: "2026-07-20",
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
        heading: "Competition playing areas are much larger",
        body: [
          "The current ITTF international-competition regulations specify a playing space containing at least 14 metres long by 7 metres wide by 5 metres high, or about 46 feet by 23 feet by 16.4 feet. That event footprint includes far more movement and operating space than a casual home room needs.",
          "For home planning, use the casual and recreational clearances above. If you are preparing a club or event space, check the rules for that competition level rather than treating a home-room recommendation as a tournament standard."
        ]
      },
      {
        heading: "Ceiling height, lights, and net clearance",
        body: [
          "A 10-foot ceiling is a helpful target for comfortable play. Lower ceilings can still work for casual rallies, but hanging lights, beams, and low fixtures can interrupt serves, lobs, and higher returns.",
          "A standard net is 15.25 centimetres, or 6 inches, above the playing surface. Its posts extend 15.25 centimetres outside each sideline. Keep the table edges and net area clear so players are not reaching around clutter during points."
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
        heading: "Smaller table options",
        body: [
          "When a full-size 9-foot by 5-foot table cannot fit safely, a compact table or conversion top can preserve casual play without pretending to provide a regulation-size experience. Common compact footprints include roughly 7 feet by 3.5 feet and 4 feet by 2 feet, but dimensions vary by model.",
          "Measure the actual product in both playing and stored positions. A smaller top reduces the table footprint, but players still need clear space to move, swing, and retrieve the ball."
        ]
      },
      {
        heading: "Lighting, temperature, and flooring",
        body: [
          "Good lighting helps players see the ball clearly. Natural light is useful, but uncovered windows and direct glare can make the ball harder to track, so aim for bright, even light without a reflection on the tabletop.",
          "A comfortable planning range is about 20 to 25 degrees Celsius, or 68 to 77 degrees Fahrenheit. Flooring should be stable enough for movement; avoid surfaces that are slippery, uneven, brightly reflective, or likely to trip players."
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
    updatedDate: "2026-07-20",
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
          "For a standard game, you need a table, net assembly, ball, and paddle. The official playing surface is 2.74 metres long, 1.525 metres wide, and 76 centimetres high—about 9 feet by 5 feet by 2.5 feet—with a 15.25-centimetre net.",
          "The official ball is spherical, 40 millimetres in diameter, 2.7 grams, plastic, matte, and white or orange. A legal racket blade is flat and rigid, at least 85% natural wood by thickness, with a matte black side and a bright colour clearly different from black and the ball colour on the other side."
        ],
        links: [
          { label: "Shop tables", href: "/tables/" },
          { label: "Shop paddles", href: "/accessories/paddles/" },
          { label: "Shop balls", href: "/accessories/ping-pong-balls/" },
          { label: "Shop nets", href: "/accessories/nets/" }
        ]
      },
      {
        heading: "How to make a legal serve",
        body: [
          "The right to choose the first server, receiver, or end is decided by lot; a coin toss is a simple casual equivalent. Service starts with the ball resting freely on the open, stationary palm of the server's free hand.",
          "The server projects the ball near vertically without spin so it rises at least 16 centimetres, then strikes it as it falls. The ball must remain above the playing surface, behind the end line, and visible to the receiver before it is hit. A legal serve bounces first on the server's court and then directly on the receiver's court."
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
          "A legal return may pass directly over or around the net assembly, or touch it, as long as the ball then touches the opponent's court. During a rally, a net clip that still lands on the opponent's side remains in play."
        ],
        bullets: [
          "You lose the point if the ball bounces twice on your side.",
          "Do not volley a ball that is still above or travelling toward your playing surface before it bounces; that is obstruction.",
          "You lose the point if your return misses the opponent's side.",
          "You lose the point if you move the playing surface, touch the net assembly, or put your free hand on the playing surface during a rally.",
          "In doubles, hitting out of order loses the point."
        ]
      },
      {
        heading: "Games, matches, and doubles basics",
        body: [
          "A match consists of the best of an odd number of games, commonly 3, 5, or 7. Players change ends for each new game; in the last possible game of a match, they change ends when the first player or pair reaches 5 points.",
          "In doubles, the serve travels from the server's right half-court to the receiver's right half-court. Players then alternate returns in the fixed order. At each service change, the previous receiver becomes the server and the previous server's partner becomes the receiver."
        ]
      },
      {
        heading: "Common beginner questions",
        body: [
          "Can you only score on your serve? No. Either player or pair can win any point.",
          "Is a game played to 11 or 21? The current rule is 11 points, with a two-point lead required. At 10-10, service changes after every point.",
          "May you touch the table? Touching the vertical side is not the same as touching the playing surface, but moving the table, touching the net, or placing the free hand on the playing surface during a rally loses the point.",
          "What happens if the ball spins back over the net after landing on the opponent's side? The opponent may reach over or around the net to make a legal return; if no legal return is made, the player who produced the shot wins the point."
        ],
        links: [
          { label: "Read the buyer's guide", href: "/resources/choose-a-ping-pong-table" },
          {
            label: "Read the official 2026 ITTF Statutes",
            href: "https://documents.ittf.sport/sites/default/files/public/2026-02/2026_Statutes_v1_consolidated_clean.pdf"
          }
        ]
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
