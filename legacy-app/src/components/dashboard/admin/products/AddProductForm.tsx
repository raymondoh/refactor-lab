// src/components/dashboard/admin/products/AddProductForm.tsx
"use client";

import type React from "react";
import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { UniversalInput } from "@/components/forms/UniversalInput";
import { UniversalTextarea } from "@/components/forms/UniversalTextarea";
import { UniversalSelect } from "@/components/forms/UniversalSelect";
import { UniversalSwitch } from "@/components/forms/UniversalSwitch";
import { toast } from "sonner";
import { uploadFile } from "@/utils/uploadFile";
import { validateFileSize } from "@/utils/validateFileSize";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import {
  categories,
  subcategories,
  designThemes,
  productTypes,
  brands,
  materials,
  shippingClasses,
  tags as validTags,
  sizes
} from "@/config/categories";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProductAction } from "@/actions/products/create-product";
import { productSchema } from "@/schemas/product";
import { slugifyProductName } from "@/lib/urls/product-url";

import type { z } from "zod";

interface ProductFormProps {
  onSuccess?: () => void;
}

type ProductCreateInput = z.infer<typeof productSchema>;

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

// Weight options
const weightOptions = ["Light", "Medium", "Heavy"];

export function AddProductForm({ onSuccess }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  // Basic Information
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [badge, setBadge] = useState("");
  const [details, setDetails] = useState("");

  // Product Specifications
  const [dimensions, setDimensions] = useState("");
  const [material, setMaterial] = useState("");
  const [baseColor, setBaseColor] = useState("");
  const [colorDisplayName, setColorDisplayName] = useState("");
  const [stickySide, setStickySide] = useState("");
  const [weight, setWeight] = useState("");
  const [size, setSize] = useState("");

  // New fields for additional product details
  const [barcode, setBarcode] = useState("");
  const [tags, setTags] = useState("");
  const [brand, setBrand] = useState("");
  const [manufacturer, setManufacturer] = useState("");

  // Classification
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [designThemesStr, setDesignThemesStr] = useState("");
  const [productType, setProductType] = useState("");

  // Product Status
  const [inStock, setInStock] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isHero, setIsHero] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(true);
  const [onSale, setOnSale] = useState(false);
  const [salePrice, setSalePrice] = useState("");

  // Shipping & Inventory
  const [stockQuantity, setStockQuantity] = useState("100");
  const [lowStockThreshold, setLowStockThreshold] = useState("10");
  const [shippingWeight, setShippingWeight] = useState("");
  const [shippingClass, setShippingClass] = useState("Standard");

  // Media
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>([]);

  // Validation
  const [nameError, setNameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const additionalImagesInputRef = useRef<HTMLInputElement>(null);

  function resetForm() {
    setProductName("");
    setPrice("");
    setDescription("");
    setBadge("");
    setDetails("");
    setDimensions("");
    setMaterial("");
    setBaseColor("");
    setColorDisplayName("");
    setStickySide("");
    setWeight("");
    setSize("");
    setBarcode("");
    setTags("");
    setBrand("");
    setManufacturer("");
    setCategory("");
    setSubcategory("");
    setDesignThemesStr("");
    setProductType("");
    setInStock(true);
    setIsFeatured(false);
    setIsHero(false);
    setIsNewArrival(true);
    setOnSale(false);
    setSalePrice("");
    setStockQuantity("100");
    setLowStockThreshold("10");
    setShippingWeight("");
    setShippingClass("Standard");
    setPreviewUrl(null);
    setImageFile(null);
    setAdditionalImages([]);
    setAdditionalImagePreviews([]);
    setNameError(null);
    setFormError(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (additionalImagesInputRef.current) additionalImagesInputRef.current.value = "";
    setActiveTab("basic");
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const error = validateFileSize(file, 2);
    if (error) {
      toast.error(error);
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = e => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleAdditionalImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newFiles: File[] = [];
    const newPreviews: string[] = [];
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
          setAdditionalImagePreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
    setAdditionalImages(prev => [...prev, ...newFiles]);
  }

  function handleBaseColorChange(value: string) {
    setBaseColor(value);
    if (!colorDisplayName) {
      setColorDisplayName(value.charAt(0).toUpperCase() + value.slice(1));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    // Basic Client Validation
    if (productName.trim().length < 2) {
      setNameError("Product name must be at least 2 characters.");
      toast.error("Please enter a valid product name.");
      setActiveTab("basic");
      return;
    }
    if (!imageFile) {
      toast.error("Please select a product image.");
      setActiveTab("media");
      return;
    }

    startTransition(async () => {
      try {
        setIsUploading(true);
        // 1. Upload Images
        const imageUrl = await uploadFile(imageFile, { prefix: "product" });
        let additionalImageUrls: string[] = [];
        if (additionalImages.length > 0) {
          const uploadPromises = additionalImages.map(file => uploadFile(file, { prefix: "product" }));
          additionalImageUrls = await Promise.all(uploadPromises);
        }
        setIsUploading(false);

        // 2. Prepare Typed Payload
        const payload: ProductCreateInput = {
          slug: slugifyProductName(productName),
          name: productName.trim(),
          description,
          price: Number.parseFloat(price),
          category,
          subcategory: subcategory || undefined,

          badge: badge || undefined,
          details: details || undefined,
          dimensions: dimensions || undefined,
          material: material || undefined,
          baseColor: baseColor || undefined,
          colorDisplayName: colorDisplayName || undefined,
          stickySide: stickySide || undefined,
          weight: weight || undefined,
          //size: size || undefined,

          //barcode: barcode || undefined,
          brand: brand || undefined,
          //manufacturer: manufacturer || undefined,
          shippingClass: shippingClass || undefined,
          shippingWeight: shippingWeight || undefined,

          tags: tags
            ? tags
                .split(",")
                .map(t => t.trim())
                .filter(Boolean)
            : undefined,
          designThemes: designThemesStr
            ? designThemesStr
                .split(",")
                .map(t => t.trim())
                .filter(Boolean)
            : undefined,

          productType: productType || undefined,

          inStock,
          isFeatured,
          isHero,
          isNewArrival,
          onSale,

          salePrice: onSale && salePrice ? Number.parseFloat(salePrice) : undefined,
          stockQuantity: stockQuantity ? Number.parseInt(stockQuantity, 10) : undefined,
          lowStockThreshold: lowStockThreshold ? Number.parseInt(lowStockThreshold, 10) : undefined,

          image: imageUrl,
          additionalImages: additionalImageUrls.length > 0 ? additionalImageUrls : undefined,
          images: [imageUrl, ...additionalImageUrls]
        };

        // 3. Validate with Zod before Action
        const parsed = productSchema.safeParse(payload);
        if (!parsed.success) {
          const msg = parsed.error.issues[0]?.message ?? "Invalid product data";
          toast.error(msg);
          setFormError(msg);
          return;
        }

        // 4. Call Server Action
        const result = await createProductAction(parsed.data);

        if (result.ok) {
          toast.success(`"${productName}" added successfully!`);
          resetForm();
          onSuccess?.();
          setTimeout(() => router.push("/admin/products"), 2000);
        } else {
          setFormError(result.error || "Failed to add product");
          toast.error(result.error || "Failed to add product");
        }
      } catch (error: unknown) {
        const message = isFirebaseError(error) ? firebaseError(error) : "An unexpected error occurred.";
        setFormError(message);
        toast.error(message);
        console.error("[AddProductForm]", error);
      } finally {
        setIsUploading(false);
      }
    });
  }

  return (
    <div className="container max-w-4xl mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Add a New Product</CardTitle>
          <CardDescription>Required fields are marked with an asterisk (*).</CardDescription>
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
                  <UniversalInput
                    id="productName"
                    label="Product Name"
                    value={productName}
                    onChange={value => {
                      setProductName(value);
                      setNameError(value.length < 2 ? "Product name must be at least 2 characters." : null);
                    }}
                    required
                    error={nameError}
                  />
                  <UniversalInput
                    id="price"
                    label="Price (£)"
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={setPrice}
                    required
                  />
                  <UniversalInput id="barcode" label="Barcode / UPC" value={barcode} onChange={setBarcode} />
                </div>
                <UniversalTextarea
                  id="description"
                  label="Description"
                  value={description}
                  onChange={setDescription}
                  required
                  rows={4}
                />
                <UniversalTextarea
                  id="details"
                  label="Details (Optional)"
                  value={details}
                  onChange={setDetails}
                  rows={3}
                  placeholder="Additional details..."
                />
              </TabsContent>

              <TabsContent value="classification" className="space-y-6">
                <h3 className="text-2xl font-semibold tracking-tight mb-6 border-b pb-2">Classification</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <UniversalSelect
                    id="category"
                    label="Category"
                    value={category}
                    onChange={value => {
                      setCategory(value);
                      setSubcategory("");
                    }}
                    placeholder="Select Category"
                    required
                    options={categories.map(cat => ({ value: cat, label: cat }))}
                  />
                  <UniversalSelect
                    id="subcategory"
                    label="Subcategory"
                    value={subcategory}
                    onChange={setSubcategory}
                    placeholder="Select Subcategory"
                    disabled={!category}
                    options={
                      subcategories[category as keyof typeof subcategories]?.map(subcat => ({
                        value: subcat,
                        label: subcat
                      })) || []
                    }
                  />
                  <UniversalSelect
                    id="productType"
                    label="Product Type"
                    value={productType}
                    onChange={setProductType}
                    options={productTypes.map(type => ({ value: type, label: type }))}
                  />
                  <UniversalTextarea
                    id="designThemes"
                    label="Design Themes"
                    value={designThemesStr}
                    onChange={setDesignThemesStr}
                    placeholder="Vintage, Racing..."
                    helpText={`Available: ${designThemes.join(", ")}`}
                  />
                  <UniversalInput id="badge" label="Badge" value={badge} onChange={setBadge} />
                  <UniversalInput
                    id="tags"
                    label="Tags"
                    value={tags}
                    onChange={setTags}
                    helpText={`Available: ${validTags.join(", ")}`}
                  />
                  <UniversalSelect
                    id="brand"
                    label="Brand"
                    value={brand}
                    onChange={setBrand}
                    options={brands.map(b => ({ value: b, label: b }))}
                  />
                  <UniversalInput
                    id="manufacturer"
                    label="Manufacturer"
                    value={manufacturer}
                    onChange={setManufacturer}
                  />
                </div>
              </TabsContent>

              <TabsContent value="specifications" className="space-y-6">
                <h3 className="text-2xl font-semibold tracking-tight mb-6 border-b pb-2">Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <UniversalSelect
                    id="material"
                    label="Material"
                    value={material}
                    onChange={setMaterial}
                    options={materials.map(m => ({ value: m, label: m }))}
                  />
                  <UniversalInput id="dimensions" label="Dimensions" value={dimensions} onChange={setDimensions} />
                  <UniversalSelect
                    id="baseColor"
                    label="Base Color"
                    value={baseColor}
                    onChange={handleBaseColorChange}
                    options={standardColors.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))}
                  />
                  <UniversalInput
                    id="colorDisplayName"
                    label="Display Name"
                    value={colorDisplayName}
                    onChange={setColorDisplayName}
                  />
                  <UniversalSelect
                    id="stickySide"
                    label="Sticky Side"
                    value={stickySide}
                    onChange={setStickySide}
                    options={[
                      { value: "Front", label: "Front" },
                      { value: "Back", label: "Back" }
                    ]}
                  />
                  <UniversalSelect
                    id="size"
                    label="Size"
                    value={size}
                    onChange={setSize}
                    options={sizes.map(s => ({ value: s, label: s }))}
                  />
                  <UniversalSelect
                    id="weight"
                    label="Weight"
                    value={weight}
                    onChange={setWeight}
                    options={weightOptions.map(w => ({ value: w, label: w }))}
                  />
                  <UniversalInput
                    id="shippingWeight"
                    label="Shipping Weight"
                    value={shippingWeight}
                    onChange={setShippingWeight}
                  />
                </div>
              </TabsContent>

              <TabsContent value="status" className="space-y-6">
                <h3 className="text-2xl font-semibold tracking-tight mb-6 border-b pb-2">Status & Inventory</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <UniversalSwitch id="inStock" label="In Stock" checked={inStock} onChange={setInStock} />
                  <UniversalSwitch id="isFeatured" label="Featured" checked={isFeatured} onChange={setIsFeatured} />
                  <UniversalSwitch id="isHero" label="Hero" checked={isHero} onChange={setIsHero} />
                  <UniversalSwitch
                    id="isNewArrival"
                    label="New Arrival"
                    checked={isNewArrival}
                    onChange={setIsNewArrival}
                  />
                  <UniversalSwitch id="onSale" label="On Sale" checked={onSale} onChange={setOnSale} />
                  {onSale && (
                    <UniversalInput
                      id="salePrice"
                      label="Sale Price"
                      type="number"
                      value={salePrice}
                      onChange={setSalePrice}
                      required
                    />
                  )}
                  <UniversalInput
                    id="stockQuantity"
                    label="Stock"
                    type="number"
                    value={stockQuantity}
                    onChange={setStockQuantity}
                  />
                  <UniversalInput
                    id="lowStockThreshold"
                    label="Low Stock Alert"
                    type="number"
                    value={lowStockThreshold}
                    onChange={setLowStockThreshold}
                  />
                  <UniversalSelect
                    id="shippingClass"
                    label="Shipping Class"
                    value={shippingClass}
                    onChange={setShippingClass}
                    options={shippingClasses.map(s => ({ value: s, label: s }))}
                  />
                </div>
              </TabsContent>

              <TabsContent value="media" className="space-y-6">
                <h3 className="text-2xl font-semibold tracking-tight mb-6 border-b pb-2">Media</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Main Image*</Label>
                    <Input type="file" accept="image/*" onChange={handleImageChange} ref={imageInputRef} required />
                    <div className="h-40 border rounded bg-muted/30 relative">
                      {previewUrl && <Image src={previewUrl} alt="Preview" fill className="object-contain p-2" />}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Additional Images</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleAdditionalImagesChange}
                      ref={additionalImagesInputRef}
                    />
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {additionalImagePreviews.map((p, i) => (
                        <div key={i} className="h-20 border rounded relative">
                          <Image src={p} alt="Extra" fill className="object-contain" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <CardFooter className="justify-between p-0 pt-8 gap-4">
                <div className="flex gap-2">
                  {activeTab !== "basic" && (
                    <Button type="button" variant="outline" onClick={() => setActiveTab("basic")}>
                      Back
                    </Button>
                  )}
                </div>
                <SubmitButton isLoading={isPending || isUploading} loadingText="Saving...">
                  Add Product
                </SubmitButton>
              </CardFooter>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
