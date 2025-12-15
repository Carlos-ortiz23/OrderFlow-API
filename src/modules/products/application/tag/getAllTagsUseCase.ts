import { TagRepository } from "../../domain/tagRepositoryInterface";
import { Tag } from "../../domain/tagInterface";

export class GetAllTagsUseCase {
  constructor(private readonly tagRepository: TagRepository) {}

  async execute(storeId: string): Promise<Tag[]> {
    return this.tagRepository.getAllTags(storeId);
  }
}
