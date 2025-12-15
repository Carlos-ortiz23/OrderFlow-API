import { CategoryRepository } from "../../domain/categoryRepositoryInterface";

export class DeleteCategoryUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(id: string, storeId: string): Promise<boolean> {
    return this.categoryRepository.deleteCategory(id, storeId);
  }
}
