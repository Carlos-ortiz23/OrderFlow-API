import { Request, Response } from "express";
import { AuthRequest } from "../../../middlewares/authMiddleware";
import { CreateCategoryUseCase } from "../application/category/createCategoryUseCase";
import { GetCategoryByIdUseCase } from "../application/category/getCategoryByIdUseCase";
import { GetAllCategoriesUseCase } from "../application/category/getAllCategoriesUseCase";
import { UpdateCategoryUseCase } from "../application/category/updateCategoryUseCase";
import { DeleteCategoryUseCase } from "../application/category/deleteCategoryUseCase";
import { AddProductToCategoryUseCase } from "../application/category/addProductToCategoryUseCase";
import { RemoveProductFromCategoryUseCase } from "../application/category/removeProductFromCategoryUseCase";
import { GetProductCategoriesUseCase } from "../application/category/getProductCategoriesUseCase";
import { GetCategoryProductsUseCase } from "../application/category/getCategoryProductsUseCase";
import { logger } from "../../../utils/logger";

export class CategoryController {
  constructor(
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly getCategoryByIdUseCase: GetCategoryByIdUseCase,
    private readonly getAllCategoriesUseCase: GetAllCategoriesUseCase,
    private readonly updateCategoryUseCase: UpdateCategoryUseCase,
    private readonly deleteCategoryUseCase: DeleteCategoryUseCase,
    private readonly addProductToCategoryUseCase: AddProductToCategoryUseCase,
    private readonly removeProductFromCategoryUseCase: RemoveProductFromCategoryUseCase,
    private readonly getProductCategoriesUseCase: GetProductCategoriesUseCase,
    private readonly getCategoryProductsUseCase: GetCategoryProductsUseCase
  ) {}

