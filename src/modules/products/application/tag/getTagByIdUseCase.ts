import { TagRepository } from "../../domain/tagRepositoryInterface";
import { Tag } from "../../domain/tagInterface";

export class GetTagByIdUseCase {
  constructor(private readonly tagRepository: TagRepository) {}

  async execute(id: string, storeId: string): Promise<Tag | null> {
    return this.tagRepository.getTagById(id, storeId);
  }
}
