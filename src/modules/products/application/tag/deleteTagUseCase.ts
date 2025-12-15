import { TagRepository } from "../../domain/tagRepositoryInterface";

export class DeleteTagUseCase {
  constructor(private readonly tagRepository: TagRepository) {}

  async execute(id: string, storeId: string): Promise<boolean> {
    return this.tagRepository.deleteTag(id, storeId);
  }
}
