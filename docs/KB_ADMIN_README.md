# Knowledge Base Admin Dashboard

## Overview

The **KB Admin Dashboard** (`/admin/kb`) provides a professional interface for managing the AI's knowledge base—documents, embeddings, metadata, and semantic search. No need to manually edit Markdown files or run ingestion scripts; everything is managed through the UI.

---

## Features

### 📊 Dashboard Overview
- **Total Documents**: Count of all KB documents
- **Total Chunks**: Aggregated count of text chunks across all documents
- **Topics**: Number of unique topics in the knowledge base
- **Last Updated**: Most recent document modification date

### 📄 Document Management
- **List View**: Table displaying all KB documents with:
  - Title
  - Topic (badge)
  - Tags (up to 3 visible + count)
  - Chunk count
  - Last updated date
  - Action menu (Edit, Recompute, Delete)

### ✏️ Create/Edit Documents
- **Rich Editor Modal**:
  - Title (required)
  - Topic (required)
  - Tags (multi-select, add via input + Enter)
  - Content (Markdown textarea with syntax hints)
- **Auto-save**: Changes persist on submit
- **Validation**: Required fields enforced

### 🔍 Semantic Search
- **Search Bar**: Real-time search over KB documents
- **Search Modes**:
  - Full-text search (fallback)
  - Vector search (when embeddings exist)
- **Results Preview**: Snippet + relevance score

### 🔄 Recompute Embeddings
- **On-Demand**: Click "Recompute Embeddings" for any document
- **Automatic Chunking**: Content split into 500-1000 token chunks
- **OpenAI Integration**: Generates embeddings via `text-embedding-3-large`
- **Database Storage**: Stored in `kb_embeddings` table with pgvector support

### 🗑️ Delete Documents
- **Cascade Delete**: Removes document + chunks + embeddings
- **Confirmation Dialog**: Prevents accidental deletions

---

## Access Control

### Role-Based Gating
- Only accessible if:
  - `EVAL_MODE=true` in `.env`, OR
  - User has `role='admin'` in database

### Implementation
Add this guard to your route (example):

```typescript
// In server middleware or route handler
if (process.env.EVAL_MODE !== 'true' && user.role !== 'admin') {
  return res.status(403).json({ error: 'Admin access required' });
}
```

For frontend, hide the `/admin/kb` link:

```tsx
{(process.env.VITE_EVAL_MODE === 'true' || user.role === 'admin') && (
  <Link href="/admin/kb">KB Admin</Link>
)}
```

---

## Database Schema

### Tables

#### `kb_documents`
| Column | Type | Description |
|--------|------|-------------|
| `id` | varchar | UUID primary key |
| `title` | varchar(255) | Document title |
| `topic` | varchar(100) | Topic/category |
| `tags` | jsonb | Array of tags |
| `source` | varchar(255) | Filename or URL |
| `content` | text | Full Markdown content |
| `metadata` | jsonb | Author, version, category |
| `embedding_updated_at` | timestamp | Last embedding computation |
| `created_at` | timestamp | Creation timestamp |
| `updated_at` | timestamp | Last update timestamp |

**Indexes:**
- `idx_kb_documents_topic` (topic)
- `idx_kb_documents_source` (source)
- `idx_kb_documents_updated` (updated_at)

#### `kb_chunks`
| Column | Type | Description |
|--------|------|-------------|
| `id` | varchar | UUID primary key |
| `doc_id` | varchar | Foreign key to `kb_documents` |
| `idx` | integer | Chunk index in document |
| `content` | text | Chunk text content |
| `tokens` | integer | Token count |
| `metadata` | jsonb | Section, heading |
| `created_at` | timestamp | Creation timestamp |

**Indexes:**
- `idx_kb_chunks_doc` (doc_id)

#### `kb_embeddings`
| Column | Type | Description |
|--------|------|-------------|
| `id` | varchar | UUID primary key |
| `chunk_id` | varchar | Foreign key to `kb_chunks` |
| `embedding` | text | JSON array of floats (3072 dimensions) |
| `model` | varchar(50) | Embedding model name |
| `created_at` | timestamp | Creation timestamp |

**Indexes:**
- `idx_kb_embeddings_chunk` (chunk_id)

**Note**: For production vector search, enable `pgvector` and use `vector(3072)` type with IVF/HNSW index.

