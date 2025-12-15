import { TagRepository } from "../../domain/tagRepositoryInterface";
import { Tag } from "../../domain/tagInterface";

export class GetProductTagsUseCase {
  constructor(private readonly tagRepository: TagRepository) {}

  async execute(productId: string): Promise<Tag[]> {
    return this.tagRepository.getProductTags(productId);
  }
}
