import { TagRepository, CreateTagData } from "../../domain/tagRepositoryInterface";
import { Tag } from "../../domain/tagInterface";

export class CreateTagUseCase {
  constructor(private readonly tagRepository: TagRepository) {}

  async execute(data: CreateTagData): Promise<Tag> {
    return this.tagRepository.createTag(data);
  }
}
