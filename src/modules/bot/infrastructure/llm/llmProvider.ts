import OpenAI from "openai";
import { envConfig } from "../../../../config/env.config";
import { supabase } from "../../../../config/supabase";
import { ProductRepository } from "../../../products/domain/productRepositoryInterface";
import { Order } from "../../../orders/domain/orderInterface";
import { ChatMessage } from "../../domain/chatHistoryRepositoryInterface";
import { logger } from "../../../../utils/logger";
import { CreateOrderUseCase } from "../../../orders/application/createOrderUseCase";

// Definition of Tools that the AI can use
const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "search_products",
      description:
        "Search for products in the inventory to see prices and stock. It returns the Product ID (UUID) which is REQUIRED for placing orders.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search term (e.g.: 'rice', 'milk')",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "check_client_address",
      description: "Check if the client has a saved shipping address in their profile",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_payment_methods",
      description: "Get available payment methods for the order",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "finalize_order",
      description:
        "Create the final order ONLY when the customer explicitly confirms they don't want anything else and has provided all required information.",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                product_id: {
                  type: "string",
                  description: "The 'uuid_id' returned by the 'search_products' tool. Do NOT invent IDs.",
                },
                product_name: {
                  type: "string",
                  description: "The EXACT name of the product from the search results.",
                },
                quantity: { type: "number" },
              },
              required: ["product_id", "product_name", "quantity"],
            },
          },
          shipping_address: {
            type: "string",
            description: "The shipping address where the order will be delivered. Must be provided by the customer.",
          },
          payment_method_id: {
            type: "number",
            description: "The ID of the payment method selected by the customer. Must be a valid ID from get_payment_methods.",
          },
          special_instructions: {
            type: "string",
            description: "Any special instructions or notes for the order (optional).",
          },
        },
        required: ["items", "shipping_address", "payment_method_id"],
      },
    },
  },
];

export class LLMProvider {
  private client: OpenAI;
  private readonly model: string;

  constructor(
    private productRepo: ProductRepository,
    private createOrderUseCase: CreateOrderUseCase
  ) {
    this.client = new OpenAI({ apiKey: envConfig.LLM_API_KEY, baseURL: envConfig.LLM_URL });
    this.model = envConfig.LLM_MODEL;
  }

