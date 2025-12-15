// Data model for a Purchase Order

// Define the detail of each item in the order
export interface OrderItemDetail {
  productId: string;
  productName: string; // Save the name (Snapshot) in case it changes in the future
  quantity: number;
  unitPrice: number; // Price at the time of purchase
}

export class Order {
  // Optional fields that can be set after construction
  public shipping_address?: string;
  public payment_method_id?: number;
  public ai_summary?: string | null;
  
  constructor(
    public storeId: string,
    public userId: string,
    public items: OrderItemDetail[],
    public total: number,
    public status:
      | "pending"
      | "confirmed"
      | "shipped"
      | "cancelled" = "pending",
    public id?: string
  ) { }
}
