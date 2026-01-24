// Types for product-related action results
import { SerializedProduct } from "./product";

export type GetUserLikedProductsResult = {
  success: boolean;
  likedProducts?: string[];
  error?: string;
};

export interface GetAllProductsSuccess {
  success: true;
  data: import("./product").SerializedProduct[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface GetAllProductsError {
  success: false;
  error: string;
}

export type GetAllProductsResult = GetAllProductsSuccess | GetAllProductsError;

export type DeleteProductResult = {
  success: boolean;
  error?: string;
};

export interface GetRelatedProductsSuccess {
  success: true;
  //products: import("./product").SerializedProduct[];
  products: SerializedProduct[];
}

export interface GetRelatedProductsError {
  success: false;
  error: string;
}

export type GetRelatedProductsResult = GetRelatedProductsSuccess | GetRelatedProductsError;
