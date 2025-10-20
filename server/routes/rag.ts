/**
 * RAG (Retrieval-Augmented Generation) API Routes
 * Vector search over knowledge base for context-grounded AI responses
 */

import { Router } from 'express';
import { OpenAI } from 'openai';
import { db } from '../db';
import { kbEmbeddings, kbChunks, kbDocuments } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { Logger } from '../utils/logger';

const router = Router();

// Initialize OpenAI client (only if configured)
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

interface SearchResult {
  id: string;
  title: string;
  content: string;
  tags: string[];
  score: number;
  source: string;
}

/**
 * Query knowledge base with vector similarity search
 * POST /api/rag/query
 */
router.post('/query', async (req, res) => {
  try {
    const { query, limit = 5 } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        ok: false,
        error: 'Query text is required',
      });
    }

    Logger.info(`RAG query: ${query}`);

    // Check if OpenAI is configured
    if (!openai) {
      return res.json({
        ok: true,
        data: {
          query,
          results: [],
          count: 0,
        },
        mock: true,
        message: 'OpenAI not configured - RAG unavailable',
      });
    }

    // Generate embedding for query
    const queryEmbeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: query,
      dimensions: 1536,
    });

    const queryEmbedding = queryEmbeddingResponse.data[0].embedding;

    // TODO: When pgvector is fully enabled, use native vector search:
    // const results = await db.execute(sql`
    //   SELECT 
    //     d.id,
    //     d.title,
    //     c.content,
    //     d.tags,
    //     d.source,
    //     1 - (e.embedding <=> ${queryEmbedding}::vector) as score
    //   FROM kb_embeddings e
    //   JOIN kb_chunks c ON c.id = e.chunk_id
    //   JOIN kb_documents d ON d.id = c.doc_id
    //   ORDER BY e.embedding <=> ${queryEmbedding}::vector
    //   LIMIT ${limit}
    // `);

    // For now, use fallback: fetch all embeddings and calculate similarity in-memory
    const allEmbeddings = await db
      .select({
        embeddingId: kbEmbeddings.id,
        chunkId: kbEmbeddings.chunkId,
        embedding: kbEmbeddings.embedding,
      })
      .from(kbEmbeddings);

    // Calculate cosine similarity
    const similarities = allEmbeddings.map((emb) => {
      const embedding = JSON.parse(emb.embedding as string);
      const similarity = cosineSimilarity(queryEmbedding, embedding);
      
      return {
        chunkId: emb.chunkId,
        score: similarity,
      };
    });

    // Sort by similarity and take top results
    similarities.sort((a, b) => b.score - a.score);
    const topResults = similarities.slice(0, limit);

    // Fetch full content for top results
    const results: SearchResult[] = [];

    for (const result of topResults) {
      const [chunk] = await db
        .select({
          chunkId: kbChunks.id,
          content: kbChunks.content,
          docId: kbChunks.docId,
        })
        .from(kbChunks)
        .where(eq(kbChunks.id, result.chunkId))
        .limit(1);

      if (chunk) {
        const [doc] = await db
          .select({
            id: kbDocuments.id,
            title: kbDocuments.title,
            tags: kbDocuments.tags,
            source: kbDocuments.source,
          })
          .from(kbDocuments)
          .where(eq(kbDocuments.id, chunk.docId))
          .limit(1);

        if (doc) {
          results.push({
            id: chunk.chunkId,
            title: doc.title,
            content: chunk.content,
            tags: doc.tags as string[],
            score: result.score,
            source: doc.source,
          });
        }
      }
    }

    Logger.info(`RAG results: ${results.length} chunks found, avg score: ${
      results.reduce((sum, r) => sum + r.score, 0) / results.length
    }`);

    res.json({
      ok: true,
      data: {
        query,
        results,
        count: results.length,
      },
    });
  } catch (error: any) {
    Logger.error('RAG query error', error);
    res.status(500).json({
      ok: false,
      error: error.message || 'Failed to search knowledge base',
    });
  }
});

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Get knowledge base statistics
 * GET /api/rag/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const docCount = await db.select({ count: sql`count(*)` }).from(kbDocuments);
    const chunkCount = await db.select({ count: sql`count(*)` }).from(kbChunks);
    const embeddingCount = await db.select({ count: sql`count(*)` }).from(kbEmbeddings);

    res.json({
      ok: true,
      data: {
        documents: Number(docCount[0]?.count || 0),
        chunks: Number(chunkCount[0]?.count || 0),
        embeddings: Number(embeddingCount[0]?.count || 0),
      },
    });
  } catch (error: any) {
    Logger.error('RAG stats error', error);
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

export default router;

