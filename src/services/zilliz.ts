// =============================================================================
// Zilliz Vector Database Service (with built-in embedding)
// =============================================================================

const COLLECTION_NAME = 'pet_products';
const VECTOR_DIM = 512; // jina-embeddings-v3 (Matryoshka, 512-dim)

function getConfig() {
  const endpoint = process.env.ZILLIZ_ENDPOINT;
  const apiKey = process.env.ZILLIZ_API_KEY;

  if (!endpoint || !apiKey) {
    throw new Error('ZILLIZ_ENDPOINT and ZILLIZ_API_KEY must be set');
  }

  return { endpoint, apiKey };
}

// =============================================================================
// Types
// =============================================================================

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  conditions: string[];
  pet_types: string[];
  price: number;
  image_url: string;
  product_url: string;
  brand?: string;
}

interface ZillizSearchResult {
  id: string;
  distance: number;
  name: string;
  description: string;
  category: string;
  conditions: string;
  pet_types: string;
  price: number;
  image_url: string;
  product_url: string;
  brand: string;
}

// =============================================================================
// Zilliz REST API Helpers
// =============================================================================

async function zillizRequest(path: string, body: Record<string, unknown>) {
  const { endpoint, apiKey } = getConfig();
  const url = `${endpoint}/v2/vectordb${path}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (data.code !== 0 && data.code !== 200) {
    console.error('[Zilliz] API Error:', data);
    throw new Error(`Zilliz error: ${data.message || JSON.stringify(data)}`);
  }

  return data;
}

// =============================================================================
// Collection Management
// =============================================================================

export async function dropCollection(): Promise<void> {
  try {
    await zillizRequest('/collections/drop', {
      collectionName: COLLECTION_NAME,
    });
    console.log('[Zilliz] Collection dropped');
  } catch {
    console.log('[Zilliz] Collection does not exist or already dropped');
  }
}

export async function createCollection(): Promise<void> {
  console.log('[Zilliz] Creating collection:', COLLECTION_NAME);

  // Check if collection exists
  try {
    const describeResult = await zillizRequest('/collections/describe', {
      collectionName: COLLECTION_NAME,
    });
    if (describeResult.data) {
      console.log('[Zilliz] Collection already exists');
      return;
    }
  } catch {
    // Collection doesn't exist, create it
  }

  // Create collection with vector field for semantic search
  await zillizRequest('/collections/create', {
    collectionName: COLLECTION_NAME,
    schema: {
      autoId: false,
      enableDynamicField: true,
      fields: [
        { fieldName: 'id', dataType: 'VarChar', isPrimary: true, elementTypeParams: { max_length: '100' } },
        { fieldName: 'vector', dataType: 'FloatVector', elementTypeParams: { dim: VECTOR_DIM } },
        { fieldName: 'name', dataType: 'VarChar', elementTypeParams: { max_length: '500' } },
        { fieldName: 'description', dataType: 'VarChar', elementTypeParams: { max_length: '2000' } },
        { fieldName: 'category', dataType: 'VarChar', elementTypeParams: { max_length: '100' } },
        { fieldName: 'conditions', dataType: 'VarChar', elementTypeParams: { max_length: '500' } },
        { fieldName: 'pet_types', dataType: 'VarChar', elementTypeParams: { max_length: '200' } },
        { fieldName: 'price', dataType: 'Float' },
        { fieldName: 'image_url', dataType: 'VarChar', elementTypeParams: { max_length: '1000' } },
        { fieldName: 'product_url', dataType: 'VarChar', elementTypeParams: { max_length: '1000' } },
        { fieldName: 'brand', dataType: 'VarChar', elementTypeParams: { max_length: '200' } },
      ],
    },
    indexParams: [
      { fieldName: 'vector', indexType: 'AUTOINDEX', metricType: 'COSINE' },
    ],
  });

  console.log('[Zilliz] Collection created successfully');
}

// =============================================================================
// Embedding using Jina AI (jina-embeddings-v3, globally accessible incl. HK)
// Get a free API key (10M tokens, no credit card) at https://jina.ai/embeddings
// =============================================================================

/**
 * task: 'retrieval.passage' when indexing documents,
 *       'retrieval.query'   when embedding a search query.
 * Using task-specific LoRA adapters improves retrieval quality.
 */
async function generateEmbedding(
  text: string,
  task: 'retrieval.passage' | 'retrieval.query' = 'retrieval.query'
): Promise<number[]> {
  const apiKey = process.env.JINA_API_KEY;

  if (!apiKey) {
    throw new Error('JINA_API_KEY required for embeddings. Get a free key at https://jina.ai/embeddings');
  }

  const response = await fetch('https://api.jina.ai/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'jina-embeddings-v3',
      input: [text],
      task,
      dimensions: VECTOR_DIM,
      normalized: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Jina Embedding error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// =============================================================================
// Product Operations
// =============================================================================

export async function insertProduct(product: Product): Promise<void> {
  const textForEmbedding = `${product.name}. ${product.description}. Category: ${product.category}. For: ${product.pet_types.join(', ')}. Conditions: ${product.conditions.join(', ')}`;
  const vector = await generateEmbedding(textForEmbedding, 'retrieval.passage');

  await zillizRequest('/entities/insert', {
    collectionName: COLLECTION_NAME,
    data: [
      {
        id: product.id,
        vector,
        name: product.name,
        description: product.description,
        category: product.category,
        conditions: product.conditions.join(','),
        pet_types: product.pet_types.join(','),
        price: product.price,
        image_url: product.image_url,
        product_url: product.product_url,
        brand: product.brand || '',
      },
    ],
  });

  console.log('[Zilliz] Inserted product:', product.id);
}

export async function insertProducts(products: Product[]): Promise<void> {
  console.log(`[Zilliz] Inserting ${products.length} products...`);

  for (const product of products) {
    try {
      await insertProduct(product);
    } catch (error) {
      console.error(`[Zilliz] Failed to insert ${product.id}:`, error);
    }
    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log('[Zilliz] All products inserted');
}

export async function searchProducts(
  query: string,
  options?: {
    category?: string;
    pet_type?: string;
    limit?: number;
  }
): Promise<Product[]> {
  const vector = await generateEmbedding(query, 'retrieval.query');
  const limit = options?.limit || 5;

  // Build filter expression
  const filters: string[] = [];
  if (options?.category) {
    filters.push(`category == "${options.category}"`);
  }
  if (options?.pet_type) {
    filters.push(`pet_types like "%${options.pet_type}%"`);
  }

  const searchBody: Record<string, unknown> = {
    collectionName: COLLECTION_NAME,
    data: [vector],
    annsField: 'vector',
    limit,
    outputFields: ['id', 'name', 'description', 'category', 'conditions', 'pet_types', 'price', 'image_url', 'product_url', 'brand'],
  };

  if (filters.length > 0) {
    searchBody.filter = filters.join(' and ');
  }

  const result = await zillizRequest('/entities/search', searchBody);

  if (!result.data || result.data.length === 0) {
    return [];
  }

  // Zilliz returns results directly in data array (not nested)
  const items = Array.isArray(result.data[0]) ? result.data[0] : result.data;

  return items.map((item: ZillizSearchResult) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    category: item.category,
    conditions: item.conditions.split(',').filter(Boolean),
    pet_types: item.pet_types.split(',').filter(Boolean),
    price: item.price,
    image_url: item.image_url,
    product_url: item.product_url,
    brand: item.brand || undefined,
    score: 1 - item.distance,
  }));
}

// =============================================================================
// Utility
// =============================================================================

export async function deleteCollection(): Promise<void> {
  await zillizRequest('/collections/drop', {
    collectionName: COLLECTION_NAME,
  });
  console.log('[Zilliz] Collection deleted');
}

export async function getCollectionStats(): Promise<{ count: number }> {
  const result = await zillizRequest('/collections/get_stats', {
    collectionName: COLLECTION_NAME,
  });
  return { count: result.data?.rowCount || 0 };
}