  // Main method: Receives complete history to maintain context
  async runAgent(
    userId: string,
    userMessage: string,
    history: ChatMessage[],
    storeId: string
  ): Promise<string> {
    // Validate input
    if (!userMessage || userMessage.trim().length === 0) {
      return "Please send a valid message.";
    }

    // Detect if this is the first interaction or first of the day
    const isFirstInteraction = history.length === 0;
    const isFirstToday = this.isFirstInteractionToday(history);
    const customerName = this.extractCustomerName(history);

    // Fetch store system prompt
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("system_prompt")
      .eq("id", storeId)
      .single();

    if (storeError) {
      logger.error("Error fetching store system prompt", { error: storeError, storeId });
    }

    // Build personalized system prompt
    let systemPrompt = store?.system_prompt || `You are a professional virtual sales assistant for our store.`;

    // Append default guidelines if the system prompt is short or missing specific instructions
    // (Optional: You might want to append these ALWAYS or only if system_prompt is empty. 
    // For now, let's append the critical business rules to ensure safety even with custom prompts)
    systemPrompt += `
    
SECURITY AND PRIVACY PRINCIPLES:
- NEVER request sensitive personal information (credit card numbers, passwords, ID documents, social security numbers)
- NEVER share information about other customers or their orders
- Maintain strict confidentiality of all order details
- Only process information necessary for the purchase (product names, quantities, shipping address)
- If asked for sensitive data, politely decline and explain we don't collect such information

COMMUNICATION GUIDELINES:
1. Be professional, formal, and concise in all responses
2. Use clear, direct language without excessive emojis or informal expressions
3. Maintain a courteous and respectful tone at all times
4. Confirm each action before executing it
5. Keep responses brief and to the point

BUSINESS RULES:
1. NEVER invent or assume product availability. Always use 'search_products' to verify stock and pricing
2. If a product is not found, politely inform the customer it's currently unavailable
3. Before finalizing any order, you MUST collect ALL required information:
   a. First use 'check_client_address' to see if the client has a saved address
   b. If no address is found, ask the client for their shipping address
   c. Use 'get_payment_methods' to retrieve available payment methods
   d. Ask the client to select a payment method from the list
   e. Ask if they have any special instructions for the order (optional)
4. Confirm the complete order details including items, total, shipping address, and payment method
5. Only call 'finalize_order' when the customer explicitly confirms ("yes", "confirm", "proceed")
6. Always present prices clearly with currency symbol
7. IMPORTANT: When calling 'finalize_order', you MUST use the exact 'uuid_id' found in the 'search_products' result

CHECKOUT PROCESS:
1. When the customer is ready to checkout, first check if they have a saved address with 'check_client_address'
2. If they have a saved address, confirm if they want to use it or provide a new one
3. If no saved address, ask them to provide their shipping address
4. Get available payment methods with 'get_payment_methods' and ask them to select one by ID
5. Ask if they have any special instructions or notes for the order (optional)
6. Confirm all details before finalizing the order

RESPONSE FORMAT:
- Product information: "Product: [name] - Price: $[amount] - Available stock: [quantity] units"
- Order totals: "Order total: $[amount]"
- Address confirmation: "Shipping to: [address]"
- Payment method: "Payment method: [method name]"
- Confirmations: "Order confirmed. Order ID: [id]. Total: $[amount]. Thank you for your purchase."

CRITICAL RULE:
When calling 'finalize_order', you must include ALL required fields: items with correct uuid_ids, shipping_address, and payment_method_id.`;

    // Add personalized greeting for first interaction
    if (isFirstInteraction) {
      systemPrompt += `\n\nIMPORTANT: This is the customer's first interaction. Greet them with:
"Welcome to our store. I'm your virtual sales assistant. I'm here to help you find products and process your order securely and efficiently. How may I assist you today?"`;
    } else if (isFirstToday && customerName) {
      systemPrompt += `\n\nIMPORTANT: This is the first interaction of the day with returning customer ${customerName}. Greet them with:
"Good day, ${customerName}. Welcome back. How may I assist you today?"`;
    } else if (isFirstToday) {
      systemPrompt += `\n\nIMPORTANT: This is the first interaction of the day with this customer. Greet them professionally and ask how you can help.`;
    }

    // 1. Prepare the system context
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...history.map(msg => ({
        role: msg.role,
        content: msg.content
      })), // Insert previous memory
      { role: "user", content: userMessage },
    ];

    // 2. First call to the AI
    let runner = await this.client.chat.completions.create({
      model: this.model,
      messages: messages,
      tools: TOOLS,
      tool_choice: "auto",
    });

    let msg = runner.choices[0].message;