---

## API Endpoints

### `GET /api/kb`
**Description**: List all KB documents  
**Response**:
```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "title": "Pricing Strategies",
      "topic": "Pricing",
      "tags": ["pricing", "strategy"],
      "source": "pricing.md",
      "updatedAt": "2025-10-20T12:00:00Z",
      "chunkCount": 8
    }
  ]
}
```

### `GET /api/kb/:id`
**Description**: Get single KB document  
**Response**:
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "title": "Pricing Strategies",
    "topic": "Pricing",
    "tags": ["pricing"],
    "source": "pricing.md",
    "content": "# Pricing Strategies\n\n...",
    "metadata": {},
    "createdAt": "2025-10-20T12:00:00Z",
    "updatedAt": "2025-10-20T12:00:00Z"
  }
}
```

### `POST /api/kb`
**Description**: Create new KB document  
**Body**:
```json
{
  "title": "New Document",
  "topic": "Topic",
  "tags": ["tag1", "tag2"],
  "content": "# Content\n\nMarkdown here...",
  "source": "optional-filename.md"
}
```
**Response**: Created document object

### `PUT /api/kb/:id`
**Description**: Update KB document  
**Body**: Same as POST  
**Response**: Updated document object

### `DELETE /api/kb/:id`
**Description**: Delete KB document (cascade to chunks/embeddings)  
**Response**:
```json
{
  "ok": true,
  "message": "Document deleted successfully"
}
```

### `POST /api/kb/recompute`
**Description**: Recompute embeddings for a document  
**Body**:
```json
{
  "id": "document-uuid"
}
```
**Response**:
```json
{
  "ok": true,
  "message": "Embeddings recomputed successfully",
  "chunksCreated": 10,
  "embeddingsCreated": 10
}
```

### `GET /api/kb/search?q=query`
**Description**: Search KB documents (semantic or full-text)  
**Response**:
```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "title": "Pricing Strategies",
      "topic": "Pricing",
      "snippet": "Value-based pricing is most effective...",
      "score": 0.92
    }
  ]
}
```

---

## Environment Variables

Add to `.env`:

```bash
# Enable admin features (KB Admin, Evaluation)
EVAL_MODE=true

# OpenAI for embeddings
OPENAI_API_KEY=sk-...

# Supabase connection (with pgvector enabled)
DATABASE_URL=postgresql://postgres:password@host:5432/db?sslmode=require
```

---

## Usage Guide

### 1. Access Dashboard
- Navigate to `/admin/kb`
- Ensure `EVAL_MODE=true` or admin role

### 2. Create a Document
1. Click **"New Document"** button
2. Fill in:
   - **Title**: e.g., "Email Marketing Best Practices"
   - **Topic**: e.g., "Marketing"
   - **Tags**: e.g., "email", "conversion", "automation"
   - **Content**: Write Markdown (use `##` for sections, `-` for lists)
3. Click **"Create Document"**

### 3. Edit a Document
1. Click **⋮** (actions menu) on any document
2. Select **"Edit"**
3. Modify fields
4. Click **"Update Document"**

### 4. Recompute Embeddings
**When to Use**:
- After editing document content
- When switching embedding models
- After enabling pgvector for the first time

**Steps**:
1. Click **⋮** (actions menu)
2. Select **"Recompute Embeddings"**
3. Confirm (may take 5-30 seconds depending on document length)

### 5. Search Documents
1. Type query in search bar (min 3 characters)
2. Results update in real-time
3. Click on result to view/edit

### 6. Delete a Document
1. Click **⋮** (actions menu)
2. Select **"Delete"**
3. Confirm deletion (irreversible)

---

## Content Best Practices

### 📝 Writing Effective KB Documents

#### Structure
```markdown
# Title: Clear, Descriptive

## Overview
Brief introduction (1-2 paragraphs)

## Section 1: Core Concept
Detailed explanation with examples

## Section 2: Implementation
Step-by-step instructions

## Section 3: Advanced Techniques
Expert-level insights

## References
- [External Resource](url)
- Related internal docs
```

