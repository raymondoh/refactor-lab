"use client";

export function ProductsHeader() {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold">Our Stickers</h1>
        <p className="text-muted-foreground mt-1">Browse our collection of premium motorcycle decals and stickers</p>
      </div>
    </div>
  );
}
