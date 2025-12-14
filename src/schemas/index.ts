import { z } from 'zod';

// --------------------------------------------------------
// LOOKUP TABLES
// --------------------------------------------------------

export const OrderStatusSchema = z.object({
    id: z.number().int(),
    code: z.string(),
    label: z.string(),
    description: z.string().nullable().optional(),
});

export const PaymentMethodSchema = z.object({
    id: z.number().int(),
    code: z.string(),
    label: z.string(),
    is_active: z.boolean().default(true),
});

export const ChatRoleSchema = z.object({
    id: z.number().int(),
    code: z.enum(['system', 'user', 'assistant']),
});

// --------------------------------------------------------
// CORE TABLES
// --------------------------------------------------------

export const StoreSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    telegram_bot_token: z.string().nullable().optional(),
    system_prompt: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    is_active: z.boolean().default(true),
    created_at: z.string().datetime().optional(),
});

export const UserSchema = z.object({
    id: z.string().uuid(),
    store_id: z.string().uuid(),
    email: z.string().email(),
    password_hash: z.string(),
    full_name: z.string().nullable().optional(),
    role: z.string().default('admin'),
    created_at: z.string().datetime().optional(),
});

export const ProductSchema = z.object({
    id: z.string().uuid(),
    store_id: z.string().uuid(),
    sku: z.string().nullable().optional(),
    name: z.string(),
    description: z.string().nullable().optional(),
    price: z.number().min(0),
    stock_quantity: z.number().int().min(0).default(0),
    image_url: z.string().nullable().optional(),
    is_active: z.boolean().default(true),
    created_at: z.string().datetime().optional(),
    updated_at: z.string().datetime().optional(),
});

export const ClientSchema = z.object({
    id: z.string().uuid(),
    store_id: z.string().uuid(),
    telegram_id: z.number().int(), // BigInt in DB, but usually handled as number/string in JS. Using number for now, watch out for large IDs.
    username: z.string().nullable().optional(),
    first_name: z.string().nullable().optional(),
    last_name: z.string().nullable().optional(),
    phone_number: z.string().nullable().optional(),
    created_at: z.string().datetime().optional(),
});

// --------------------------------------------------------
// TRANSACTIONAL TABLES
// --------------------------------------------------------

export const OrderSchema = z.object({
    id: z.string().uuid(),
    store_id: z.string().uuid(),
    client_id: z.string().uuid(),
    status_id: z.number().int().default(1),
    payment_method_id: z.number().int().nullable().optional(),
    total_amount: z.number().default(0),
    shipping_address: z.string().nullable().optional(),
    ai_summary: z.string().nullable().optional(),
    created_at: z.string().datetime().optional(),
    updated_at: z.string().datetime().optional(),
});

export const OrderItemSchema = z.object({
    id: z.string().uuid(),
    order_id: z.string().uuid(),
    product_id: z.string().uuid().nullable().optional(),
    product_name_snapshot: z.string().nullable().optional(),
    quantity: z.number().int().positive(),
    unit_price: z.number().min(0),
    subtotal: z.number().optional(), // Generated column
});

// --------------------------------------------------------
// AI TABLES
// --------------------------------------------------------

export const MessageSchema = z.object({
    id: z.string().uuid(),
    client_id: z.string().uuid(),
    role_id: z.number().int(),
    content: z.string(),
    created_at: z.string().datetime().optional(),
});

// --------------------------------------------------------
// TYPES
// --------------------------------------------------------

export type OrderStatus = z.infer<typeof OrderStatusSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type ChatRole = z.infer<typeof ChatRoleSchema>;
export type Store = z.infer<typeof StoreSchema>;
export type User = z.infer<typeof UserSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type Client = z.infer<typeof ClientSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type Message = z.infer<typeof MessageSchema>;
