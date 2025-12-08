import OpenAI from "openai";
import { envConfig } from "../../../../config/env.config";
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

export class OpenAIProvider {
  private openai: OpenAI;
  private readonly model: string;

  constructor(
    private productRepo: ProductRepository,
    private createOrderUseCase: CreateOrderUseCase
  ) {
    this.openai = new OpenAI({ apiKey: envConfig.OPENAI_API_KEY });
    this.model = envConfig.OPENAI_MODEL;
  }

  // Main method: Receives complete history to maintain context
  async runAgent(
    userId: string,
    userMessage: string,
    history: ChatMessage[]
  ): Promise<string> {
    // Validate input
    if (!userMessage || userMessage.trim().length === 0) {
      return "Please send a valid message.";
    }
    // 1. Prepare the system context
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are an expert virtual salesperson for a store.
                GOLDEN RULES:
                1. DO NOT invent products. Use 'search_products' to see what's available and its price.
                2. If you don't find a product, kindly tell the customer it's not available.
                3. Before purchasing, confirm the total with the user or ask "Do you want anything else?".
                4. Only call 'finalize_order' when the customer says "ready", "that's all" or "confirm".`,
      },
      ...history.map(msg => ({
        role: msg.role,
        content: msg.content
      })), // Insert previous memory
      { role: "user", content: userMessage },
    ];

    // 2. First call to the AI
    let runner = await this.openai.chat.completions.create({
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

          const products = await this.productRepo.searchProducts(args.query);
          // Give the AI the JSON of the real inventory
          toolResultContent = JSON.stringify(products);

          // --- CASE 2: AI WANTS TO FINALIZE PURCHASE ---
        } else if (toolCall.function.name === "finalize_order") {
          const args = JSON.parse(toolCall.function.arguments);
          logger.info("Agent finalizing order", { userId, itemCount: args.items.length });

          // Calculate real totals validating against DB (Security)
          let total = 0;
          let finalItems = [];

          for (const item of args.items) {
            const product = await this.productRepo.getProductById(
              item.product_id
            );
            if (product) {
              total += product.price * item.quantity;
              finalItems.push({
                productId: product.id,
                productName: product.name,
                quantity: item.quantity,
                unitPrice: product.price,
              });
            }
          }

          if (finalItems.length > 0) {
            const newOrder = new Order(userId, finalItems, total);
            const orderId = await this.createOrderUseCase.execute(newOrder);
            toolResultContent = JSON.stringify({
              success: true,
              order_id: orderId,
              total_pagado: total,
            });
          } else {
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
      runner = await this.openai.chat.completions.create({
        model: this.model,
        messages: messages,
        tools: TOOLS,
      });
      msg = runner.choices[0].message;
    }

    // Return the final response in natural language
    return msg.content || "Sorry, I had a technical error.";
  }
}
