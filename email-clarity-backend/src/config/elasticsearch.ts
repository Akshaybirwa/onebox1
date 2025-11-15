import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';

dotenv.config();

let client: Client | null = null;

export function getElasticsearchClient(): Client {
  if (!client) {
    const url = process.env.ELASTICSEARCH_URL || process.env.ES_URL || 'http://localhost:9200';
    client = new Client({ node: url });
    console.log('✅ Elasticsearch client initialized');
  }
  return client;
}

export async function initializeElasticsearchIndex(): Promise<void> {
  const esClient = getElasticsearchClient();
  const indexName = 'emails';
  
  try {
    // Check if index exists
    const exists = await esClient.indices.exists({ index: indexName });
    
    if (!exists) {
      // Create index with mapping
      await esClient.indices.create({
        index: indexName,
        body: {
          mappings: {
            properties: {
              id: { type: 'keyword' },
              from: { type: 'text' },
              to: { type: 'text' },
              subject: { 
                type: 'text',
                analyzer: 'standard'
              },
              bodyText: { 
                type: 'text',
                analyzer: 'standard'
              },
              folder: { type: 'keyword' },
              date: { type: 'date' },
              accountId: { type: 'keyword' },
              category: { type: 'keyword' }
            }
          }
        }
      });
      console.log('✅ Elasticsearch index created');
    } else {
      console.log('✅ Elasticsearch index already exists');
    }
  } catch (error) {
    console.error('❌ Elasticsearch index initialization error:', error);
    throw error;
  }
}

export async function indexEmail(email: any): Promise<void> {
  const esClient = getElasticsearchClient();
  const indexName = 'emails';
  
  try {
    await esClient.index({
      index: indexName,
      id: `${email.accountId}_${email.id}`,
      body: email,
      refresh: true
    });
  } catch (error) {
    console.error('❌ Error indexing email:', error);
    throw error;
  }
}

export async function searchEmails(
  query: string,
  filters: { folder?: string; accountId?: string } = {}
): Promise<any[]> {
  const esClient = getElasticsearchClient();
  const indexName = 'emails';
  
  // Validate query
  if (!query || !query.trim()) {
    console.log('⚠️ Empty search query provided');
    return [];
  }
  
  const trimmedQuery = query.trim();
  console.log(`🔍 Searching Elasticsearch with query: "${trimmedQuery}"`, filters);
  
  // Check if index exists
  try {
    const indexExists = await esClient.indices.exists({ index: indexName });
    if (!indexExists) {
      console.warn(`⚠️ Elasticsearch index "${indexName}" does not exist`);
      return [];
    }
  } catch (error) {
    console.error('❌ Error checking if index exists:', error);
    throw new Error(`Failed to check Elasticsearch index: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  // Check index document count for debugging
  try {
    const statsResponse = await esClient.count({ index: indexName });
    const count = statsResponse.body?.count || statsResponse.count || 0;
    console.log(`📊 Elasticsearch index "${indexName}" contains ${count} documents`);
    if (count === 0) {
      console.warn('⚠️ Elasticsearch index is empty - no emails have been indexed yet');
      return [];
    }
  } catch (error) {
    console.error('❌ Error getting index count:', error);
    // Continue with search anyway
  }
  
  const mustClauses: any[] = [
    {
      multi_match: {
        query: trimmedQuery,
        fields: ['subject^2', 'bodyText', 'from'],
        type: 'best_fields',
        fuzziness: 'AUTO',
        operator: 'or'
      }
    }
  ];
  
  const filterClauses: any[] = [];
  if (filters.folder) {
    filterClauses.push({ term: { folder: filters.folder } });
  }
  if (filters.accountId) {
    filterClauses.push({ term: { accountId: filters.accountId } });
  }
  
  try {
    const searchBody: any = {
      query: {
        bool: {
          must: mustClauses
        }
      },
      size: 100
    };
    
    // Only add filter if there are filter clauses
    if (filterClauses.length > 0) {
      searchBody.query.bool.filter = filterClauses;
    }
    
    console.log(`🔍 Executing Elasticsearch search:`, JSON.stringify(searchBody, null, 2));
    
    const response = await esClient.search({
      index: indexName,
      body: searchBody
    });
    
    // Handle Elasticsearch v7.x response format
    // In v7.x, the response structure is: response.body.hits.hits
    const body = response.body || response;
    const hits = body.hits || {};
    const results = hits.hits || [];
    
    // Handle total count (can be number or { value: number, relation: string })
    let totalHits = 0;
    if (typeof hits.total === 'number') {
      totalHits = hits.total;
    } else if (hits.total?.value) {
      totalHits = hits.total.value;
    } else {
      totalHits = results.length;
    }
    
    console.log(`✅ Elasticsearch search completed: Found ${results.length} results (total: ${totalHits})`);
    
    // Extract _source from each hit
    return results.map((hit: any) => {
      const source = hit._source || hit;
      return source;
    });
  } catch (error) {
    console.error('❌ Elasticsearch search error:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Error stack:', error.stack);
    }
    throw new Error(`Elasticsearch search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

