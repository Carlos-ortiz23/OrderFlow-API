import { Request, Response } from "express";
import { StoreRepository } from "../domain/storeRepositoryInterface";
import { logger } from "../../../utils/logger";

export class StoreController {
    constructor(private readonly storeRepo: StoreRepository) { }

    /**
     * @swagger
     * /api/stores/{id}:
     *   get:
     *     summary: Get store by ID
     *     description: Retrieve detailed information about a specific store
     *     tags: [Stores]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: Store ID
     *     responses:
     *       200:
     *         description: Store found
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   $ref: '#/components/schemas/Store'
     *       404:
     *         $ref: '#/components/responses/NotFound'
     *       500:
     *         $ref: '#/components/responses/InternalServerError'
     */
    getStore = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const store = await this.storeRepo.getStoreById(id);

            if (!store) {
                return res.status(404).json({ success: false, error: "Store not found" });
            }

            return res.status(200).json({ success: true, data: store });
        } catch (error) {
            logger.error("Error in getStore controller", { error });
            return res.status(500).json({ success: false, error: "Internal Server Error" });
        }
    };
}