    // 3. Tool Execution Loop (Agent Loop)
    // While the AI wants to use tools, we execute them
    while (msg.tool_calls && msg.tool_calls.length > 0) {
      const toolCall = msg.tool_calls[0];
      messages.push(msg); // Save the AI's intention in the temporary history

      let toolResultContent = "";

      // Verify the tool call type and access the function correctly
      if ("function" in toolCall) {
        // --- CASE 1: AI WANTS TO SEARCH PRODUCTS ---
        if (toolCall.function.name === "search_products") {
          const args = JSON.parse(toolCall.function.arguments);
          logger.debug("Agent searching products", { query: args.query, userId });

          // Pass storeId to searchProducts
          const products = await this.productRepo.searchProducts(args.query, storeId);

          // Enhanced Context Injection: Format the output to force the AI to see the UUIDs
          const productsForAI = products.map(p => ({
            uuid_id: p.id, // Explicit label
            name: p.name,
            price: p.price,
            stock: p.stock_quantity,
            instruction: "USE ONLY THE uuid_id FOR ORDERING"
          }));

          // Give the AI the JSON of the real inventory
          toolResultContent = JSON.stringify(productsForAI);

        // --- CASE 2: AI WANTS TO CHECK CLIENT ADDRESS ---
        } else if (toolCall.function.name === "check_client_address") {
          logger.debug("Agent checking client address", { userId });

          try {
            // First check if client has a shipping_address in their profile
            const { data: client, error: clientError } = await supabase
              .from("clients")
              .select("shipping_address")
              .eq("id", userId)
              .single();

            if (clientError) {
              logger.error("Error fetching client address", { error: clientError, userId });
              toolResultContent = JSON.stringify({
                has_address: false,
                address: null,
                error: "Error fetching client data"
              });
            } else if (client?.shipping_address) {
              // Client has an address in their profile
              toolResultContent = JSON.stringify({
                has_address: true,
                address: client.shipping_address
              });
            } else {
              // Try to get address from previous orders
              const { data: latestOrder, error: orderError } = await supabase
                .from("orders")
                .select("shipping_address")
                .eq("client_id", userId)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

              if (orderError) {
                logger.error("Error fetching previous orders", { error: orderError, userId });
                toolResultContent = JSON.stringify({
                  has_address: false,
                  address: null,
                  error: "Error fetching order history"
                });
              } else if (latestOrder?.shipping_address) {
                // Found address in previous order
                toolResultContent = JSON.stringify({
                  has_address: true,
                  address: latestOrder.shipping_address,
                  source: "previous_order"
                });
              } else {
                // No address found
                toolResultContent = JSON.stringify({
                  has_address: false,
                  address: null
                });
              }
            }
          } catch (error) {
            logger.error("Unexpected error checking client address", { error, userId });
            toolResultContent = JSON.stringify({
              has_address: false,
              address: null,
              error: "Unexpected error checking address"
            });
          }

        // --- CASE 3: AI WANTS TO GET PAYMENT METHODS ---
        } else if (toolCall.function.name === "get_payment_methods") {
          logger.debug("Agent getting payment methods", { userId });

          try {
            // Get available payment methods from database
            const { data: paymentMethods, error: paymentError } = await supabase
              .from("payment_methods")
              .select("id, code, label")
              .eq("is_active", true);

            if (paymentError) {
              logger.error("Error fetching payment methods", { error: paymentError });
              toolResultContent = JSON.stringify({
                success: false,
                error: "Error fetching payment methods",
                payment_methods: []
              });
            } else {
              toolResultContent = JSON.stringify({
                success: true,
                payment_methods: paymentMethods
              });
            }
          } catch (error) {
            logger.error("Unexpected error getting payment methods", { error });
            toolResultContent = JSON.stringify({
              success: false,
              error: "Unexpected error getting payment methods",
              payment_methods: []
            });
          }

        // --- CASE 4: AI WANTS TO FINALIZE PURCHASE ---
        } else if (toolCall.function.name === "finalize_order") {
          const args = JSON.parse(toolCall.function.arguments);
          logger.info("Agent attempting to finalize order", {
            userId,
            itemCount: args.items.length,
            items: args.items
          });

          // Get required fields from args
          const { items, shipping_address, payment_method_id, special_instructions } = args;
          
          // Validate shipping address
          if (!shipping_address || shipping_address.trim() === '') {
            logger.error("Missing shipping address in order", { userId });
            toolResultContent = JSON.stringify({
              success: false,
              error: "Shipping address is required"
            });
            return "I need a shipping address to complete your order. Could you please provide your delivery address?";
          }
          
          // Validate payment method
          if (!payment_method_id) {
            logger.error("Missing payment method in order", { userId });
            toolResultContent = JSON.stringify({
              success: false,
              error: "Payment method is required"
            });
            return "I need a payment method to complete your order. Could you please select one of the available payment methods?";
          }
          
          // Verify payment method exists
          const { data: paymentMethod, error: paymentError } = await supabase
            .from("payment_methods")
            .select("id")
            .eq("id", payment_method_id)
            .single();
            
          if (paymentError || !paymentMethod) {
            logger.error("Invalid payment method", { payment_method_id, error: paymentError });
            toolResultContent = JSON.stringify({
              success: false,
              error: "Invalid payment method"
            });
            return "I'm sorry, but the payment method you selected is not valid. Please choose a valid payment method and try again.";
          }

          // Calculate real totals validating against DB (Security)
          let total = 0;
          let finalItems = [];

          for (const item of items) {
            let productId = item.product_id;

            // --- ID RESOLVER MIDDLEWARE ---
            // Check if it's a valid UUID
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(productId)) {
              logger.warn("AI sent invalid UUID, attempting name resolution", { invalidId: productId });
              // Attempt to find by name
              const products = await this.productRepo.searchProducts(productId, storeId);
              if (products && products.length > 0) {
                // Use the first match
                productId = products[0].id;
                logger.info("Resolved invalid ID to UUID", { original: item.product_id, resolved: productId, name: products[0].name });
              } else {
                logger.error("Could not resolve invalid ID", { invalidId: item.product_id });
              }
            }

            let product = await this.productRepo.getProductById(
              productId,
              storeId // Pass storeId to verify ownership
            );

            // --- REDUNDANT DATA STRATEGY (Name Fallback) ---
            // If product is not found by ID, try to find it by name
            if (!product && item.product_name) {
              logger.warn("Product ID not found, attempting name resolution", { invalidId: productId, nameFallback: item.product_name });
              const searchResults = await this.productRepo.searchProducts(item.product_name, storeId);

              // Try to find an exact or close match
              const match = searchResults.find(p => p.name.toLowerCase() === item.product_name.toLowerCase()) || searchResults[0];

              if (match) {
                product = match; // Recovered!
                logger.info("Resolved product by NAME fallback", { originalId: productId, resolvedId: product.id, name: product.name });
              }
            }

            if (product) {
              total += product.price * item.quantity;
              finalItems.push({
                productId: product.id,
                productName: product.name,
                quantity: item.quantity,
                unitPrice: product.price,
              });
              logger.info("Product added to final order list", { productId: product.id, name: product.name });
            } else {
              logger.error("Product skipped in final order - VALIDATION FAILED", { productId, name: item.product_name });
            }
          }

          if (finalItems.length > 0) {
            logger.info("Executing create order use case", { total, itemCount: finalItems.length });
            
            // Create the order with the new fields
            const newOrder = new Order(storeId, userId, finalItems, total);
            
            // Add the new fields to the order
            newOrder.shipping_address = shipping_address;
            newOrder.payment_method_id = payment_method_id;
            newOrder.ai_summary = special_instructions || null;
            
            // Save the shipping address to the client profile for future use
            try {
              await supabase
                .from("clients")
                .update({ shipping_address: shipping_address })
                .eq("id", userId);
                
              logger.info("Updated client shipping address", { userId, shipping_address });
            } catch (error) {
              logger.warn("Failed to update client shipping address", { error, userId });
              // Don't fail the order creation if this fails
            }
            
            const orderId = await this.createOrderUseCase.execute(newOrder);
            toolResultContent = JSON.stringify({
              success: true,
              order_id: orderId,
              total_amount: total,
              shipping_address: shipping_address,
              payment_method_id: payment_method_id,
              has_special_instructions: !!special_instructions
            });
          } else {
            logger.error("Order finalization failed - No valid items found", { originalArgs: args });
            toolResultContent = JSON.stringify({
              success: false,
              error: "Invalid products or out of stock",
            });
          }
        }

      } else {
        // Handle the case of custom tool calls if necessary
        logger.warn("Unrecognized tool call", { toolCall, userId });
        toolResultContent = JSON.stringify({ error: "Unsupported tool call" });
      }

