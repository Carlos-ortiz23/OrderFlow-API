// Data model for a Product

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  unit: string;
  category?: string;
  created_at?: string;
}
