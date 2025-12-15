import { TagRepository } from "../../domain/tagRepositoryInterface";

export class RemoveProductFromTagUseCase {
  constructor(private readonly tagRepository: TagRepository) {}

  async execute(productId: string, tagId: string): Promise<boolean> {
    return this.tagRepository.removeProductFromTag(productId, tagId);
  }
}
