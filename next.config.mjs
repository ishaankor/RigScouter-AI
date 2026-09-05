/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: 'images-na.ssl-images-amazon.com' },
      { protocol: 'https', hostname: 'i.ebayimg.com' },
      { protocol: 'https', hostname: '*.ebayimg.com' },
      { protocol: 'https', hostname: '*.media-amazon.com' },
      { protocol: 'https', hostname: 'www.microcenter.com' },
      { protocol: 'https', hostname: 'c1.neweggimages.com' },
    ],
  },
};

export default nextConfig;
