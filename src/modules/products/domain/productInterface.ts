// Data model for a Product
import { Category } from './categoryInterface';
import { Tag } from './tagInterface';

export interface Product {
  id: string;
  store_id: string;
  sku?: string | null;
  name: string;
  description?: string | null;
  price: number;
  stock_quantity: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  categories?: Category[];
  tags?: Tag[];
}
