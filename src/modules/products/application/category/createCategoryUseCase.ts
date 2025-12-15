import { CategoryRepository, CreateCategoryData } from "../../domain/categoryRepositoryInterface";
import { Category } from "../../domain/categoryInterface";

export class CreateCategoryUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(data: CreateCategoryData): Promise<Category> {
    return this.categoryRepository.createCategory(data);
  }
}
