import { Request, Response } from "express";
import { AuthRequest } from "../../../middlewares/authMiddleware";
import { CreateTagUseCase } from "../application/tag/createTagUseCase";
import { GetTagByIdUseCase } from "../application/tag/getTagByIdUseCase";
import { GetAllTagsUseCase } from "../application/tag/getAllTagsUseCase";
import { UpdateTagUseCase } from "../application/tag/updateTagUseCase";
import { DeleteTagUseCase } from "../application/tag/deleteTagUseCase";
import { AddProductToTagUseCase } from "../application/tag/addProductToTagUseCase";
import { RemoveProductFromTagUseCase } from "../application/tag/removeProductFromTagUseCase";
import { GetProductTagsUseCase } from "../application/tag/getProductTagsUseCase";
import { GetTagProductsUseCase } from "../application/tag/getTagProductsUseCase";
import { logger } from "../../../utils/logger";

export class TagController {
  constructor(
    private readonly createTagUseCase: CreateTagUseCase,
    private readonly getTagByIdUseCase: GetTagByIdUseCase,
    private readonly getAllTagsUseCase: GetAllTagsUseCase,
    private readonly updateTagUseCase: UpdateTagUseCase,
    private readonly deleteTagUseCase: DeleteTagUseCase,
    private readonly addProductToTagUseCase: AddProductToTagUseCase,
    private readonly removeProductFromTagUseCase: RemoveProductFromTagUseCase,
    private readonly getProductTagsUseCase: GetProductTagsUseCase,
    private readonly getTagProductsUseCase: GetTagProductsUseCase
  ) {}

