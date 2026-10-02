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
const releaseCommit = process.env.RENDER_GIT_COMMIT;
const releaseHeaders =
  releaseCommit && /^[a-f0-9]{40}$/i.test(releaseCommit)
    ? [{ key: "X-Tiger-Release", value: releaseCommit }]
    : [];

const nextConfig = {
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
        headers: [...securityHeaders, ...releaseHeaders]
      }
    ];
  }
};

export default nextConfig;
