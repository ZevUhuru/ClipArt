/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.clip.art",
      },
    ],
  },
};

module.exports = nextConfig;