  /**
   * @swagger
   * /api/tags:
   *   post:
   *     summary: Create a new tag
   *     description: Create a new product tag
   *     tags: [Tags]
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
   *                 example: "Organic"
   *               storeId:
   *                 type: string
   *                 format: uuid
   *                 description: Store ID to associate the tag with
   *     responses:
   *       201:
   *         description: Tag created successfully
   *       400:
   *         description: Invalid request data
   *       401:
   *         description: Not authenticated
   */
  createTag = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated" });
        return;
      }

      const { name, storeId } = req.body;

      if (!name || !storeId) {
        res.status(400).json({
          success: false,
          message: "Name and storeId are required"
        });
        return;
      }

      const tag = await this.createTagUseCase.execute({
        store_id: storeId,
        name
      });

      res.status(201).json({
        success: true,
        message: "Tag created successfully",
        data: tag
      });
    } catch (error) {
      logger.error("Error creating tag", { error });
      res.status(500).json({
        success: false,
        message: "Error creating tag"
      });
    }
  };

  /**
   * @swagger
   * /api/tags/{id}:
   *   get:
   *     summary: Get tag by ID
   *     description: Retrieve a specific tag by its ID
   *     tags: [Tags]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Tag ID
   *       - in: query
   *         name: storeId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Store ID for multi-tenancy check
   *     responses:
   *       200:
   *         description: Tag found
   *       404:
   *         description: Tag not found
   */
  getTagById = async (req: Request, res: Response): Promise<void> => {
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

      const tag = await this.getTagByIdUseCase.execute(id, storeId);

      if (!tag) {
        res.status(404).json({
          success: false,
          message: "Tag not found"
        });
        return;
      }

      res.json({
        success: true,
        data: tag
      });
    } catch (error) {
      logger.error("Error getting tag by ID", { error, id: req.params.id });
      res.status(500).json({
        success: false,
        message: "Error getting tag"
      });
    }
  };

  /**
   * @swagger
   * /api/tags:
   *   get:
   *     summary: Get all tags
   *     description: Retrieve all tags for a store
   *     tags: [Tags]
   *     parameters:
   *       - in: query
   *         name: storeId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Store ID to filter tags
   *     responses:
   *       200:
   *         description: Tags retrieved successfully
   */
  getAllTags = async (req: Request, res: Response): Promise<void> => {
    try {
      const { storeId } = req.query;

      if (!storeId || typeof storeId !== "string") {
        res.status(400).json({
          success: false,
          message: "storeId is required"
        });
        return;
      }

      const tags = await this.getAllTagsUseCase.execute(storeId);

      res.json({
        success: true,
        data: tags
      });
    } catch (error) {
      logger.error("Error getting all tags", { error });
      res.status(500).json({
        success: false,
        message: "Error getting tags"
      });
    }
  };

  /**
   * @swagger
   * /api/tags/{id}:
   *   put:
   *     summary: Update tag
   *     description: Update a tag's name
   *     tags: [Tags]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Tag ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *     responses:
   *       200:
   *         description: Tag updated successfully
   *       404:
   *         description: Tag not found
   */
  updateTag = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated" });
        return;
      }

      const { id } = req.params;
      const { name } = req.body;

      if (!name) {
        res.status(400).json({
          success: false,
          message: "Name is required"
        });
        return;
      }

      const tag = await this.updateTagUseCase.execute(id, { name });

      if (!tag) {
        res.status(404).json({
          success: false,
          message: "Tag not found"
        });
        return;
      }

      res.json({
        success: true,
        message: "Tag updated successfully",
        data: tag
      });
    } catch (error) {
      logger.error("Error updating tag", { error, id: req.params.id });
      res.status(500).json({
        success: false,
        message: "Error updating tag"
      });
    }
  };

  /**
   * @swagger
   * /api/tags/{id}:
   *   delete:
   *     summary: Delete tag
   *     description: Delete a tag
   *     tags: [Tags]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Tag ID
   *       - in: query
   *         name: storeId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Store ID for multi-tenancy check
   *     responses:
   *       200:
   *         description: Tag deleted successfully
   *       404:
   *         description: Tag not found
   */
  deleteTag = async (req: AuthRequest, res: Response): Promise<void> => {
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

      const deleted = await this.deleteTagUseCase.execute(id, storeId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: "Tag not found"
        });
        return;
      }

      res.json({
        success: true,
        message: "Tag deleted successfully"
      });
    } catch (error) {
      logger.error("Error deleting tag", { error, id: req.params.id });
      res.status(500).json({
        success: false,
        message: "Error deleting tag"
      });
    }
  };

  /**
   * @swagger
   * /api/tags/{tagId}/products:
   *   get:
   *     summary: Get products with tag
   *     description: Retrieve all products with a specific tag
   *     tags: [Tags]
   *     parameters:
   *       - in: path
   *         name: tagId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Tag ID
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
  getTagProducts = async (req: Request, res: Response): Promise<void> => {
    try {
      const { tagId } = req.params;
      const { storeId } = req.query;

      if (!storeId || typeof storeId !== "string") {
        res.status(400).json({
          success: false,
          message: "storeId is required"
        });
        return;
      }

      const products = await this.getTagProductsUseCase.execute(tagId, storeId);

      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      logger.error("Error getting tag products", { error, tagId: req.params.tagId });
      res.status(500).json({
        success: false,
        message: "Error getting tag products"
      });
    }
  };

  /**
   * @swagger
   * /api/tags/{tagId}/products/{productId}:
   *   post:
   *     summary: Add product to tag
   *     description: Add a product to a tag
   *     tags: [Tags]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: tagId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Tag ID
   *       - in: path
   *         name: productId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Product ID
   *     responses:
   *       200:
   *         description: Product added to tag successfully
   */
  addProductToTag = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated" });
        return;
      }

      const { tagId, productId } = req.params;

      const added = await this.addProductToTagUseCase.execute(productId, tagId);

      res.json({
        success: true,
        message: "Product added to tag successfully"
      });
    } catch (error) {
      logger.error("Error adding product to tag", { 
        error, 
        tagId: req.params.tagId,
        productId: req.params.productId 
      });
      res.status(500).json({
        success: false,
        message: "Error adding product to tag"
      });
    }
  };

  /**
   * @swagger
   * /api/tags/{tagId}/products/{productId}:
   *   delete:
   *     summary: Remove product from tag
   *     description: Remove a product from a tag
   *     tags: [Tags]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: tagId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Tag ID
   *       - in: path
   *         name: productId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Product ID
   *     responses:
   *       200:
   *         description: Product removed from tag successfully
   */
  removeProductFromTag = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated" });
        return;
      }

      const { tagId, productId } = req.params;

      const removed = await this.removeProductFromTagUseCase.execute(productId, tagId);

      res.json({
        success: true,
        message: "Product removed from tag successfully"
      });
    } catch (error) {
      logger.error("Error removing product from tag", { 
        error, 
        tagId: req.params.tagId,
        productId: req.params.productId 
      });
      res.status(500).json({
        success: false,
        message: "Error removing product from tag"
      });
    }
  };

  /**
   * @swagger
   * /api/products/{productId}/tags:
   *   get:
   *     summary: Get product tags
   *     description: Retrieve all tags for a specific product
   *     tags: [Tags]
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
   *         description: Tags retrieved successfully
   */
  getProductTags = async (req: Request, res: Response): Promise<void> => {
    try {
      const { productId } = req.params;

      const tags = await this.getProductTagsUseCase.execute(productId);

      res.json({
        success: true,
        data: tags
      });
    } catch (error) {
      logger.error("Error getting product tags", { error, productId: req.params.productId });
      res.status(500).json({
        success: false,
        message: "Error getting product tags"
      });
    }
  };
}
