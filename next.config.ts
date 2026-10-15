import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Standings live on the home page ("Live standings, stats & recent moves").
      { source: "/standings", destination: "/", permanent: true },
      // Player pages are /player/[playerId]; the bare path has no index, so
      // send visitors to the stock market, where every player is listed.
      { source: "/player", destination: "/stocks", permanent: false },
    ];
  },
};

export default nextConfig;
