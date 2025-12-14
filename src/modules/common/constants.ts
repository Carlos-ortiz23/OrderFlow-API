/**
 * Constants for Database Lookup Tables.
 * These should match the 'code' column in the respective tables.
 */

// Table: order_statuses
export enum OrderStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    PAID = "paid",
    SHIPPED = "shipped",
    CANCELLED = "cancelled",
    COMPLETED = "completed",
}

// Table: payment_methods
export enum PaymentMethod {
    CASH = "cash",
    TRANSFER = "transfer",
    NEQUI = "nequi",
    DAVIPLATA = "daviplata",
    CARD = "card",
}

// Table: chat_roles
export enum ChatRole {
    SYSTEM = "system",
    USER = "user",
    ASSISTANT = "assistant",
}
