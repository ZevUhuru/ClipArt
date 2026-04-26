const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["sharp"],
  trailingSlash: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.clip.art",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/packs",
        destination: "/design-bundles",
        permanent: true,
      },
      {
        source: "/packs/:path*",
        destination: "/design-bundles/:path*",
        permanent: true,
      },
      {
        source: "/my-art",
        destination: "/library",
        permanent: true,
      },
      {
        source: "/my-art/:path*",
        destination: "/library/:path*",
        permanent: true,
      },
      {
        source: "/shorts",
        destination: "/storyboard",
        permanent: true,
      },
    ];
  },
};

module.exports = withSentryConfig(nextConfig, {
  org: "esy-llc",
  project: "javascript-nextjs",

  silent: !process.env.CI,

  widenClientFileUpload: true,
});
