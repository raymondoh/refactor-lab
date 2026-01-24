export interface Review {
  id: string;
  jobId: string;
  tradespersonId: string;
  customerId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface CreateReviewData {
  jobId: string;
  tradespersonId: string;
  customerId: string;
  rating: number;
  comment: string;
}
