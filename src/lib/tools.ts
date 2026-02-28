import { searchProducts, type Product } from '@/services/zilliz';

// =============================================================================
// Tool Definitions (OpenAI-compatible format)
// =============================================================================

export const PRODUCT_SEARCH_TOOL = {
  type: 'function' as const,
  function: {
    name: 'search_products',
    description: `Search for pet care products to recommend to the user. Use this when:
- The user's pet has a condition that might benefit from a product (wound, ear infection, anxiety, etc.)
- You've provided advice and want to suggest helpful products
- The user asks about products or where to buy something
DO NOT use this for general questions - only when product recommendations would genuinely help.`,
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language search query describing what the pet needs. Examples: "dog wound care spray", "cat anxiety calming", "ear infection treatment for dogs"',
        },
        pet_type: {
          type: 'string',
          enum: ['dog', 'cat'],
          description: 'The type of pet (dog or cat)',
        },
        category: {
          type: 'string',
          enum: [
            'wound-care',
            'digestive-health',
            'ear-care',
            'eye-care',
            'skin-care',
            'allergy-relief',
            'anxiety-relief',
            'first-aid',
            'dental-care',
            'joint-health',
            'pest-prevention',
            'nutrition',
          ],
          description: 'Optional category to filter results',
        },
      },
      required: ['query'],
    },
  },
};

export const ALL_TOOLS = [PRODUCT_SEARCH_TOOL];

// =============================================================================
// Tool Execution
// =============================================================================

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ProductSearchResult {
  products: Product[];
  query: string;
}

export async function executeToolCall(toolCall: ToolCall): Promise<string> {
  const { name, arguments: argsString } = toolCall.function;

  try {
    const args = JSON.parse(argsString);

    if (name === 'search_products') {
      const { query, pet_type, category } = args;

      console.log('[Tools] Searching products:', { query, pet_type, category });

      const products = await searchProducts(query, {
        pet_type,
        category,
        limit: 3, // Return top 3 matches
      });

      if (products.length === 0) {
        return JSON.stringify({
          success: true,
          message: 'No products found matching the criteria',
          products: [],
        });
      }

      // Format products for the AI to present nicely
      const formattedProducts = products.map((p) => ({
        name: p.name,
        brand: p.brand,
        price: `¥${Math.round(p.price)}`,
        description: p.description,
        image_url: p.image_url,
        product_url: p.product_url,
        for_pets: p.pet_types.join(', '),
        helps_with: p.conditions.join(', '),
      }));

      return JSON.stringify({
        success: true,
        products: formattedProducts,
      });
    }

    return JSON.stringify({ error: `Unknown tool: ${name}` });
  } catch (error) {
    console.error('[Tools] Error executing tool:', error);
    return JSON.stringify({
      error: `Failed to execute tool: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
}
