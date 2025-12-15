// Data model for a Category

export interface Category {
  id: string;
  store_id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  product_count?: number; // Optional count of products in this category
}
