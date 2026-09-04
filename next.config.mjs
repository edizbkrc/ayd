/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-de5f679e78db4abeb9ff954dc296d387.r2.dev",
        pathname: "/**",
      },
      // Özel domain eklenirse buraya da ekle
    ],
  },
};

export default nextConfig;
