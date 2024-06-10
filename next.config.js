const path = require('path');
const withMDX = require('@next/mdx')();
const dotenv = require('dotenv');

dotenv.config();

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  webpack: (config) => {
    config.resolve.alias['src'] = path.join(__dirname, 'src');
    return config;
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: ['res.cloudinary.com', 'assets.codepen.io', 'via.placeholder.com'],
  },
};

module.exports = withMDX(nextConfig);