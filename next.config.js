const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.clip.art",
      },
    ],
  },
};

module.exports = withSentryConfig(nextConfig, {
  org: "esy-llc",
  project: "javascript-nextjs",

  silent: !process.env.CI,

  widenClientFileUpload: true,
});
