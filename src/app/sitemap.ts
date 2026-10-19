import type { MetadataRoute } from "next";

const SITE_URL = "https://goathoopers.com";

/** Public, indexable routes. Account/auth pages are excluded (see robots.ts). */
const ROUTES: { path: string; changeFrequency: "hourly" | "daily" | "weekly"; priority: number }[] = [
  { path: "/", changeFrequency: "hourly", priority: 1 },
  { path: "/news", changeFrequency: "hourly", priority: 0.8 },
  { path: "/stocks", changeFrequency: "hourly", priority: 0.8 },
  { path: "/teams", changeFrequency: "daily", priority: 0.7 },
  { path: "/transactions", changeFrequency: "hourly", priority: 0.7 },
  { path: "/draft", changeFrequency: "weekly", priority: 0.6 },
  { path: "/intel", changeFrequency: "daily", priority: 0.6 },
  { path: "/table", changeFrequency: "daily", priority: 0.6 },
  { path: "/history", changeFrequency: "weekly", priority: 0.6 },
  { path: "/history/champions", changeFrequency: "weekly", priority: 0.5 },
  { path: "/history/hall-of-fame", changeFrequency: "weekly", priority: 0.5 },
  { path: "/weekly", changeFrequency: "weekly", priority: 0.6 },
  { path: "/arcade", changeFrequency: "weekly", priority: 0.5 },
  { path: "/ai-decides", changeFrequency: "weekly", priority: 0.5 },
  { path: "/trade-analyzer", changeFrequency: "weekly", priority: 0.5 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
