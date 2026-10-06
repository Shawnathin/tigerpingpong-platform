import process from "node:process";

/** @type {import("next").NextConfig} */
const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff"
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin"
  },
  {
    key: "X-Frame-Options",
    value: "DENY"
  },
  {
    key: "Permissions-Policy",
    value:
      "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()"
  }
];

// Render supplies this public Git SHA; expose it only when valid for release proof.
const releaseCommit = process.env.RENDER_GIT_COMMIT ?? process.env.TIGER_RELEASE_COMMIT;
const releaseHeaders =
  releaseCommit && /^[a-f0-9]{40}$/i.test(releaseCommit)
    ? [
        {
          key:
            process.env.TIGER_PREVIEW_MODE === "true"
              ? "X-Tiger-Preview-Base-Release"
              : "X-Tiger-Release",
          value: releaseCommit
        }
      ]
    : [];

const nextConfig = {
  ...(process.env.TIGER_PREVIEW_MODE === "true" ? { experimental: { cpus: 1 } } : {}),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/scp4c76g/image/upload/**"
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/djfcisldm/image/upload/**"
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/svl1myo8/image/upload/**"
      }
    ]
  },
  poweredByHeader: false,
  transpilePackages: ["@tigerpingpong/shared"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          ...securityHeaders,
          ...releaseHeaders,
          ...(process.env.TIGER_PREVIEW_MODE === "true"
            ? [
                { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
                { key: "X-Tiger-Preview", value: "synthetic-read-only" }
              ]
            : [])
        ]
      }
    ];
  }
};

export default nextConfig;
