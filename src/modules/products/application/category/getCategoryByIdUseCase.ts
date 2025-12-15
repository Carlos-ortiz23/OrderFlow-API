import { CategoryRepository } from "../../domain/categoryRepositoryInterface";
import { Category } from "../../domain/categoryInterface";

export class GetCategoryByIdUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(id: string, storeId: string): Promise<Category | null> {
    return this.categoryRepository.getCategoryById(id, storeId);
  }
}
