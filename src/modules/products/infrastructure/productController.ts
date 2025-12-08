import { Request, Response } from "express";
import { SearchProductsUseCase } from "../application/searchProductsUseCase";
import { GetProductByIdUseCase } from "../application/getProductByIdUseCase";
import { logger } from "../../../utils/logger";

export class ProductController {
  constructor(
    private readonly searchProductsUseCase: SearchProductsUseCase,
    private readonly getProductByIdUseCase: GetProductByIdUseCase
  ) {}

  searchProducts = async (req: Request, res: Response) => {
    try {
      const { q } = req.query;

      if (!q || typeof q !== "string") {
        return res.status(400).json({
          success: false,
          error: "The 'q' parameter is required",
        });
      }

      const products = await this.searchProductsUseCase.execute(q);

      res.json({
        success: true,
        data: products,
      });
    } catch (error) {
      logger.error("Error in searchProducts controller", { error });
      res.status(500).json({
        success: false,
        error: "Error searching products",
      });
    }
  };

  getProductById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const product = await this.getProductByIdUseCase.execute(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          error: "Product not found",
        });
      }

      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      logger.error("Error in getProductById controller", { error });
      res.status(500).json({
        success: false,
        error: "Error getting product",
      });
    }
  };
}
