import { CategoryRepository } from "../../domain/categoryRepositoryInterface";

export class RemoveProductFromCategoryUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(productId: string, categoryId: string): Promise<boolean> {
    return this.categoryRepository.removeProductFromCategory(productId, categoryId);
  }
}
