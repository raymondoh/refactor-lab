// components/seo/json-ld.tsx
"use client";

import React from "react";

type Json = Record<string, unknown>;

export function JsonLd({ data }: { data: Json }) {
  // Ensures valid JSON string and avoids hydration mismatch
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
