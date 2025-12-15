import { TagRepository } from "../../domain/tagRepositoryInterface";

export class AddProductToTagUseCase {
  constructor(private readonly tagRepository: TagRepository) {}

  async execute(productId: string, tagId: string): Promise<boolean> {
    return this.tagRepository.addProductToTag(productId, tagId);
  }
}
