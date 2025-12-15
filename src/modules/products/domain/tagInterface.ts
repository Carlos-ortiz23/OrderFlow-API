// Data model for a Tag

export interface Tag {
  id: string;
  store_id: string;
  name: string;
  created_at?: string;
  product_count?: number; // Optional count of products with this tag
}
