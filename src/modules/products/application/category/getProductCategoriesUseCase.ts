import { CategoryRepository } from "../../domain/categoryRepositoryInterface";
import { Category } from "../../domain/categoryInterface";

export class GetProductCategoriesUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(productId: string): Promise<Category[]> {
    return this.categoryRepository.getProductCategories(productId);
  }
}