      // Add the tool result to the conversation history
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: toolResultContent,
      });

      // 4. Call the AI again to interpret the result and respond to the user
      runner = await this.client.chat.completions.create({
        model: this.model,
        messages: messages,
        tools: TOOLS,
      });
      msg = runner.choices[0].message;
    }

    // Return the final response in natural language
    return msg.content || "I apologize, but I encountered a technical error. Please try again.";
  }

  /**
   * Checks if this is the first interaction of the day
   */
  private isFirstInteractionToday(history: ChatMessage[]): boolean {
    if (history.length === 0) return true;

    const lastMessage = history[history.length - 1];
    if (!lastMessage.created_at) return false;

    const lastDate = new Date(lastMessage.created_at);
    const today = new Date();

    // Compare dates (ignoring time)
    return lastDate.toDateString() !== today.toDateString();
  }

  /**
   * Extracts customer name from chat history if available
   */
  private extractCustomerName(history: ChatMessage[]): string | null {
    // Look for assistant messages that might contain a name greeting
    // This is a simple implementation - could be enhanced with more sophisticated name extraction
    for (const msg of history) {
      if (msg.role === 'user' && msg.content) {
        // Simple heuristic: if user introduces themselves
        const nameMatch = msg.content.match(/(?:my name is|i'm|i am)\s+([A-Z][a-z]+)/i);
        if (nameMatch) {
          return nameMatch[1];
        }
      }
    }
    return null;
  }
}
