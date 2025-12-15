import { Request, Response } from "express";
import { SearchProductsUseCase } from "../application/searchProductsUseCase";
import { GetProductByIdUseCase } from "../application/getProductByIdUseCase";
import { CreateProductUseCase } from "../application/createProductUseCase";
import { UpdateProductUseCase } from "../application/updateProductUseCase";
import { DeleteProductUseCase } from "../application/deleteProductUseCase";
import { GetAllProductsUseCase } from "../application/getAllProductsUseCase";
import { logger } from "../../../utils/logger";

export class ProductController {
  constructor(
    private readonly searchProductsUseCase: SearchProductsUseCase,
    private readonly getProductByIdUseCase: GetProductByIdUseCase,
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
    private readonly getAllProductsUseCase: GetAllProductsUseCase
  ) { }

  /**
   * @swagger
   * /api/products:
   *   get:
   *     summary: Get all products
   *     description: Retrieve all products from inventory with pagination support
   *     tags: [Products]
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *         description: Maximum number of products to return
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Number of products to skip
   *       - in: query
   *         name: storeId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Store ID to filter products
   *     responses:
   *       200:
   *         description: Products retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Product'
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     limit:
   *                       type: integer
   *                     offset:
   *                       type: integer
   *                     total:
   *                       type: integer
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  getAllProducts = async (req: Request, res: Response) => {
    try {
      const { limit = 50, offset = 0, storeId } = req.query;

      if (!storeId || typeof storeId !== "string") {
        return res.status(400).json({
          success: false,
          error: "storeId is required",
        });
      }

      const products = await this.getAllProductsUseCase.execute(
        Number(limit),
        Number(offset),
        storeId
      );

      res.json({
        success: true,
        data: products,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: products.length,
        },
      });
    } catch (error) {
      logger.error("Error in getAllProducts controller", { error });
      res.status(500).json({
        success: false,
        error: "Error retrieving products",
      });
    }
  };

  /**
   * @swagger
   * /api/products/store/{storeId}:
   *   get:
   *     summary: Get products by store
   *     description: Retrieve all products for a specific store with pagination
   *     tags: [Products]
   *     parameters:
   *       - in: path
   *         name: storeId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Store ID to filter products
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *         description: Maximum number of products to return
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Number of products to skip
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: Products retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Product'
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     limit:
   *                       type: integer
   *                     offset:
   *                       type: integer
   *                     total:
   *                       type: integer
   *       400:
   *         description: Bad request - Missing storeId
   *       401:
   *         description: Unauthorized - Not authenticated
   *       403:
   *         description: Forbidden - Not authorized to access this store
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  getProductsByStore = async (req: Request, res: Response) => {
    try {
      const { storeId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      if (!storeId) {
        return res.status(400).json({
          success: false,
          error: "storeId is required",
        });
      }

      const products = await this.getAllProductsUseCase.execute(
        Number(limit),
        Number(offset),
        storeId
      );

      res.json({
        success: true,
        data: products,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: products.length,
        },
      });
    } catch (error) {
      logger.error("Error in getProductsByStore controller", { error, storeId: req.params.storeId });
      res.status(500).json({
        success: false,
        error: "Error retrieving products",
      });
    }
  };

  /**
   * @swagger
   * /api/products/search:
   *   get:
   *     summary: Search products
   *     description: Search for products by name or description
   *     tags: [Products]
   *     parameters:
   *       - in: query
   *         name: q
   *         required: true
   *         schema:
   *           type: string
   *         description: Search query
   *         example: coffee
   *       - in: query
   *         name: storeId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Store ID to search within
   *     responses:
   *       200:
   *         description: Products found successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Product'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  searchProducts = async (req: Request, res: Response) => {
    try {
      const { q, storeId } = req.query;

      if (!storeId || typeof storeId !== "string") {
        return res.status(400).json({
          success: false,
          error: "storeId is required",
        });
      }

      if (!q || typeof q !== "string") {
        return res.status(400).json({
          success: false,
          error: "The 'q' parameter is required",
        });
      }

      const products = await this.searchProductsUseCase.execute(q, storeId);

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

  /**
   * @swagger
   * /api/products/{id}:
   *   get:
   *     summary: Get product by ID
   *     description: Retrieve detailed information about a specific product
   *     tags: [Products]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Product ID
   *       - in: query
   *         name: storeId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Store ID required for multi-tenancy check
   *     responses:
   *       200:
   *         description: Product found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Product'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  getProductById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { storeId } = req.query;

      if (!storeId || typeof storeId !== "string") {
        return res.status(400).json({
          success: false,
          error: "storeId is required",
        });
      }

      const product = await this.getProductByIdUseCase.execute(id, storeId);

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

  /**
   * @swagger
   * /api/products:
   *   post:
   *     summary: Create new product
   *     description: Add a new product to the inventory (Admin only)
   *     tags: [Products]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - price
   *               - stock
   *               - unit
   *               - storeId
   *             properties:
   *               storeId:
   *                 type: string
   *                 format: uuid
   *                 description: Store ID to associate the product with
   *                 example: "123e4567-e89b-12d3-a456-426614174000"
   *               name:
   *                 type: string
   *                 example: "Premium Coffee Beans"
   *               description:
   *                 type: string
   *                 example: "High-quality arabica coffee beans"
   *               price:
   *                 type: number
   *                 format: float
   *                 example: 15.99
   *               stock:
   *                 type: integer
   *                 example: 100
   *               unit:
   *                 type: string
   *                 example: "kg"
   *               category:
   *                 type: string
   *                 example: "Beverages"
   *     responses:
   *       201:
   *         description: Product created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Product'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  createProduct = async (req: Request, res: Response) => {
    try {
      const { name, description, price, stock, unit, category, storeId } = req.body;

      // Validate required fields
      if (!name || price === undefined || stock === undefined || !storeId) {
        return res.status(400).json({
          success: false,
          error: "Name, price, stock, and storeId are required fields",
        });
      }

      // Validate data types
      if (typeof price !== "number" || price < 0) {
        return res.status(400).json({
          success: false,
          error: "Price must be a positive number",
        });
      }

      if (!Number.isInteger(stock) || stock < 0) {
        return res.status(400).json({
          success: false,
          error: "Stock must be a positive integer",
        });
      }

      const product = await this.createProductUseCase.execute({
        name,
        description: description || "",
        price,
        stock_quantity: stock, // Map stock to stock_quantity
        store_id: storeId, // Map storeId to store_id
        is_active: true, // Default to true
      });

      logger.info("Product created successfully", { productId: product.id, name });

      res.status(201).json({
        success: true,
        data: product,
      });
    } catch (error) {
      logger.error("Error in createProduct controller", { error });
      res.status(500).json({
        success: false,
        error: "Error creating product",
      });
    }
  };

  /**
   * @swagger
   * /api/products/{id}:
   *   put:
   *     summary: Update product
   *     description: Update product information (Admin only)
   *     tags: [Products]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Product ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               price:
   *                 type: number
   *                 format: float
   *               stock:
   *                 type: integer
   *               category:
   *                 type: string
   *     responses:
   *       200:
   *         description: Product updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  updateProduct = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Validate price if provided
      if (updates.price !== undefined && (typeof updates.price !== "number" || updates.price < 0)) {
        return res.status(400).json({
          success: false,
          error: "Price must be a positive number",
        });
      }

      // Validate stock if provided
      if (updates.stock !== undefined && (!Number.isInteger(updates.stock) || updates.stock < 0)) {
        return res.status(400).json({
          success: false,
          error: "Stock must be a positive integer",
        });
      }

      const updated = await this.updateProductUseCase.execute(id, {
        ...updates,
        stock_quantity: updates.stock, // Map stock to stock_quantity
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: "Product not found",
        });
      }

      logger.info("Product updated successfully", { productId: id });

      res.json({
        success: true,
        message: "Product updated successfully",
      });
    } catch (error) {
      logger.error("Error in updateProduct controller", { error });
      res.status(500).json({
        success: false,
        error: "Error updating product",
      });
    }
  };

  /**
   * @swagger
   * /api/products/{id}:
   *   delete:
   *     summary: Delete product
   *     description: Remove a product from inventory (Admin only)
   *     tags: [Products]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Product ID
   *       - in: query
   *         name: storeId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Store ID required for deletion
   *     responses:
   *       200:
   *         description: Product deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  deleteProduct = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { storeId } = req.query;

      if (!storeId || typeof storeId !== "string") {
        return res.status(400).json({
          success: false,
          error: "storeId is required",
        });
      }

      const deleted = await this.deleteProductUseCase.execute(id, storeId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: "Product not found",
        });
      }

      logger.info("Product deleted successfully", { productId: id });

      res.json({
        success: true,
        message: "Product deleted successfully",
      });
    } catch (error) {
      logger.error("Error in deleteProduct controller", { error });
      res.status(500).json({
        success: false,
        error: "Error deleting product",
      });
    }
  };
}
