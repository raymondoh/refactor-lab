"use client";

import type React from "react";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { toast } from "sonner";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { uploadFile } from "@/utils/uploadFile";
import { validateFileSize } from "@/utils/validateFileSize";
import { ArrowLeft, AlertCircle } from "lucide-react";
import type { Product } from "@/types/product";
import {
  categories,
  subcategories,
  designThemes,
  productTypes,
  brands,
  materials,
  shippingClasses
} from "@/config/categories";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { updateProductClient as updateProduct } from "@/actions/client";

interface UpdateProductFormProps {
  product: Product;
}

// Standard color options for filtering
const standardColors = [
  "red",
  "blue",
  "green",
  "black",
  "white",
  "yellow",
  "orange",
  "purple",
  "pink",
  "gray",
  "brown",
  "silver",
  "gold",
  "clear"
];

// Size options for products
const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL", "One Size"];

// Weight options
const weightOptions = ["Light", "Medium", "Heavy"];

export function UpdateProductForm({ product }: UpdateProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  // Basic Information
  const [productName, setProductName] = useState(product.name);
  const [price, setPrice] = useState(product.price.toString());
  const [description, setDescription] = useState(product.description || "");
  const [badge, setBadge] = useState(product.badge || "");
  const [details, setDetails] = useState(product.details || "");

  // Product Specifications
  const [dimensions, setDimensions] = useState(product.dimensions || "");
  const [material, setMaterial] = useState(product.material || "");
  const [baseColor, setBaseColor] = useState(product.baseColor || "");
  const [colorDisplayName, setColorDisplayName] = useState(product.colorDisplayName || product.color || "");
  const [stickySide, setStickySide] = useState<"Front" | "Back" | "">(product.stickySide || "");
  const [weight, setWeight] = useState(product.weight || "");
  const [size, setSize] = useState(product.size || "");

  // New fields for additional product details
  const [sku, setSku] = useState(product.sku || "");
  const [barcode, setBarcode] = useState(product.barcode || "");
  const [tags, setTags] = useState(Array.isArray(product.tags) ? product.tags.join(", ") : "");
  const [brand, setBrand] = useState(product.brand || "");
  const [manufacturer, setManufacturer] = useState(product.manufacturer || "");

  // Classification
  const [category, setCategory] = useState(product.category || "");
  const [subcategory, setSubcategory] = useState(product.subcategory || "");
  const [designThemesStr, setDesignThemesStr] = useState(
    Array.isArray(product.designThemes) ? product.designThemes.join(", ") : ""
  );
  const [productType, setProductType] = useState(product.productType || "");

  // Product Status - FIX: Read from product data instead of hardcoding
  const [inStock, setInStock] = useState(product.inStock !== false);
  const [isFeatured, setIsFeatured] = useState(product.isFeatured === true);
  const [isHero, setIsHero] = useState(product.isHero === true);
  const [isNewArrival, setIsNewArrival] = useState(product.isNewArrival === true); // FIX: Read from product
  const [onSale, setOnSale] = useState(product.onSale === true); // FIX: Read from product instead of hardcoding false
  const [salePrice, setSalePrice] = useState(product.salePrice?.toString() || "");

  // Shipping & Inventory
  const [stockQuantity, setStockQuantity] = useState(product.stockQuantity?.toString() || "100");
  const [lowStockThreshold, setLowStockThreshold] = useState(product.lowStockThreshold?.toString() || "10");
  const [shippingWeight, setShippingWeight] = useState(product.shippingWeight || "");
  const [shippingClass, setShippingClass] = useState(product.shippingClass || "standard");

  // Media
  const [previewUrl, setPreviewUrl] = useState<string | null>(product.image || null);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>(
    Array.isArray(product.additionalImages) ? product.additionalImages : []
  );

  // Validation
  const [nameError, setNameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const additionalImagesInputRef = useRef<HTMLInputElement>(null);

  // If product has color but no baseColor, try to determine baseColor from color
  useEffect(() => {
    if (!product.baseColor && product.color) {
      // Try to match the color to a standard color
      const lowerColor = product.color.toLowerCase();
      const matchedColor = standardColors.find(color => lowerColor.includes(color));
      if (matchedColor) {
        setBaseColor(matchedColor);
      }
    }
  }, [product]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFileSize(file, 2);
    if (error) {
      toast.error(error);
      return;
    }

    setNewImageFile(file);
    const reader = new FileReader();
    reader.onload = e => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleAdditionalImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    // Process each file
    Array.from(files).forEach(file => {
      const error = validateFileSize(file, 2);
      if (error) {
        toast.error(`${file.name}: ${error}`);
        return;
      }

      newFiles.push(file);

      const reader = new FileReader();
      reader.onload = e => {
        if (e.target?.result) {
          newPreviews.push(e.target.result as string);
          setAdditionalImagePreviews([...additionalImagePreviews, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setAdditionalImages([...additionalImages, ...newFiles]);
  }

  // Update colorDisplayName when baseColor changes if colorDisplayName is empty
  function handleBaseColorChange(value: string) {
    setBaseColor(value);
    if (!colorDisplayName) {
      // Capitalize first letter of base color for display name
      setColorDisplayName(value.charAt(0).toUpperCase() + value.slice(1));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    // Validate required fields
    if (productName.trim().length < 2) {
      setNameError("Product name must be at least 2 characters.");
      toast.error("Please enter a valid product name.");
      setActiveTab("basic");
      return;
    }

    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      toast.error("Please enter a valid price.");
      setActiveTab("basic");
      return;
    }

    if (!category) {
      toast.error("Please select a category.");
      setActiveTab("classification");
      return;
    }

    if (onSale && (!salePrice || isNaN(Number(salePrice)) || Number(salePrice) <= 0)) {
      toast.error("Please enter a valid sale price.");
      setActiveTab("status");
      return;
    }

    startTransition(async () => {
      try {
        let imageUrl = product.image || "";
        let additionalImageUrls: string[] = Array.isArray(product.additionalImages) ? product.additionalImages : [];

        // Upload main image if changed
        if (newImageFile) {
          setIsUploading(true);
          imageUrl = await uploadFile(newImageFile, { prefix: "product" });
        }

        // Upload additional images if any new ones
        if (additionalImages.length > 0) {
          const uploadPromises = additionalImages.map(file => uploadFile(file, { prefix: "product" }));
          const newUrls = await Promise.all(uploadPromises);
          additionalImageUrls = [...additionalImageUrls, ...newUrls];
        }

        // Prepare tags array from comma-separated string
        const tagsArray = tags
          .split(",")
          .map(tag => tag.trim())
          .filter(tag => tag);

        // Prepare design themes array from comma-separated string
        const designThemesArray = designThemesStr
          .split(",")
          .map(theme => theme.trim())
          .filter(theme => theme);

        // Create product data object
        const productData = {
          name: productName.trim(),
          price: Number.parseFloat(price),
          description,
          badge: badge || undefined,
          details: details || undefined,
          dimensions: dimensions || undefined,
          material: material || undefined,
          baseColor: baseColor || undefined,
          colorDisplayName: colorDisplayName || undefined,
          color: colorDisplayName || baseColor || undefined, // Keep for backward compatibility
          stickySide: stickySide || undefined,
          weight: weight || undefined,
          size: size || undefined,
          sku: sku || undefined,
          barcode: barcode || undefined,
          tags: tagsArray.length > 0 ? tagsArray : undefined,
          brand: brand ? brand.trim() : undefined,
          manufacturer: manufacturer || undefined,
          category: category || undefined,
          subcategory: subcategory || undefined,
          designThemes: designThemesArray.length > 0 ? designThemesArray : undefined,
          productType: productType || undefined,
          inStock,
          isFeatured,
          isHero,
          isNewArrival,
          onSale,
          salePrice: onSale ? Number.parseFloat(salePrice) : undefined,
          stockQuantity: Number.parseInt(stockQuantity) || 100,
          lowStockThreshold: Number.parseInt(lowStockThreshold) || 10,
          shippingWeight: shippingWeight || undefined,
          shippingClass: shippingClass || "standard",
          image: imageUrl,
          additionalImages: additionalImageUrls.length > 0 ? additionalImageUrls : undefined,
          images: [imageUrl, ...additionalImageUrls]
        };

        console.log("Submitting product data:", JSON.stringify(productData, null, 2));

        // Update product
        const result = await updateProduct(product.id, productData);

        if (result.success) {
          toast.success(`"${productName}" updated successfully! Redirecting...`);
          router.refresh();
          setTimeout(() => router.push("/admin/products"), 2000);
        } else {
          setFormError(result.error || "Failed to update product");
          toast.error(result.error || "Failed to update product");
        }
      } catch (error: unknown) {
        const message = isFirebaseError(error)
          ? firebaseError(error)
          : error instanceof Error
            ? error.message
            : "Unknown error occurred.";
        setFormError(message);
        toast.error(message);
        console.error("[UpdateProductForm]", error);
      } finally {
        setIsUploading(false);
      }
    });
  }

  return (
    <div className="container max-w-4xl mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-semibold tracking-tight">Update Product</CardTitle>
          <CardDescription>Modify the details below and click update to save changes.</CardDescription>
        </CardHeader>
        <CardContent>
          {formError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid grid-cols-5 mb-8">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="classification">Classification</TabsTrigger>
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-8">
              <TabsContent value="basic" className="space-y-6">
                <h3 className="text-2xl font-semibold tracking-tight mb-6 border-b pb-2">Basic Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="productName" className="text-base font-semibold uppercase tracking-wide">
                      Product Name*
                    </Label>
                    <Input
                      id="productName"
                      value={productName}
                      onChange={e => {
                        setProductName(e.target.value);
                        setNameError(e.target.value.length < 2 ? "Product name must be at least 2 characters." : null);
                      }}
                      required
                      className="h-14 text-lg px-4 border-input focus:ring-2 focus:ring-primary"
                    />
                    {nameError && <p className="text-sm text-red-600">{nameError}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-base font-semibold uppercase tracking-wide">
                      Price (£)*
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      required
                      className="h-14 text-lg px-4 border-input focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sku" className="text-base font-semibold uppercase tracking-wide">
                      SKU
                    </Label>
                    <Input
                      id="sku"
                      value={sku}
                      onChange={e => setSku(e.target.value)}
                      className="h-14 text-lg px-4 border-input focus:ring-2 focus:ring-primary"
                      placeholder="e.g., STK-12345"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="barcode" className="text-base font-semibold uppercase tracking-wide">
                      Barcode / UPC
                    </Label>
                    <Input
                      id="barcode"
                      value={barcode}
                      onChange={e => setBarcode(e.target.value)}
                      className="h-14 text-lg px-4 border-input focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base font-semibold uppercase tracking-wide">
                    Description*
                  </Label>
                  <Textarea
                    id="description"
                    rows={4}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    required
                    className="min-h-[100px] text-lg px-4 py-3 border-input focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="details" className="text-base font-semibold uppercase tracking-wide">
                    Details (Optional)
                  </Label>
                  <Textarea
                    id="details"
                    rows={3}
                    value={details}
                    onChange={e => setDetails(e.target.value)}
                    className="min-h-[80px] text-lg px-4 py-3 border-input focus:ring-2 focus:ring-primary"
                    placeholder="Additional product details, features, or care instructions"
                  />
                </div>
              </TabsContent>

              <TabsContent value="classification" className="space-y-6">
                <h3 className="text-2xl font-semibold tracking-tight mb-6 border-b pb-2">Classification</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-base font-semibold uppercase tracking-wide">
                      Category*
                    </Label>
                    <Select
                      value={category}
                      onValueChange={value => {
                        setCategory(value);
                        setSubcategory("");
                      }}>
                      <SelectTrigger id="category" className="h-14 text-lg px-4 border-input">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subcategory" className="text-base font-semibold uppercase tracking-wide">
                      Subcategory
                    </Label>
                    <Select value={subcategory} onValueChange={setSubcategory} disabled={!category}>
                      <SelectTrigger id="subcategory" className="h-14 text-lg px-4 border-input">
                        <SelectValue placeholder="Select Subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {subcategories[category as keyof typeof subcategories]?.map(subcat => (
                          <SelectItem key={subcat} value={subcat}>
                            {subcat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productType" className="text-base font-semibold uppercase tracking-wide">
                      Product Type
                    </Label>
                    <Select value={productType} onValueChange={setProductType}>
                      <SelectTrigger id="productType" className="h-14 text-lg px-4 border-input">
                        <SelectValue placeholder="Select Product Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {productTypes.map(type => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="designThemes" className="text-base font-semibold uppercase tracking-wide">
                      Design Themes
                    </Label>
                    <Textarea
                      id="designThemes"
                      value={designThemesStr}
                      onChange={e => setDesignThemesStr(e.target.value)}
                      className="min-h-[80px] text-lg px-4 py-3 border-input focus:ring-2 focus:ring-primary"
                      placeholder="Enter design themes separated by commas (e.g., Vintage, Racing, Minimalist)"
                    />
                    <p className="text-xs text-muted-foreground">Available themes: {designThemes.join(", ")}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="badge" className="text-base font-semibold uppercase tracking-wide">
                      Badge
                    </Label>
                    <Input
                      id="badge"
                      value={badge}
                      onChange={e => setBadge(e.target.value)}
                      className="h-14 text-lg px-4 border-input focus:ring-2 focus:ring-primary"
                      placeholder="e.g., New, Best Seller, Limited Edition"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags" className="text-base font-semibold uppercase tracking-wide">
                      Tags
                    </Label>
                    <Input
                      id="tags"
                      value={tags}
                      onChange={e => setTags(e.target.value)}
                      className="h-14 text-lg px-4 border-input focus:ring-2 focus:ring-primary"
                      placeholder="Enter tags separated by commas"
                    />
                    <p className="text-xs text-muted-foreground">Helps with search and filtering</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand" className="text-base font-semibold uppercase tracking-wide">
                      Brand
                    </Label>
                    <Select value={brand} onValueChange={value => setBrand(value.trim())}>
                      <SelectTrigger id="brand" className="h-14 text-lg px-4 border-input">
                        <SelectValue placeholder="Select a brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map(brandOption => (
                          <SelectItem key={brandOption} value={brandOption}>
                            {brandOption}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manufacturer" className="text-base font-semibold uppercase tracking-wide">
                      Manufacturer
                    </Label>
                    <Input
                      id="manufacturer"
                      value={manufacturer}
                      onChange={e => setManufacturer(e.target.value)}
                      className="h-14 text-lg px-4 border-input focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="specifications" className="space-y-6">
                <h3 className="text-2xl font-semibold tracking-tight mb-6 border-b pb-2">Product Specifications</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="material" className="text-base font-semibold uppercase tracking-wide">
                      Material
                    </Label>
                    <Select value={material} onValueChange={setMaterial}>
                      <SelectTrigger id="material" className="h-14 text-lg px-4 border-input">
                        <SelectValue placeholder="Select a material" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map(materialOption => (
                          <SelectItem key={materialOption} value={materialOption}>
                            {materialOption}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dimensions" className="text-base font-semibold uppercase tracking-wide">
                      Dimensions
                    </Label>
                    <Input
                      id="dimensions"
                      value={dimensions}
                      onChange={e => setDimensions(e.target.value)}
                      className="h-14 text-lg px-4 border-input focus:ring-2 focus:ring-primary"
                      placeholder="e.g., 10cm x 15cm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="baseColor" className="text-base font-semibold uppercase tracking-wide">
                      Base Color
                    </Label>
                    <Select value={baseColor} onValueChange={handleBaseColorChange}>
                      <SelectTrigger id="baseColor" className="h-14 text-lg px-4 border-input">
                        <SelectValue placeholder="Select a base color" />
                      </SelectTrigger>
                      <SelectContent>
                        {standardColors.map(color => (
                          <SelectItem key={color} value={color}>
                            {color.charAt(0).toUpperCase() + color.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="colorDisplayName" className="text-base font-semibold uppercase tracking-wide">
                      Color Display Name
                    </Label>
                    <Input
                      id="colorDisplayName"
                      value={colorDisplayName}
                      onChange={e => setColorDisplayName(e.target.value)}
                      placeholder="e.g., Electric Blue, Cameo Green"
                      className="h-14 text-lg px-4 border-input focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground">Descriptive color name shown to customers</p>
                  </div>

                  {/* For stickers specifically */}
                  <div className="space-y-2">
                    <Label htmlFor="stickySide" className="text-base font-semibold uppercase tracking-wide">
                      Sticky Side
                    </Label>
                    <Select value={stickySide} onValueChange={value => setStickySide(value as "Front" | "Back" | "")}>
                      <SelectTrigger id="stickySide" className="h-14 text-lg px-4 border-input">
                        <SelectValue placeholder="Select sticky side" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="na">Not applicable</SelectItem>
                        <SelectItem value="Front">Front</SelectItem>
                        <SelectItem value="Back">Back</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="size" className="text-base font-semibold uppercase tracking-wide">
                      Size
                    </Label>
                    <Select value={size} onValueChange={setSize}>
                      <SelectTrigger id="size" className="h-14 text-lg px-4 border-input">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="na">Not applicable</SelectItem>
                        {sizeOptions.map(option => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight" className="text-base font-semibold uppercase tracking-wide">
                      Weight
                    </Label>
                    <Select value={weight} onValueChange={setWeight}>
                      <SelectTrigger id="weight" className="h-14 text-lg px-4 border-input">
                        <SelectValue placeholder="Select weight" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="na">Not applicable</SelectItem>
                        {weightOptions.map(option => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shippingWeight" className="text-base font-semibold uppercase tracking-wide">
                      Shipping Weight
                    </Label>
                    <Input
                      id="shippingWeight"
                      value={shippingWeight}
                      onChange={e => setShippingWeight(e.target.value)}
                      className="h-14 text-lg px-4 border-input focus:ring-2 focus:ring-primary"
                      placeholder="e.g., 0.5kg"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="status" className="space-y-6">
                <h3 className="text-2xl font-semibold tracking-tight mb-6 border-b pb-2">Product Status</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="inStock" className="text-base font-semibold">
                      In Stock
                    </Label>
                    <Switch id="inStock" checked={inStock} onCheckedChange={setInStock} />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="isFeatured" className="text-base font-semibold">
                      Featured Product
                    </Label>
                    <Switch id="isFeatured" checked={isFeatured} onCheckedChange={setIsFeatured} />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="isHero" className="text-base font-semibold">
                      Hero Carousel
                    </Label>
                    <Switch id="isHero" checked={isHero} onCheckedChange={setIsHero} />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="isNew" className="text-base font-semibold">
                      New Arrival
                    </Label>
                    <Switch id="isNew" checked={isNewArrival} onCheckedChange={setIsNewArrival} />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="isSale" className="text-base font-semibold">
                      On Sale
                    </Label>
                    <Switch id="isSale" checked={onSale} onCheckedChange={setOnSale} />
                  </div>

                  {onSale && (
                    <div className="space-y-2">
                      <Label htmlFor="salePrice" className="text-base font-semibold uppercase tracking-wide">
                        Sale Price (£)
                      </Label>
                      <Input
                        id="salePrice"
                        type="number"
                        step="0.01"
                        min="0"
                        value={salePrice}
                        onChange={e => setSalePrice(e.target.value)}
                        required={onSale}
                        className="h-14 text-lg px-4 border-input focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  )}
                </div>

                <h3 className="text-2xl font-semibold tracking-tight mt-8 mb-6 border-b pb-2">Inventory Management</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="stockQuantity" className="text-base font-semibold uppercase tracking-wide">
                      Stock Quantity
                    </Label>
                    <Input
                      id="stockQuantity"
                      type="number"
                      min="0"
                      value={stockQuantity}
                      onChange={e => setStockQuantity(e.target.value)}
                      className="h-14 text-lg px-4 border-input focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lowStockThreshold" className="text-base font-semibold uppercase tracking-wide">
                      Low Stock Threshold
                    </Label>
                    <Input
                      id="lowStockThreshold"
                      type="number"
                      min="0"
                      value={lowStockThreshold}
                      onChange={e => setLowStockThreshold(e.target.value)}
                      className="h-14 text-lg px-4 border-input focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shippingClass" className="text-base font-semibold uppercase tracking-wide">
                      Shipping Class
                    </Label>
                    <Select value={shippingClass} onValueChange={setShippingClass}>
                      <SelectTrigger id="shippingClass" className="h-14 text-lg px-4 border-input">
                        <SelectValue placeholder="Select shipping class" />
                      </SelectTrigger>
                      <SelectContent>
                        {shippingClasses.map(option => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="media" className="space-y-6">
                <h3 className="text-2xl font-semibold tracking-tight mb-6 border-b pb-2">Product Images</h3>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="image" className="text-base font-semibold uppercase tracking-wide">
                      Main Product Image
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Input
                          id="image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          ref={imageInputRef}
                          className="border-input"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Leave empty to keep current image.</p>
                      </div>
                      <div className="flex items-center justify-center border rounded-md h-[150px] bg-muted/30">
                        {previewUrl ? (
                          <div className="relative w-full h-full">
                            <Image
                              src={previewUrl || "/placeholder.svg"}
                              alt="Preview"
                              fill
                              className="object-contain p-2"
                            />
                          </div>
                        ) : (
                          <div className="text-muted-foreground text-sm">No image available</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="additionalImages" className="text-base font-semibold uppercase tracking-wide">
                      Additional Images
                    </Label>
                    <Input
                      id="additionalImages"
                      type="file"
                      accept="image/*"
                      onChange={handleAdditionalImagesChange}
                      ref={additionalImagesInputRef}
                      multiple
                      className="border-input"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Select multiple files to add more images (max 5 images, 2MB each)
                    </p>

                    {additionalImagePreviews.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
                        {additionalImagePreviews.map((preview, index) => (
                          <div key={index} className="relative h-24 border rounded-md overflow-hidden">
                            <Image
                              src={preview || "/placeholder.svg"}
                              alt={`Additional image ${index + 1}`}
                              fill
                              className="object-contain p-1"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <CardFooter className="justify-between p-0 pt-8 flex-wrap gap-4">
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>

                  {activeTab !== "basic" && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const tabs = ["basic", "classification", "specifications", "status", "media"];
                        const currentIndex = tabs.indexOf(activeTab);
                        if (currentIndex > 0) {
                          setActiveTab(tabs[currentIndex - 1]);
                        }
                      }}>
                      Previous
                    </Button>
                  )}

                  {activeTab !== "media" && (
                    <Button
                      type="button"
                      onClick={() => {
                        const tabs = ["basic", "classification", "specifications", "status", "media"];
                        const currentIndex = tabs.indexOf(activeTab);
                        if (currentIndex < tabs.length - 1) {
                          setActiveTab(tabs[currentIndex + 1]);
                        }
                      }}>
                      Next
                    </Button>
                  )}
                </div>

                <SubmitButton
                  isLoading={isPending || isUploading}
                  loadingText={isUploading ? "Uploading..." : "Saving..."}
                  className="min-w-[140px] h-14 text-md font-bold tracking-wide uppercase">
                  Update Product
                </SubmitButton>
              </CardFooter>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
