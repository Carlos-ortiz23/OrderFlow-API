import { Request, Response } from "express";
import { OrderRepository } from "../domain/orderRepositoryInterface";
import { UpdateOrderStatusUseCase } from "../application/updateOrderStatusUseCase";
import { logger } from "../../../utils/logger";

export class OrderController {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase
  ) {}

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

  updateOrderStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: "The 'status' field is required",
        });
      }

      const updated = await this.updateOrderStatusUseCase.execute(id, status);

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: "Could not update order",
        });
      }

      res.json({
        success: true,
        message: "Status updated successfully",
      });
    } catch (error: any) {
      logger.error("Error in updateOrderStatus", { error });
      res.status(400).json({
        success: false,
        error: error.message || "Error updating status",
      });
    }
  };

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
