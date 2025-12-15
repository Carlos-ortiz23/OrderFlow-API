import { CategoryRepository } from "../../domain/categoryRepositoryInterface";

export class AddProductToCategoryUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(productId: string, categoryId: string): Promise<boolean> {
    return this.categoryRepository.addProductToCategory(productId, categoryId);
  }
}
