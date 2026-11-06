import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  transpilePackages: [
    "three",
    "@react-three/fiber",
    "@react-three/drei",
    "@react-three/postprocessing",
  ],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
