// ===============================
// 📂 src/firebase/admin/products.ts
// TEMP wrapper: re-export adminProductService functions
// ===============================

import { adminProductService } from "@/lib/services/admin-product-service";

// Keep the same exports so existing imports don't break
export const getAllProducts = adminProductService.getAllProducts;
export const getFilteredProducts = adminProductService.getFilteredProducts;

export const addProduct = adminProductService.addProduct;
export const getProductById = adminProductService.getProductById;
export const updateProduct = adminProductService.updateProduct;
export const deleteProduct = adminProductService.deleteProduct;

export const getFeaturedProducts = adminProductService.getFeaturedProducts;
export const getOnSaleProducts = adminProductService.getOnSaleProducts;
export const getNewArrivals = adminProductService.getNewArrivals;

export const getRelatedProducts = adminProductService.getRelatedProducts;

// NOTE:
// Likes should be moved to a separate like service next.
// For now, these exports are intentionally removed from this wrapper
// so we don't keep mixing domains.
