// src/app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/" // block everything while in development
    }
    // sitemap omitted on purpose while developing
  };
}
// src/app/robots.ts LIVE VERSION
// import type { MetadataRoute } from "next";

// export default function robots(): MetadataRoute.Robots {
//   return {
//     rules: {
//       userAgent: "*",
//       allow: "/",
//     },
//     sitemap: "https://plumbersportal.com/sitemap.xml",
//   };
// }