  /**
   * @swagger
   * /api/categories:
   *   post:
   *     summary: Create a new category
   *     description: Create a new product category
   *     tags: [Categories]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - storeId
   *             properties:
   *               name:
   *                 type: string
   *                 example: "Beverages"
   *               description:
   *                 type: string
   *                 example: "Drinks and liquid refreshments"
   *               storeId:
   *                 type: string
   *                 format: uuid
   *                 description: Store ID to associate the category with
   *     responses:
   *       201:
   *         description: Category created successfully
   *       400:
   *         description: Invalid request data
   *       401:
   *         description: Not authenticated
   */
  createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated" });
        return;
      }

      const { name, description, storeId } = req.body;

      if (!name || !storeId) {
        res.status(400).json({
          success: false,
          message: "Name and storeId are required"
        });
        return;
      }

      const category = await this.createCategoryUseCase.execute({
        store_id: storeId,
        name,
        description
      });

      res.status(201).json({
        success: true,
        message: "Category created successfully",
        data: category
      });
    } catch (error) {
      logger.error("Error creating category", { error });
      res.status(500).json({
        success: false,
        message: "Error creating category"
      });
    }
  };

  /**
   * @swagger
   * /api/categories/{id}:
   *   get:
   *     summary: Get category by ID
   *     description: Retrieve a specific category by its ID
   *     tags: [Categories]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Category ID
   *       - in: query
   *         name: storeId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Store ID for multi-tenancy check
   *     responses:
   *       200:
   *         description: Category found
   *       404:
   *         description: Category not found
   */
  getCategoryById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { storeId } = req.query;

      if (!storeId || typeof storeId !== "string") {
        res.status(400).json({
          success: false,
          message: "storeId is required"
        });
        return;
      }

      const category = await this.getCategoryByIdUseCase.execute(id, storeId);

      if (!category) {
        res.status(404).json({
          success: false,
          message: "Category not found"
        });
        return;
      }

      res.json({
        success: true,
        data: category
      });
    } catch (error) {
      logger.error("Error getting category by ID", { error, id: req.params.id });
      res.status(500).json({
        success: false,
        message: "Error getting category"
      });
    }
  };

  /**
   * @swagger
   * /api/categories:
   *   get:
   *     summary: Get all categories
   *     description: Retrieve all categories for a store
   *     tags: [Categories]
   *     parameters:
   *       - in: query
   *         name: storeId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Store ID to filter categories
   *     responses:
   *       200:
   *         description: Categories retrieved successfully
   */
  getAllCategories = async (req: Request, res: Response): Promise<void> => {
    try {
      const { storeId } = req.query;

      if (!storeId || typeof storeId !== "string") {
        res.status(400).json({
          success: false,
          message: "storeId is required"
        });
        return;
      }

      const categories = await this.getAllCategoriesUseCase.execute(storeId);

      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      logger.error("Error getting all categories", { error });
      res.status(500).json({
        success: false,
        message: "Error getting categories"
      });
    }
  };

  /**
   * @swagger
   * /api/categories/{id}:
   *   put:
   *     summary: Update category
   *     description: Update a category's information
   *     tags: [Categories]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Category ID
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
   *               is_active:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Category updated successfully
   *       404:
   *         description: Category not found
   */
  updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated" });
        return;
      }

      const { id } = req.params;
      const { name, description, is_active } = req.body;

      const category = await this.updateCategoryUseCase.execute(id, {
        name,
        description,
        is_active
      });

      if (!category) {
        res.status(404).json({
          success: false,
          message: "Category not found"
        });
        return;
      }

      res.json({
        success: true,
        message: "Category updated successfully",
        data: category
      });
    } catch (error) {
      logger.error("Error updating category", { error, id: req.params.id });
      res.status(500).json({
        success: false,
        message: "Error updating category"
      });
    }
  };

  /**
   * @swagger
   * /api/categories/{id}:
   *   delete:
   *     summary: Delete category
   *     description: Delete a category
   *     tags: [Categories]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Category ID
   *       - in: query
   *         name: storeId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Store ID for multi-tenancy check
   *     responses:
   *       200:
   *         description: Category deleted successfully
   *       404:
   *         description: Category not found
   */
  deleteCategory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated" });
        return;
      }

      const { id } = req.params;
      const { storeId } = req.query;

      if (!storeId || typeof storeId !== "string") {
        res.status(400).json({
          success: false,
          message: "storeId is required"
        });
        return;
      }

      const deleted = await this.deleteCategoryUseCase.execute(id, storeId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: "Category not found"
        });
        return;
      }

      res.json({
        success: true,
        message: "Category deleted successfully"
      });
    } catch (error) {
      logger.error("Error deleting category", { error, id: req.params.id });
      res.status(500).json({
        success: false,
        message: "Error deleting category"
      });
    }
  };

  /**
   * @swagger
   * /api/categories/{categoryId}/products:
   *   get:
   *     summary: Get products in category
   *     description: Retrieve all products in a specific category
   *     tags: [Categories]
   *     parameters:
   *       - in: path
   *         name: categoryId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Category ID
   *       - in: query
   *         name: storeId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Store ID for multi-tenancy check
   *     responses:
   *       200:
   *         description: Products retrieved successfully
   */
  getCategoryProducts = async (req: Request, res: Response): Promise<void> => {
    try {
      const { categoryId } = req.params;
      const { storeId } = req.query;

      if (!storeId || typeof storeId !== "string") {
        res.status(400).json({
          success: false,
          message: "storeId is required"
        });
        return;
      }

      const products = await this.getCategoryProductsUseCase.execute(categoryId, storeId);

      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      logger.error("Error getting category products", { error, categoryId: req.params.categoryId });
      res.status(500).json({
        success: false,
        message: "Error getting category products"
      });
    }
  };

  /**
   * @swagger
   * /api/categories/{categoryId}/products/{productId}:
   *   post:
   *     summary: Add product to category
   *     description: Add a product to a category
   *     tags: [Categories]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: categoryId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Category ID
   *       - in: path
   *         name: productId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Product ID
   *     responses:
   *       200:
   *         description: Product added to category successfully
   */
  addProductToCategory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated" });
        return;
      }

      const { categoryId, productId } = req.params;

      const added = await this.addProductToCategoryUseCase.execute(productId, categoryId);

      res.json({
        success: true,
        message: "Product added to category successfully"
      });
    } catch (error) {
      logger.error("Error adding product to category", { 
        error, 
        categoryId: req.params.categoryId,
        productId: req.params.productId 
      });
      res.status(500).json({
        success: false,
        message: "Error adding product to category"
      });
    }
  };

  /**
   * @swagger
   * /api/categories/{categoryId}/products/{productId}:
   *   delete:
   *     summary: Remove product from category
   *     description: Remove a product from a category
   *     tags: [Categories]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: categoryId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Category ID
   *       - in: path
   *         name: productId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Product ID
   *     responses:
   *       200:
   *         description: Product removed from category successfully
   */
  removeProductFromCategory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated" });
        return;
      }

      const { categoryId, productId } = req.params;

      const removed = await this.removeProductFromCategoryUseCase.execute(productId, categoryId);

      res.json({
        success: true,
        message: "Product removed from category successfully"
      });
    } catch (error) {
      logger.error("Error removing product from category", { 
        error, 
        categoryId: req.params.categoryId,
        productId: req.params.productId 
      });
      res.status(500).json({
        success: false,
        message: "Error removing product from category"
      });
    }
  };

  /**
   * @swagger
   * /api/products/{productId}/categories:
   *   get:
   *     summary: Get product categories
   *     description: Retrieve all categories for a specific product
   *     tags: [Categories]
   *     parameters:
   *       - in: path
   *         name: productId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Product ID
   *     responses:
   *       200:
   *         description: Categories retrieved successfully
   */
  getProductCategories = async (req: Request, res: Response): Promise<void> => {
    try {
      const { productId } = req.params;

      const categories = await this.getProductCategoriesUseCase.execute(productId);

      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      logger.error("Error getting product categories", { error, productId: req.params.productId });
      res.status(500).json({
        success: false,
        message: "Error getting product categories"
      });
    }
  };
}
