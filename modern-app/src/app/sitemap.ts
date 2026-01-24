// src/app/sitemap.ts
import { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/url";
import { userService } from "@/lib/services/user-service";
import { staticMarketingRoutes } from "@/lib/config/marketing-routes";
import { CITIES, POPULAR_SERVICES } from "@/lib/config/locations";
import { toSlug } from "@/lib/utils/slugify";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  // 1. Static Marketing Routes
  const marketingEntries: MetadataRoute.Sitemap = staticMarketingRoutes.map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: "weekly",
    priority: route === "/" ? 1 : 0.6
  }));

  // 2. City Pages
  const cityEntries: MetadataRoute.Sitemap = CITIES.map(city => ({
    url: `${baseUrl}/plumbers/${toSlug(city)}`,
    lastModified: new Date().toISOString(),
    changeFrequency: "weekly",
    priority: 0.8
  }));

  // 3. City + Service Pages
  const cityServiceEntries: MetadataRoute.Sitemap = CITIES.flatMap(city =>
    POPULAR_SERVICES.map(service => ({
      url: `${baseUrl}/plumbers/${toSlug(city)}/${toSlug(service)}`,
      lastModified: new Date().toISOString(),
      changeFrequency: "weekly",
      priority: 0.8
    }))
  );

  // 4. Dynamic Plumber Profiles
  const plumbers = await userService.getActiveServiceProviders();
  const plumberProfileEntries: MetadataRoute.Sitemap = plumbers.map(plumber => ({
    url: `${baseUrl}/profile/tradesperson/${plumber.slug}`,
    lastModified: new Date(plumber.updatedAt || plumber.createdAt || Date.now()).toISOString(),
    changeFrequency: "monthly",
    priority: 0.7
  }));

  return [...marketingEntries, ...cityEntries, ...cityServiceEntries, ...plumberProfileEntries];
}
