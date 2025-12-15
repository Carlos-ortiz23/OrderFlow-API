import { CategoryRepository } from "../../domain/categoryRepositoryInterface";

export class GetCategoryProductsUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(categoryId: string, storeId: string): Promise<any[]> {
    return this.categoryRepository.getCategoryProducts(categoryId, storeId);
  }
}
