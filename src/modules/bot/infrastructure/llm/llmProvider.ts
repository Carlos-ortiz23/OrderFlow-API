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
        "Search for products in the inventory to see prices and stock. Use it ALWAYS when the user asks about a product.",
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
      name: "finalize_order",
      description:
        "Create the final order ONLY when the customer explicitly confirms they don't want anything else.",
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
                  description: "Product ID obtained from search_products",
                },
                quantity: { type: "number" },
              },
              required: ["product_id", "quantity"],
            },
          },
        },
        required: ["items"],
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
- Only process information necessary for the purchase (product names and quantities)
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
3. Before finalizing any order, confirm the total amount and ask: "Would you like to proceed with this purchase?"
4. Only call 'finalize_order' when the customer explicitly confirms ("yes", "confirm", "proceed", "that's all")
5. Always present prices clearly with currency symbol

RESPONSE FORMAT:
- Product information: "Product: [name] - Price: $[amount] - Available stock: [quantity] units"
- Order totals: "Order total: $[amount]"
- Confirmations: "Order confirmed. Order ID: [id]. Total: $[amount]. Thank you for your purchase."`;

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
          // Give the AI the JSON of the real inventory
          toolResultContent = JSON.stringify(products);

          // --- CASE 2: AI WANTS TO FINALIZE PURCHASE ---
        } else if (toolCall.function.name === "finalize_order") {
          const args = JSON.parse(toolCall.function.arguments);
          logger.info("Agent attempting to finalize order", {
            userId,
            itemCount: args.items.length,
            items: args.items
          });

          // Calculate real totals validating against DB (Security)
          let total = 0;
          let finalItems = [];

          for (const item of args.items) {
            const product = await this.productRepo.getProductById(
              item.product_id,
              storeId // Pass storeId to verify ownership
            );
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
              logger.warn("Product skipped in final order - not found", { productId: item.product_id });
            }
          }

          if (finalItems.length > 0) {
            logger.info("Executing create order use case", { total, itemCount: finalItems.length });
            const newOrder = new Order(storeId, userId, finalItems, total);
            const orderId = await this.createOrderUseCase.execute(newOrder);
            toolResultContent = JSON.stringify({
              success: true,
              order_id: orderId,
              total_pagado: total,
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
