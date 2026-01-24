"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Eye, Trash2, Tag, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import type { Product } from "@/types/product";
import type { Category } from "@/types/category";
import { formatPrice } from "@/lib/utils";
// Define the allowed badge variant types
type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | null | undefined;
interface GetProductColumnsProps {
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  categories?: Category[];
  featuredCategories?: Category[];
}

export function getProductColumns({ onEdit, onDelete }: GetProductColumnsProps): ColumnDef<Product>[] {
  return [
    {
      accessorKey: "image",
      header: () => <div className="text-xs text-muted-foreground font-medium">Image</div>,
      cell: ({ row }) => {
        const image = row.original.image;
        return (
          <div className="relative h-10 w-10 rounded-md overflow-hidden">
            <Image
              src={image || "/placeholder.svg?height=40&width=40"}
              alt={row.original.name}
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
        );
      }
    },
    {
      accessorKey: "name",
      header: () => <div className="text-xs text-muted-foreground font-medium">Name</div>,
      cell: ({ row }) => <div className="font-medium whitespace-nowrap">{row.getValue("name")}</div>
    },
    {
      accessorKey: "sku",
      header: () => <div className="text-xs text-muted-foreground font-medium">SKU</div>,
      cell: ({ row }) => {
        const sku = row.original.sku;
        return sku ? (
          <div className="whitespace-nowrap text-muted-foreground text-sm">
            <Package className="inline-block h-3 w-3 mr-1" />
            {sku}
          </div>
        ) : null;
      }
    },
    {
      accessorKey: "price",
      header: () => <div className="text-xs text-muted-foreground font-medium text-center">Price</div>,
      cell: ({ row }) => {
        const price = Number(row.getValue("price"));
        // 2. Use the new 'formatPrice' function with the currency code
        const formatted = formatPrice(price, "gbp");

        const onSale = row.original.onSale;
        const salePrice = row.original.salePrice;

        if (onSale && salePrice) {
          const formattedSalePrice = formatPrice(Number(salePrice), "gbp");
          return (
            <div className="text-center whitespace-nowrap">
              <span className="line-through text-muted-foreground mr-2">{formatted}</span>
              <span className="text-destructive font-medium">{formattedSalePrice}</span>
            </div>
          );
        }

        return <div className="text-center whitespace-nowrap">{formatted}</div>;
      }
    },
    {
      accessorKey: "status",
      header: () => <div className="text-xs text-muted-foreground font-medium text-center">Status</div>,
      cell: ({ row }) => {
        const inStock = row.original.inStock !== false;
        const onSale = row.original.onSale === true;
        const isNewArrival = row.original.isNewArrival === true;

        return (
          <div className="flex flex-wrap gap-1 justify-center">
            <Badge variant={inStock ? "default" : "destructive"}>{inStock ? "In Stock" : "Out of Stock"}</Badge>

            {onSale && <Badge variant="destructive">Sale</Badge>}
            {isNewArrival && <Badge variant="secondary">New</Badge>}
          </div>
        );
      }
    },
    {
      accessorKey: "stockQuantity",
      header: () => <div className="text-xs text-muted-foreground font-medium text-center">Stock</div>,
      cell: ({ row }) => {
        const stockQuantity = row.getValue("stockQuantity") as number | undefined;
        // Fix: Access inStock from row.original instead of using row.getValue
        const inStock = row.original.inStock !== false;
        const lowStockThreshold = row.original.lowStockThreshold || 5;

        // Determine the badge variant based on stock status
        let badgeVariant: BadgeVariant = "default";

        if (!inStock || stockQuantity === 0) {
          badgeVariant = "destructive";
        } else if (stockQuantity && stockQuantity <= lowStockThreshold) {
          badgeVariant = "secondary"; // Or "outline" if you prefer
        }

        return (
          <div className="text-center">
            <Badge variant={badgeVariant}>{stockQuantity || (inStock ? "In Stock" : "Out of Stock")}</Badge>
          </div>
        );
      }
    },

    {
      accessorKey: "category",
      header: () => <div className="text-xs text-muted-foreground font-medium text-center">Category</div>,
      cell: ({ row }) => {
        const category = row.getValue("category") as string;
        const subcategory = row.original.subcategory;

        return (
          <div className="text-center whitespace-nowrap">
            {category}
            {subcategory && <span className="text-xs text-muted-foreground block">{subcategory}</span>}
          </div>
        );
      }
    },
    {
      accessorKey: "brand",
      header: () => <div className="text-xs text-muted-foreground font-medium text-center">Brand</div>,
      cell: ({ row }) => {
        const brand = row.original.brand;
        return brand ? <div className="text-center whitespace-nowrap">{brand}</div> : null;
      }
    },
    {
      accessorKey: "colorDisplayName",
      header: () => <div className="text-xs text-muted-foreground font-medium text-center">Color</div>,
      cell: ({ row }) => {
        // Use colorDisplayName if available, fall back to color
        const colorDisplayName = row.original.colorDisplayName || row.original.color;
        const baseColor = row.original.baseColor;

        if (!colorDisplayName && !baseColor) return null;

        return (
          <div className="text-center whitespace-nowrap flex items-center justify-center">
            {baseColor && (
              <div
                className="h-3 w-3 rounded-full mr-1 inline-block border border-gray-200"
                style={{ backgroundColor: baseColor }}
              />
            )}
            {colorDisplayName}
          </div>
        );
      }
    },
    {
      accessorKey: "tags",
      header: () => <div className="text-xs text-muted-foreground font-medium text-center">Tags</div>,
      cell: ({ row }) => {
        const tags = row.original.tags;
        if (!tags || tags.length === 0) return null;

        return (
          <div className="text-center">
            <Badge variant="outline" className="flex items-center">
              <Tag className="h-3 w-3 mr-1" />
              {tags.length}
            </Badge>
          </div>
        );
      }
    },
    {
      accessorKey: "featured",
      header: () => <div className="text-xs text-muted-foreground font-medium text-center">Featured</div>,
      cell: ({ row }) => {
        const isFeatured = row.original.isFeatured === true;
        const isHero = row.original.isHero === true;

        return (
          <div className="flex flex-col gap-1 items-center">
            {isFeatured && <Badge variant="default">Featured</Badge>}
            {isHero && <Badge variant="secondary">Hero</Badge>}
          </div>
        );
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const product = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <Eye className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEdit(product.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(product.id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.open(`/products/${product.id}`, "_blank")}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }
    }
  ];
}
