import { TagRepository, UpdateTagData } from "../../domain/tagRepositoryInterface";
import { Tag } from "../../domain/tagInterface";

export class UpdateTagUseCase {
  constructor(private readonly tagRepository: TagRepository) {}

  async execute(id: string, data: UpdateTagData): Promise<Tag | null> {
    return this.tagRepository.updateTag(id, data);
  }
}
