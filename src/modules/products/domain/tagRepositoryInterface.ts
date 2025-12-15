import { Tag } from './tagInterface';

export interface TagRepository {
  createTag(data: CreateTagData): Promise<Tag>;
  getTagById(id: string, storeId: string): Promise<Tag | null>;
  getAllTags(storeId: string): Promise<Tag[]>;
  updateTag(id: string, data: UpdateTagData): Promise<Tag | null>;
  deleteTag(id: string, storeId: string): Promise<boolean>;
  addProductToTag(productId: string, tagId: string): Promise<boolean>;
  removeProductFromTag(productId: string, tagId: string): Promise<boolean>;
  getProductTags(productId: string): Promise<Tag[]>;
  getTagProducts(tagId: string, storeId: string): Promise<any[]>;
}

export interface CreateTagData {
  store_id: string;
  name: string;
}

export interface UpdateTagData {
  name?: string;
}
