// Data model for a Product

export interface Product {
  id: string;
  store_id: string;
  sku?: string | null;
  name: string;
  description?: string | null;
  price: number;
  stock_quantity: number;
  image_url?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}
