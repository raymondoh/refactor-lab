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
import { addProductClient as addProduct } from "@/actions/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProductFormProps {
  onSuccess?: () => void;
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

// Weight options
const weightOptions = ["Light", "Medium", "Heavy"];

// Define a type for valid tags
type ValidTag = (typeof validTags)[number];

// Type guard function to check if a string is a valid tag
function isValidTag(tag: string): tag is ValidTag {
  return validTags.includes(tag as ValidTag);
}

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
  const [stickySide, setStickySide] = useState<"Front" | "Back" | "">("");
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
    // Reset all form fields
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

    // Reset file inputs
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (additionalImagesInputRef.current) additionalImagesInputRef.current.value = "";

    // Reset to first tab
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

    // Check if image file is selected
    if (!imageFile) {
      toast.error("Please select a product image.");
      setActiveTab("media");
      return;
    }

    startTransition(async () => {
      try {
        setIsUploading(true);
        let imageUrl = "";
        let additionalImageUrls: string[] = [];

        // Upload main image first
        imageUrl = await uploadFile(imageFile, { prefix: "product" });

        // Upload additional images if any
        if (additionalImages.length > 0) {
          const uploadPromises = additionalImages.map(file => uploadFile(file, { prefix: "product" }));
          additionalImageUrls = await Promise.all(uploadPromises);
        }

        setIsUploading(false);

        // Prepare tags array from comma-separated string
        const tagsArray = tags
          .split(",")
          .map(tag => tag.trim())
          .filter(tag => tag && isValidTag(tag));

        // Prepare design themes array from comma-separated string
        const designThemesArray = designThemesStr
          .split(",")
          .map(theme => theme.trim())
          .filter(theme => theme);

        // Create product data object with the uploaded image URL
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
          image: imageUrl, // Use the uploaded image URL
          additionalImages: additionalImageUrls.length > 0 ? additionalImageUrls : undefined,
          images: [imageUrl, ...additionalImageUrls],
          averageRating: 0,
          reviewCount: 0
        };

        // Add product
        const result = await addProduct(productData);

        if (result.success) {
          toast.success(`"${productName}" added successfully! Redirecting...`);
          resetForm();
          onSuccess?.();
          setTimeout(() => router.push("/admin/products"), 2000);
        } else {
          setFormError(result.error || "Failed to add product");
          toast.error(result.error || "Failed to add product");
        }
      } catch (error: unknown) {
        const message = isFirebaseError(error)
          ? firebaseError(error)
          : error instanceof Error
            ? error.message
            : "Unknown error occurred.";
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
          <CardDescription>
            Fill out each section to add a new product. Required fields are marked with an asterisk (*).
          </CardDescription>
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
                  placeholder="Additional product details, features, or care instructions"
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
                    placeholder="Select Product Type"
                    options={productTypes.map(type => ({ value: type, label: type }))}
                  />

                  <UniversalTextarea
                    id="designThemes"
                    label="Design Themes"
                    value={designThemesStr}
                    onChange={setDesignThemesStr}
                    rows={3}
                    placeholder="Enter design themes separated by commas (e.g., Vintage, Racing, Minimalist)"
                    helpText={`Available themes: ${designThemes.join(", ")}`}
                  />

                  <UniversalInput
                    id="badge"
                    label="Badge"
                    value={badge}
                    onChange={setBadge}
                    placeholder="e.g., New, Best Seller, Limited Edition"
                  />

                  <UniversalInput
                    id="tags"
                    label="Tags"
                    value={tags}
                    onChange={setTags}
                    placeholder="Enter tags separated by commas"
                    helpText={`Available tags: ${validTags.join(", ")}`}
                  />

                  <UniversalSelect
                    id="brand"
                    label="Brand"
                    value={brand}
                    onChange={value => setBrand(value.trim())}
                    placeholder="Select a brand"
                    options={brands.map(brandOption => ({ value: brandOption, label: brandOption }))}
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
                <h3 className="text-2xl font-semibold tracking-tight mb-6 border-b pb-2">Product Specifications</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <UniversalSelect
                    id="material"
                    label="Material"
                    value={material}
                    onChange={setMaterial}
                    placeholder="Select a material"
                    options={materials.map(materialOption => ({ value: materialOption, label: materialOption }))}
                  />

                  <UniversalInput
                    id="dimensions"
                    label="Dimensions"
                    value={dimensions}
                    onChange={setDimensions}
                    placeholder="e.g., 10cm x 15cm"
                  />

                  <UniversalSelect
                    id="baseColor"
                    label="Base Color"
                    value={baseColor}
                    onChange={handleBaseColorChange}
                    placeholder="Select a base color"
                    options={standardColors.map(color => ({
                      value: color,
                      label: color.charAt(0).toUpperCase() + color.slice(1)
                    }))}
                  />

                  <UniversalInput
                    id="colorDisplayName"
                    label="Color Display Name"
                    value={colorDisplayName}
                    onChange={setColorDisplayName}
                    placeholder="e.g., Electric Blue, Cameo Green"
                    helpText="Descriptive color name shown to customers"
                  />

                  <UniversalSelect
                    id="stickySide"
                    label="Sticky Side"
                    value={stickySide}
                    onChange={value => setStickySide(value as "Front" | "Back" | "")}
                    placeholder="Select sticky side"
                    options={[
                      { value: "na", label: "Not applicable" },
                      { value: "Front", label: "Front" },
                      { value: "Back", label: "Back" }
                    ]}
                  />

                  <UniversalSelect
                    id="size"
                    label="Size"
                    value={size}
                    onChange={setSize}
                    placeholder="Select size"
                    options={[
                      { value: "na", label: "Not applicable" },
                      ...sizes.map(sizeOption => ({ value: sizeOption, label: sizeOption }))
                    ]}
                  />

                  <UniversalSelect
                    id="weight"
                    label="Weight"
                    value={weight}
                    onChange={setWeight}
                    placeholder="Select weight"
                    options={[
                      { value: "na", label: "Not applicable" },
                      ...weightOptions.map(option => ({ value: option, label: option }))
                    ]}
                  />

                  <UniversalInput
                    id="shippingWeight"
                    label="Shipping Weight"
                    value={shippingWeight}
                    onChange={setShippingWeight}
                    placeholder="e.g., 0.5kg"
                  />
                </div>
              </TabsContent>

              <TabsContent value="status" className="space-y-6">
                <h3 className="text-2xl font-semibold tracking-tight mb-6 border-b pb-2">Product Status</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <UniversalSwitch id="inStock" label="In Stock" checked={inStock} onChange={setInStock} />

                  <UniversalSwitch
                    id="isFeatured"
                    label="Featured Product"
                    checked={isFeatured}
                    onChange={setIsFeatured}
                  />

                  <UniversalSwitch id="isHero" label="Hero Carousel" checked={isHero} onChange={setIsHero} />

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
                      label="Sale Price (£)"
                      type="number"
                      step="0.01"
                      min="0"
                      value={salePrice}
                      onChange={setSalePrice}
                      required={onSale}
                    />
                  )}
                </div>

                <h3 className="text-2xl font-semibold tracking-tight mt-8 mb-6 border-b pb-2">Inventory Management</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <UniversalInput
                    id="stockQuantity"
                    label="Stock Quantity"
                    type="number"
                    min="0"
                    value={stockQuantity}
                    onChange={setStockQuantity}
                  />

                  <UniversalInput
                    id="lowStockThreshold"
                    label="Low Stock Threshold"
                    type="number"
                    min="0"
                    value={lowStockThreshold}
                    onChange={setLowStockThreshold}
                  />

                  <UniversalSelect
                    id="shippingClass"
                    label="Shipping Class"
                    value={shippingClass}
                    onChange={setShippingClass}
                    placeholder="Select shipping class"
                    options={shippingClasses.map(option => ({ value: option, label: option }))}
                  />
                </div>
              </TabsContent>

              <TabsContent value="media" className="space-y-6">
                <h3 className="text-2xl font-semibold tracking-tight mb-6 border-b pb-2">Product Images</h3>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="image" className="text-base font-semibold uppercase tracking-wide">
                      Main Product Image*
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Input
                          id="image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          ref={imageInputRef}
                          required
                          className="border-input dark:border-opacity-50 focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Max 2MB recommended.</p>
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
                          <div className="text-muted-foreground text-sm">Image preview will appear here</div>
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
                      className="border-input dark:border-opacity-50 focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Select multiple files (max 5 images, 2MB each)</p>

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
                  className="min-w-[140px] h-12 px-6 text-md font-semibold uppercase">
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
