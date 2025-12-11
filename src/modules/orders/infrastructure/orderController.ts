import { Request, Response } from "express";
import { OrderRepository } from "../domain/orderRepositoryInterface";
import { UpdateOrderStatusUseCase } from "../application/updateOrderStatusUseCase";
import { NotifyCustomerUseCase } from "../application/notifyCustomerUseCase";
import { logger } from "../../../utils/logger";

export class OrderController {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
    private readonly notifyCustomerUseCase: NotifyCustomerUseCase
  ) {}

  /**
   * @swagger
   * /api/orders:
   *   get:
   *     summary: Get all orders
   *     description: Retrieve orders with optional status filter and pagination
   *     tags: [Orders]
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, confirmed, preparing, in_transit, delivered, cancelled]
   *         description: Filter orders by status
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *         description: Maximum number of orders to return
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Number of orders to skip
   *     responses:
   *       200:
   *         description: Orders retrieved successfully
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
   *                     $ref: '#/components/schemas/Order'
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
  getOrders = async (req: Request, res: Response) => {
    try {
      const { status, limit = 50, offset = 0 } = req.query;

      let orders;
      if (status && typeof status === "string") {
        orders = await this.orderRepo.getOrdersByStatus(
          status,
          Number(limit),
          Number(offset)
        );
      } else {
        orders = await this.orderRepo.getAllOrders(Number(limit), Number(offset));
      }

      res.json({
        success: true,
        data: orders,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: orders.length,
        },
      });
    } catch (error) {
      logger.error("Error in getOrders", { error });
      res.status(500).json({
        success: false,
        error: "Error getting orders",
      });
    }
  };

  /**
   * @swagger
   * /api/orders/{id}:
   *   get:
   *     summary: Get order by ID
   *     description: Retrieve detailed information about a specific order
   *     tags: [Orders]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Order ID
   *     responses:
   *       200:
   *         description: Order found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Order'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  getOrderById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const order = await this.orderRepo.getOrderById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          error: "Order not found",
        });
      }

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      logger.error("Error in getOrderById", { error });
      res.status(500).json({
        success: false,
        error: "Error getting order",
      });
    }
  };

  /**
   * @swagger
   * /api/orders/{id}/status:
   *   patch:
   *     summary: Update order status
   *     description: Update the status of an order and automatically notify the customer
   *     tags: [Orders]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Order ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - status
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [pending, confirmed, preparing, in_transit, delivered, cancelled]
   *                 description: New order status
   *           examples:
   *             confirm:
   *               summary: Confirm order
   *               value:
   *                 status: confirmed
   *             preparing:
   *               summary: Mark as preparing
   *               value:
   *                 status: preparing
   *             in_transit:
   *               summary: Mark as in transit
   *               value:
   *                 status: in_transit
   *             delivered:
   *               summary: Mark as delivered
   *               value:
   *                 status: delivered
   *     responses:
   *       200:
   *         description: Status updated successfully and customer notified
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                   example: "Status updated successfully and customer notified"
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  updateOrderStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Validate status field
      if (!status) {
        return res.status(400).json({
          success: false,
          error: "The 'status' field is required",
        });
      }

      // Validate status value
      const validStatuses = ["pending", "confirmed", "preparing", "in_transit", "delivered", "cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
      }

      // Get order before updating to get customer ID
      const order = await this.orderRepo.getOrderById(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          error: "Order not found",
        });
      }

      // Update order status
      const updated = await this.updateOrderStatusUseCase.execute(id, status);

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: "Could not update order",
        });
      }

      // Notify customer about status change
      try {
        await this.notifyCustomerUseCase.execute(order.userId, id, status);
        logger.info("Customer notified about order status change", { 
          orderId: id, 
          status, 
          userId: order.userId 
        });
      } catch (notifyError) {
        // Log error but don't fail the request
        logger.error("Failed to notify customer", { 
          error: notifyError, 
          orderId: id, 
          userId: order.userId 
        });
      }

      res.json({
        success: true,
        message: "Status updated successfully and customer notified",
      });
    } catch (error: any) {
      logger.error("Error in updateOrderStatus", { error });
      res.status(400).json({
        success: false,
        error: error.message || "Error updating status",
      });
    }
  };

  /**
   * @swagger
   * /api/orders/stats:
   *   get:
   *     summary: Get order statistics
   *     description: Retrieve statistics about orders (total, by status, revenue, etc.)
   *     tags: [Orders]
   *     responses:
   *       200:
   *         description: Statistics retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     total_orders:
   *                       type: integer
   *                       example: 150
   *                     pending:
   *                       type: integer
   *                       example: 10
   *                     confirmed:
   *                       type: integer
   *                       example: 5
   *                     preparing:
   *                       type: integer
   *                       example: 8
   *                     in_transit:
   *                       type: integer
   *                       example: 12
   *                     delivered:
   *                       type: integer
   *                       example: 110
   *                     cancelled:
   *                       type: integer
   *                       example: 5
   *                     total_revenue:
   *                       type: number
   *                       format: float
   *                       example: 15420.50
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  getStats = async (req: Request, res: Response) => {
    try {
      const stats = await this.orderRepo.getOrderStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error("Error in getStats", { error });
      res.status(500).json({
        success: false,
        error: "Error getting statistics",
      });
    }
  };
}
