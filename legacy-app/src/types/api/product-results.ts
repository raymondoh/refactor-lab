import type { SerializedProduct } from "../models/product";

export type GetUserLikedProductsResult = {
  success: boolean;
  likedProducts?: string[];
  error?: string;
};

export interface GetAllProductsSuccess {
  success: true;
  data: SerializedProduct[];
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
  products: SerializedProduct[];
}

export interface GetRelatedProductsError {
  success: false;
  error: string;
}

export type GetRelatedProductsResult = GetRelatedProductsSuccess | GetRelatedProductsError;
