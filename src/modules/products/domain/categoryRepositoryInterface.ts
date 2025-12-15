import { Category } from './categoryInterface';

export interface CategoryRepository {
  createCategory(data: CreateCategoryData): Promise<Category>;
  getCategoryById(id: string, storeId: string): Promise<Category | null>;
  getAllCategories(storeId: string): Promise<Category[]>;
  updateCategory(id: string, data: UpdateCategoryData): Promise<Category | null>;
  deleteCategory(id: string, storeId: string): Promise<boolean>;
  addProductToCategory(productId: string, categoryId: string): Promise<boolean>;
  removeProductFromCategory(productId: string, categoryId: string): Promise<boolean>;
  getProductCategories(productId: string): Promise<Category[]>;
  getCategoryProducts(categoryId: string, storeId: string): Promise<any[]>;
}

export interface CreateCategoryData {
  store_id: string;
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  is_active?: boolean;
}
