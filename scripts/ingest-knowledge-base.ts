/**
 * Knowledge Base Ingestion Script
 * Reads Markdown files from /docs/knowledge/, chunks content, generates embeddings,
 * and stores them in Supabase for RAG system
 */

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { OpenAI } from 'openai';
import { db } from '../server/db';
import { kbDocuments, kbChunks, kbEmbeddings } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface DocumentMetadata {
  title: string;
  tags: string[];
  summary: string;
}

/**
 * Parse frontmatter from Markdown file
 */
function parseFrontmatter(content: string): { metadata: DocumentMetadata; body: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return {
      metadata: { title: 'Untitled', tags: [], summary: '' },
      body: content,
    };
  }

  const [, frontmatter, body] = match;
  const metadata: any = {};

  // Parse YAML-like frontmatter
  frontmatter.split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      const value = valueParts.join(':').trim();
      
      // Handle arrays (tags)
      if (value.startsWith('[') && value.endsWith(']')) {
        metadata[key.trim()] = value
          .slice(1, -1)
          .split(',')
          .map((t) => t.trim().replace(/"/g, ''));
      } else {
        metadata[key.trim()] = value.replace(/"/g, '');
      }
    }
  });

  return {
    metadata: {
      title: metadata.title || 'Untitled',
      tags: metadata.tags || [],
      summary: metadata.summary || '',
    },
    body: body.trim(),
  };
}

/**
 * Chunk content into manageable pieces (~600 tokens with 100 token overlap)
 */
function chunkContent(content: string, chunkSize: number = 600, overlap: number = 100): string[] {
  const sections = content.split(/\n## /);
  const chunks: string[] = [];

  sections.forEach((section, index) => {
    // Add back the ## for non-first sections
    const sectionText = index === 0 ? section : `## ${section}`;
    
    // Rough token estimation (1 token ≈ 4 characters)
    const estimatedTokens = sectionText.length / 4;

    if (estimatedTokens <= chunkSize) {
      chunks.push(sectionText.trim());
    } else {
      // Split large sections by paragraphs
      const paragraphs = sectionText.split('\n\n');
      let currentChunk = '';
      let currentTokens = 0;

      paragraphs.forEach((para) => {
        const paraTokens = para.length / 4;

        if (currentTokens + paraTokens > chunkSize && currentChunk) {
          chunks.push(currentChunk.trim());
          // Keep overlap
          const overlapText = currentChunk.split(' ').slice(-overlap).join(' ');
          currentChunk = overlapText + '\n\n' + para;
          currentTokens = overlapText.length / 4 + paraTokens;
        } else {
          currentChunk += (currentChunk ? '\n\n' : '') + para;
          currentTokens += paraTokens;
        }
      });

      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
    }
  });

  return chunks.filter((chunk) => chunk.length > 50); // Filter out tiny chunks
}

/**
 * Generate embeddings for text using OpenAI
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: text,
      dimensions: 1536, // Use 1536 dimensions for compatibility
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Ingest a single document
 */
async function ingestDocument(filePath: string, fileName: string) {
  console.log(`\n📄 Processing: ${fileName}`);

  try {
    // Read file
    const content = await readFile(filePath, 'utf-8');
    const { metadata, body } = parseFrontmatter(content);

    console.log(`  ├─ Title: ${metadata.title}`);
    console.log(`  ├─ Tags: ${metadata.tags.join(', ')}`);

    // Check if document already exists (idempotent)
    const [existingDoc] = await db
      .select()
      .from(kbDocuments)
      .where(eq(kbDocuments.source, fileName))
      .limit(1);

    let docId: string;

    if (existingDoc) {
      console.log(`  ├─ Document exists, updating...`);
      
      // Delete old chunks and embeddings (cascade)
      await db.delete(kbChunks).where(eq(kbChunks.docId, existingDoc.id));
      
      // Update document
      await db
        .update(kbDocuments)
        .set({
          title: metadata.title,
          topic: metadata.tags[0] || 'General',
          tags: metadata.tags,
          content: body,
          metadata: { summary: metadata.summary },
          updatedAt: new Date(),
        })
        .where(eq(kbDocuments.id, existingDoc.id));

      docId = existingDoc.id;
    } else {
      console.log(`  ├─ Creating new document...`);
      
      // Insert new document
      const [newDoc] = await db
        .insert(kbDocuments)
        .values({
          title: metadata.title,
          topic: metadata.tags[0] || 'General',
          tags: metadata.tags,
          source: fileName,
          content: body,
          metadata: { summary: metadata.summary },
        })
        .returning();

      docId = newDoc.id;
    }

    // Chunk content
    const chunks = chunkContent(body);
    console.log(`  ├─ Created ${chunks.length} chunks`);

    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const tokens = Math.ceil(chunk.length / 4); // Rough estimation

      // Insert chunk
      const [chunkRecord] = await db
        .insert(kbChunks)
        .values({
          docId,
          idx: i,
          content: chunk,
          tokens,
          metadata: {},
        })
        .returning();

      // Generate and store embedding
      console.log(`  ├─ Generating embedding for chunk ${i + 1}/${chunks.length}...`);
      const embedding = await generateEmbedding(chunk);

      await db.insert(kbEmbeddings).values({
        chunkId: chunkRecord.id,
        embedding: JSON.stringify(embedding), // Store as JSON string
        model: 'text-embedding-3-large',
      });

      // Rate limiting (3 requests per second max for OpenAI)
      await new Promise((resolve) => setTimeout(resolve, 350));
    }

    console.log(`  └─ ✅ Completed: ${chunks.length} chunks with embeddings`);
  } catch (error) {
    console.error(`  └─ ❌ Error processing ${fileName}:`, error);
    throw error;
  }
}

/**
 * Main ingestion function
 */
async function ingestAll() {
  console.log('🚀 Starting Knowledge Base Ingestion\n');
  console.log('================================================');

  try {
    // Verify OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not found in environment variables');
    }

    // Read all markdown files from /docs/knowledge/
    const knowledgePath = join(process.cwd(), 'docs', 'knowledge');
    const files = await readdir(knowledgePath);
    const mdFiles = files.filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));

    console.log(`Found ${mdFiles.length} documents to process\n`);

    // Process each file
    let successCount = 0;
    let errorCount = 0;

    for (const file of mdFiles) {
      try {
        await ingestDocument(join(knowledgePath, file), file);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Failed to process ${file}:`, error);
      }
    }

    console.log('\n================================================');
    console.log('📊 Ingestion Summary:');
    console.log(`  ✅ Successful: ${successCount}`);
    console.log(`  ❌ Failed: ${errorCount}`);
    console.log(`  📚 Total: ${mdFiles.length}`);
    console.log('================================================\n');

    if (successCount > 0) {
      console.log('✨ Knowledge base is ready for RAG queries!');
    }

    process.exit(errorCount > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Fatal error during ingestion:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  ingestAll();
}

export { ingestAll, ingestDocument };

