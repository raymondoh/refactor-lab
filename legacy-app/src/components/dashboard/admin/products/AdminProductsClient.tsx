// src/components/dashboard/admin/products/AdminProductsClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

// This is the refactored ProductsDataTable that now handles its own useReactTable instance
import { ProductsDataTable } from "./ProductsDataTable";
import { getProductColumns } from "./products-columns";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import type { Product, GetAllProductsSuccess } from "@/types/product";
import type { Category } from "@/types/category"; // Make sure this type is correctly defined
import { deleteProductClient as deleteProduct } from "@/actions/client";
import { fetchAllProductsClient } from "@/actions/client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

interface AdminProductsClientProps {
  products: Product[]; // Initial products from server props
  categories: Category[];
  featuredCategories: Category[]; // Ensure this prop is consistently named if used
}

export function AdminProductsClient({
  products: initialProducts,
  categories,
  featuredCategories // Or whatever it's named in page.tsx
}: AdminProductsClientProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEditProduct = (id: string) => {
    router.push(`/admin/products/${id}`);
  };

  const handleDeleteRequest = (id: string) => {
    const product = products.find(p => p.id === id);
    if (product) {
      setProductToDelete(product);
    }
  };

  const refreshProducts = async () => {
    toast.info("Refreshing products...");
    try {
      const result = await fetchAllProductsClient(); // Assumes this fetches all products

      if (result.success) {
        // Explicit type guard to help TypeScript understand the discriminated union
        const successResult = result as GetAllProductsSuccess;
        setProducts(successResult.data);
        toast.success("Products refreshed successfully!");
        // If ProductsDataTable internally resets its pagination on data change, this is fine.
        // Otherwise, you might need a way to signal it, but typically for client-side
        // TanStack Table will re-paginate correctly with the new data.
      } else {
        // Type guard: if success is false, we know error exists
        toast.error(result.error || "Failed to fetch products");
      }
    } catch (err) {
      const message = isFirebaseError(err)
        ? firebaseError(err)
        : err instanceof Error
        ? err.message
        : "Failed to fetch products";
      toast.error(message);
    }
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteProduct(productToDelete.id);
      if (result.success) {
        toast.success(`Product "${productToDelete.name}" deleted successfully`);
        // Update the local state to reflect the deletion
        setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      } else {
        toast.error(result.error || "Failed to delete product");
      }
    } catch (err) {
      const message = isFirebaseError(err)
        ? firebaseError(err)
        : err instanceof Error
        ? err.message
        : "An error occurred while deleting the product";
      toast.error(message);
    } finally {
      setIsDeleting(false);
      setProductToDelete(null);
    }
  };

  // Define columns using the provided categories
  const columns = getProductColumns({
    onEdit: handleEditProduct,
    onDelete: handleDeleteRequest,
    categories: categories, // Pass categories to column definition if needed there
    featuredCategories: featuredCategories // Pass featuredCategories if needed
  });

  return (
    <div className="overflow-x-auto">
      {" "}
      {/* Consider removing if DataTable manages its own overflow well */}
      <ProductsDataTable
        columns={columns}
        data={products} // Pass the current product state
        onRefresh={refreshProducts}
        // categories and featuredCategories are passed to getProductColumns
        // If ProductsDataTable itself needs them (e.g. for custom filter components in its toolbar),
        // you'd pass them as props to ProductsDataTable.
      />
      <AlertDialog open={!!productToDelete} onOpenChange={open => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete <strong>{productToDelete?.name}</strong>. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
