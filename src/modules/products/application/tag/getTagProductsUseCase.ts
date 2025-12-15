import { TagRepository } from "../../domain/tagRepositoryInterface";

export class GetTagProductsUseCase {
  constructor(private readonly tagRepository: TagRepository) {}

  async execute(tagId: string, storeId: string): Promise<any[]> {
    return this.tagRepository.getTagProducts(tagId, storeId);
  }
}
