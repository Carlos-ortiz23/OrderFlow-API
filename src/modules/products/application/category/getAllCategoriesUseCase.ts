import { CategoryRepository } from "../../domain/categoryRepositoryInterface";
import { Category } from "../../domain/categoryInterface";

export class GetAllCategoriesUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(storeId: string): Promise<Category[]> {
    return this.categoryRepository.getAllCategories(storeId);
  }
}
