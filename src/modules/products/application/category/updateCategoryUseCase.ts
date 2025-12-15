import { CategoryRepository, UpdateCategoryData } from "../../domain/categoryRepositoryInterface";
import { Category } from "../../domain/categoryInterface";

export class UpdateCategoryUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(id: string, data: UpdateCategoryData): Promise<Category | null> {
    return this.categoryRepository.updateCategory(id, data);
  }
}