#### Tips
- **Headings**: Use `##` for sections (H2), `###` for subsections (H3)
- **Lists**: Bullet points (`-`) or numbered (`1.`)
- **Examples**: Code blocks with `` ``` `` fences
- **Emphasis**: `**bold**` for key terms, `*italic*` for emphasis
- **Links**: `[text](url)` for references

#### Topics
Common topics for digital products:
- Product Development
- Pricing & Monetization
- Marketing & Launch
- Content Creation
- SEO & Discovery
- Customer Success
- Growth & Scaling
- Tools & Automation

#### Tags
Be specific and consistent:
✅ Good: `pricing`, `value-based-pricing`, `subscriptions`  
❌ Avoid: `general`, `misc`, `other`

---

## Chunking & Embeddings

### How It Works
1. **Ingestion**: Document content parsed into chunks (500-1000 tokens)
2. **Overlap**: 100-token overlap for context continuity
3. **Metadata**: Each chunk tagged with section/heading
4. **Embedding**: OpenAI `text-embedding-3-large` (3072 dimensions)
5. **Storage**: Vectors stored in `kb_embeddings` table

### Vector Search (Production)
Enable `pgvector` in Supabase:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE kb_embeddings
  ALTER COLUMN embedding TYPE vector(3072) USING embedding::vector;

CREATE INDEX kb_embeddings_ivfflat_idx
  ON kb_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

### Query Example
```sql
SELECT doc.title, chunk.content, 
  1 - (emb.embedding <=> query_embedding) AS similarity
FROM kb_embeddings emb
JOIN kb_chunks chunk ON chunk.id = emb.chunk_id
JOIN kb_documents doc ON doc.id = chunk.doc_id
ORDER BY emb.embedding <=> query_embedding
LIMIT 8;
```

---

## Troubleshooting

### Dashboard Not Loading
- **Check**: `EVAL_MODE=true` in `.env`
- **Check**: User role is `'admin'` in database
- **Check**: Backend route `/api/kb` is registered

### Embeddings Not Computing
- **Check**: `OPENAI_API_KEY` in `.env`
- **Check**: API key has billing enabled
- **Check**: Network connectivity to OpenAI
- **Logs**: Check server logs for embedding errors

### Search Not Working
- **Fallback**: Full-text search used if embeddings missing
- **Check**: Documents have been re-computed after pgvector enable
- **Check**: `kb_embeddings` table populated

### Performance Issues
- **Large Docs**: Split into multiple smaller documents
- **Vector Index**: Ensure IVF/HNSW index created
- **Database**: Optimize Postgres connection pool

---

## Maintenance

### Regular Tasks
- **Weekly**: Review new documents for quality
- **Monthly**: Re-compute embeddings if model updated
- **Quarterly**: Archive outdated content

### Monitoring
Track:
- Document count
- Chunk count (should be ~5-15 per document)
- Embedding generation time
- Search query latency

### Backups
- Database backups include all KB data
- Export documents via API for external backup
- Version control KB Markdown files (optional)

---

## Development

### Adding New Fields
1. Update `shared/schema.ts` (kbDocuments table)
2. Add migration SQL
3. Update API routes (`server/routes/kb.ts`)
4. Update frontend components (`KBEditorModal.tsx`)

### Testing Locally
```bash
# Start dev server
npm run dev

# Access dashboard
http://localhost:5173/admin/kb

# API endpoints
curl http://localhost:5050/api/kb
```

### Mock Data
For development without DB:
- Edit `server/routes/kb.ts`
- Mock responses provided for all endpoints
- Switch to real DB by uncommenting DB queries

---

## Future Enhancements

### Planned Features
- [ ] Bulk import from Markdown files
- [ ] Version history for documents
- [ ] Collaborative editing (multi-user)
- [ ] AI-assisted content suggestions
- [ ] Analytics (most-cited documents)
- [ ] Multi-language support
- [ ] Rich text editor (WYSIWYG Markdown)

### Advanced Search
- [ ] Filters (topic, date range, tags)
- [ ] Hybrid search (vector + keyword)
- [ ] Search result ranking tuning
- [ ] Faceted search UI

---

## Support

### Resources
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [pgvector Guide](https://github.com/pgvector/pgvector)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)

### Contact
For issues or questions:
- Check logs in `server/utils/logger.ts`
- Review error messages in browser console
- Open GitHub issue (if applicable)

---

**Version**: 1.0  
**Last Updated**: October 2025  
**Maintainers**: ProductifyAI Team

