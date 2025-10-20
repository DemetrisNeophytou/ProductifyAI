# RAG System + Plan Gating + Marketing Pages - Implementation Plan

## Status: Schema Ready, Implementation Pending

### ✅ Completed
- Added `plan` column to users table (free/plus/pro)
- Created KB schema (kbDocuments, kbChunks, kbEmbeddings)
- Created usage tracking (usageCredits table)
- All schema changes committed

### 🚧 Remaining Work

This document provides the complete implementation plan for the remaining features.

---

## PART A: RAG Knowledge Base System

### 1. Database Setup

**Enable pgvector Extension** (Supabase SQL Editor):
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Update kbEmbeddings table to use vector type
ALTER TABLE kb_embeddings 
  ADD COLUMN embedding_vector vector(3072); -- text-embedding-3-large dimension

-- Create index for fast similarity search
CREATE INDEX ON kb_embeddings 
  USING ivfflat (embedding_vector vector_cosine_ops)
  WITH (lists = 100);
```

### 2. Knowledge Documents

**Create `/docs/knowledge/` directory with expert content:**

**Files to create** (10-15 documents):
1. `product_playbook.md` - Complete guide to digital product creation
2. `pricing_strategies.md` - Pricing models for digital products
3. `launch_checklist.md` - Step-by-step launch guide
4. `email_sequences.md` - Email marketing for products
5. `marketplace_listings.md` - How to write compelling listings
6. `licensing.md` - License types and legal basics
7. `seo_for_digital_goods.md` - SEO optimization
8. `growth_loops.md` - Sustainable growth strategies
9. `refunds_support.md` - Customer support best practices
10. `analytics_roi.md` - Measuring product success
11. `thumbnails_branding.md` - Visual branding guide
12. `upsells_crosssells.md` - Maximizing customer value
13. `content_marketing.md` - Content strategy
14. `social_media.md` - Social promotion tactics
15. `automation.md` - Workflow automation tips

**Format** (example):
```markdown
# Pricing Strategies for Digital Products

## Overview
Pricing is one of the most critical decisions...

## Value-Based Pricing
- Price based on transformation value
- Not time invested
- Consider customer willingness to pay

## Common Models
1. **Single Payment**: One-time purchase
2. **Subscription**: Monthly recurring
3. **Tiered**: Multiple price points
4. **Freemium**: Free + paid upgrades

## Best Practices
- Test different price points
- Offer payment plans
- Bundle for higher perceived value
- Seasonal discounts strategically
```

### 3. Ingestion Script

**File**: `scripts/ingest-knowledge-base.ts`

```typescript
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import OpenAI from 'openai';
import { db } from '../server/db';
import { kbDocuments, kbChunks, kbEmbeddings } from '@shared/schema';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const CHUNK_SIZE = 800; // tokens
const CHUNK_OVERLAP = 100;

async function ingestKnowledgeBase() {
  const docsPath = join(process.cwd(), 'docs', 'knowledge');
  const files = await readdir(docsPath);
  
  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    
    const content = await readFile(join(docsPath, file), 'utf-8');
    const title = content.match(/# (.+)/)?[1] || file;
    const topic = extractTopic(content);
    const tags = extractTags(content);
    
    // Upsert document
    const [doc] = await db.insert(kbDocuments)
      .values({
        title,
        topic,
        tags,
        source: file,
        content,
      })
      .onConflictDoUpdate({ target: kbDocuments.source, set: { content, updatedAt: new Date() } })
      .returning();
    
    // Split into chunks
    const chunks = splitIntoChunks(content, CHUNK_SIZE, CHUNK_OVERLAP);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // Insert chunk
      const [dbChunk] = await db.insert(kbChunks)
        .values({
          docId: doc.id,
          idx: i,
          content: chunk,
          tokens: estimateTokens(chunk),
        })
        .returning();
      
      // Generate embedding
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-large',
        input: chunk,
      });
      
      const embedding = embeddingResponse.data[0].embedding;
      
      // Store embedding
      await db.insert(kbEmbeddings).values({
        chunkId: dbChunk.id,
        embedding: JSON.stringify(embedding),
      });
    }
  }
  
  console.log('✅ Knowledge base ingested successfully!');
}
```

**Add script to package.json:**
```json
"kb:ingest": "tsx scripts/ingest-knowledge-base.ts"
```

### 4. RAG Chat API

**File**: `server/routes/ai-chat.ts`

```typescript
import { Router } from 'express';
import OpenAI from 'openai';
import { db } from '../db';
import { kbChunks, kbEmbeddings, kbDocuments } from '@shared/schema';

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

router.post('/chat', async (req, res) => {
  const { message, projectId } = req.body;
  const userId = req.user?.id;
  
  // Check plan access
  if (!canAccessAI(req.user)) {
    return res.status(403).json({ 
      error: 'Upgrade to Plus or Pro to access AI chat',
      upgradeUrl: '/pricing'
    });
  }
  
  try {
    // 1. Generate query embedding
    const queryEmbedding = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: message,
    });
    
    // 2. Vector search for relevant chunks
    const relevantChunks = await vectorSearch(
      queryEmbedding.data[0].embedding,
      topK: 8
    );
    
    // 3. Build context from chunks
    const context = relevantChunks
      .map((chunk, i) => `[${i + 1}] ${chunk.content}`)
      .join('\n\n');
    
    // 4. Generate response with GPT-4
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: EXPERT_SYSTEM_PROMPT + '\n\nCONTEXT:\n' + context,
        },
        { role: 'user', content: message },
      ],
      stream: true,
    });
    
    // 5. Stream response
    res.setHeader('Content-Type', 'text/event-stream');
    
    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content || '';
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
    
    res.write(`data: [DONE]\n\n`);
    res.end();
    
  } catch (error) {
    res.status(500).json({ error: 'Chat failed' });
  }
});

const EXPERT_SYSTEM_PROMPT = `You are a world-class Digital Products consultant with deep expertise in creating, pricing, marketing, and selling digital products (ebooks, courses, templates, video packs).

Ground your answers STRICTLY in the provided CONTEXT passages. If the answer isn't in the context, say "I don't have specific information about that, but I recommend..."

Always structure responses as:
1. **Summary**: Direct answer
2. **Action Plan**: Step-by-step checklist
3. **Examples**: Concrete templates or examples
4. **References**: Cite [KB: doc#section]

Be encouraging, specific, and actionable.`;
```

### 5. Vector Search Function

```typescript
async function vectorSearch(queryEmbedding: number[], topK: number = 8) {
  // Convert to string for SQL
  const embeddingStr = JSON.stringify(queryEmbedding);
  
  // Cosine similarity search
  const results = await db.execute(sql`
    SELECT 
      c.content,
      c.doc_id,
      d.title,
      d.topic,
      (1 - (e.embedding_vector <=> ${embeddingStr}::vector)) as similarity
    FROM kb_embeddings e
    JOIN kb_chunks c ON e.chunk_id = c.id
    JOIN kb_documents d ON c.doc_id = d.id
    ORDER BY similarity DESC
    LIMIT ${topK}
  `);
  
  return results.rows;
}
```

---

## PART B: Plan Gating

### 1. Plan Limits Configuration

**File**: `server/utils/plan-limits.ts`

```typescript
export const PLAN_LIMITS = {
  free: {
    aiAccess: false,
    buildersAccess: false,
    projects: 3,
    aiTokens: 0,
    generations: 0,
    features: ['marketplace'],
  },
  plus: {
    aiAccess: true,
    buildersAccess: true,
    projects: 10,
    aiTokens: 20000,
    generations: 500,
    features: ['marketplace', 'ai', 'builders', 'video'],
  },
  pro: {
    aiAccess: true,
    buildersAccess: true,
    projects: -1, // unlimited
    aiTokens: -1,
    generations: -1,
    features: ['all'],
  },
};

export function canAccessAI(user: User): boolean {
  return user.plan === 'plus' || user.plan === 'pro';
}

export function canAccessBuilders(user: User): boolean {
  return user.plan === 'plus' || user.plan === 'pro';
}
```

### 2. API Middleware

**File**: `server/middleware/plan-guard.ts`

```typescript
export function requirePlan(minPlan: 'plus' | 'pro') {
  return (req, res, next) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (user.plan === 'free') {
      return res.status(403).json({ 
        error: `This feature requires ${minPlan} plan`,
        upgradeUrl: '/pricing',
        currentPlan: user.plan,
      });
    }
    
    if (minPlan === 'pro' && user.plan !== 'pro') {
      return res.status(403).json({ 
        error: 'This feature requires Pro plan',
        upgradeUrl: '/pricing',
        currentPlan: user.plan,
      });
    }
    
    next();
  };
}
```

**Apply to routes:**
```typescript
// In server/routes/ai.ts
router.use(requirePlan('plus'));

// In server/routes/ai-builder.ts
router.use(requirePlan('plus'));
```

### 3. Frontend Paywall

**File**: `client/src/components/PaywallModal.tsx`

```typescript
export function PaywallModal({ feature, open, onOpenChange }: PaywallModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Unlock {feature} with Plus or Pro
          </DialogTitle>
          <DialogDescription>
            Upgrade your plan to access AI-powered features
          </DialogDescription>
        </DialogHeader>
        
        <PlanComparison highlightPlan="plus" />
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Maybe Later
          </Button>
          <Link href="/pricing">
            <Button>
              <Crown className="mr-2 h-4 w-4" />
              View Plans
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Hook**: `useRequirePlan(minPlan: string)`

```typescript
export function useRequirePlan(minPlan: 'plus' | 'pro') {
  const { user } = useAuth();
  const [showPaywall, setShowPaywall] = useState(false);
  
  const hasAccess = user?.plan === minPlan || user?.plan === 'pro';
  
  const checkAccess = () => {
    if (!hasAccess) {
      setShowPaywall(true);
      return false;
    }
    return true;
  };
  
  return { hasAccess, checkAccess, showPaywall, setShowPaywall };
}
```

---

## PART C: Marketing & Pricing Pages

### 1. Landing Page (`/`)

**File**: `client/src/pages/Landing.tsx`

**Sections:**
- **Hero**: "Build & Sell Digital Products with AI"
- **Features**: AI Generator, Visual Editor, Video Builder, Analytics
- **Social Proof**: "Join 10,000+ creators"
- **CTA**: "Start Free" button
- **Screenshots**: Product mockups
- **Footer**: Links, social

### 2. Pricing Page (`/pricing`)

**File**: `client/src/pages/Pricing.tsx`

**Plans:**

**Free** - $0/mo
- ✅ Marketplace access
- ✅ 3 products
- ❌ No AI features
- ❌ No builders

**Plus** - $29/mo
- ✅ Everything in Free
- ✅ AI Generator
- ✅ All builders
- ✅ 10 products
- ✅ 20,000 AI tokens/mo
- ✅ 500 generations/mo

**Pro** - $99/mo
- ✅ Everything in Plus
- ✅ Unlimited products
- ✅ Unlimited AI tokens
- ✅ Unlimited generations
- ✅ Priority support
- ✅ White-label options

**Component**: `PlanComparison.tsx` (reusable)

### 3. Signup Flow

**File**: `client/src/pages/Signup.tsx`

**Flow:**
1. Email + password form
2. Select plan (Free/Plus/Pro)
3. If Plus/Pro → Stripe checkout
4. On success → Onboarding

**Onboarding** (`/onboarding`):
- Welcome message
- Quick tour (tooltips)
- "Create first project" CTA
- "Explore marketplace" option

---

## Implementation Commands

### Database Migration

```sql
-- Run in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'free';

-- Add vector column
ALTER TABLE kb_embeddings 
  ADD COLUMN IF NOT EXISTS embedding_vector vector(3072);

-- Create index
CREATE INDEX IF NOT EXISTS kb_embeddings_vector_idx 
  ON kb_embeddings 
  USING ivfflat (embedding_vector vector_cosine_ops)
  WITH (lists = 100);
```

### Ingest Knowledge Base

```bash
# Create knowledge documents first
mkdir -p docs/knowledge

# Then run ingestion
npm run kb:ingest
```

### Test RAG System

```bash
curl -X POST http://localhost:5050/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How should I price my ebook?"}'
```

---

## Frontend Components Needed

### 1. AI Chat Page (`/ai`)

**Components:**
- `ChatInterface.tsx` - Main chat UI
- `MessageList.tsx` - Scrollable messages
- `ChatInput.tsx` - Input with submit
- `SourcesPanel.tsx` - Citations sidebar
- `StreamingMessage.tsx` - Typewriter effect

**Features:**
- Streaming text responses
- Copy button on messages
- Citations list
- Prompt suggestions
- "Insert into project" action
- Paywall for free users

### 2. Paywall Components

- `PaywallModal.tsx` - Upgrade prompt
- `PlanComparison.tsx` - Feature comparison
- `UpgradeCTA.tsx` - Inline upgrade prompts

### 3. Marketing Components

- `Hero.tsx` - Landing hero section
- `FeatureShowcase.tsx` - Feature cards
- `SocialProof.tsx` - Testimonials/stats
- `PricingTable.tsx` - Plan comparison
- `FAQ.tsx` - Common questions

---

## File Structure

```
ProductifyAI/
├── docs/knowledge/              # Knowledge base documents
│   ├── product_playbook.md
│   ├── pricing_strategies.md
│   └── ... (10-15 total)
├── scripts/
│   └── ingest-knowledge-base.ts # Ingestion script
├── server/
│   ├── routes/
│   │   └── ai-chat.ts           # RAG chat endpoint
│   ├── middleware/
│   │   └── plan-guard.ts        # Plan gating
│   └── utils/
│       ├── plan-limits.ts       # Plan configuration
│       └── vector-search.ts     # Similarity search
├── client/src/
│   ├── pages/
│   │   ├── Landing.tsx          # Marketing home
│   │   ├── Pricing.tsx          # Pricing page
│   │   ├── AIChat.tsx           # AI chat interface
│   │   └── Onboarding.tsx       # Post-signup flow
│   ├── components/
│   │   ├── chat/                # Chat components
│   │   ├── marketing/           # Marketing components
│   │   └── paywall/             # Paywall components
│   └── hooks/
│       └── useRequirePlan.ts    # Plan gating hook
└── shared/
    └── schema.ts                # ✅ Updated with KB tables
```

---

## Testing Checklist

### RAG System
- [ ] `npm run kb:ingest` successfully processes all docs
- [ ] Embeddings stored in database
- [ ] Vector search returns relevant results
- [ ] Chat API streams responses
- [ ] Citations are accurate
- [ ] Handles "I don't know" gracefully

### Plan Gating
- [ ] Free users blocked from AI routes
- [ ] Paywall modal shows correctly
- [ ] Plus users can access AI
- [ ] Pro users have unlimited access
- [ ] Usage tracking increments
- [ ] Limits enforced

### Marketing Pages
- [ ] Landing page loads fast
- [ ] Pricing page shows all plans
- [ ] Signup flow works
- [ ] Stripe checkout integrates
- [ ] Onboarding guides users
- [ ] Responsive on mobile

---

## Current Status

### ✅ Completed (Schema Layer)
- KB tables defined (kbDocuments, kbChunks, kbEmbeddings)
- Usage tracking table (usageCredits)
- Plan column added to users
- All types exported

### 🚧 Remaining Implementation
1. **Knowledge Documents** (2-3 hours)
   - Write 10-15 expert MD files
   - Focus on quality, actionable content

2. **Ingestion Script** (2-3 hours)
   - Parse markdown
   - Chunk intelligently
   - Generate embeddings
   - Store in DB

3. **RAG Chat API** (3-4 hours)
   - Vector search implementation
   - Context assembly
   - Streaming response
   - Citation tracking

4. **Chat UI** (2-3 hours)
   - Chat interface
   - Streaming display
   - Sources panel
   - Copy/insert actions

5. **Plan Gating** (2-3 hours)
   - Middleware implementation
   - Frontend guards
   - Paywall modal
   - Usage tracking

6. **Marketing Pages** (3-4 hours)
   - Landing page
   - Pricing page
   - Feature sections
   - Social proof

7. **Onboarding** (1-2 hours)
   - Post-signup flow
   - Quick tour
   - First project CTA

**Total Estimated Time**: 15-22 hours

---

## Quick Start (When Ready to Implement)

### Step 1: Knowledge Base
```bash
# Create knowledge documents
mkdir -p docs/knowledge
# Write 10-15 MD files

# Run ingestion
npm run kb:ingest
```

### Step 2: Backend
```bash
# Enable pgvector in Supabase
# Run SQL migrations
# Test vector search
```

### Step 3: Frontend
```bash
# Build chat UI
# Add paywall components
# Create marketing pages
npm run dev
```

### Step 4: Test
```bash
# Test chat: http://localhost:5173/ai
# Test paywall: Try as free user
# Test pricing: http://localhost:5173/pricing
```

---

## Priority Recommendations

### Immediate (Must Have)
1. ✅ Schema (Done)
2. Knowledge base documents (most important for quality)
3. RAG chat API with vector search
4. Basic plan gating
5. Simple pricing page

### Nice to Have
6. Sophisticated paywall UI
7. Marketing landing page
8. Onboarding flow
9. Usage analytics
10. Admin KB management

---

## Success Metrics

### RAG Quality
- Answers grounded in KB: 90%+
- Relevant citations: 80%+
- Response time: < 3s
- User satisfaction: High

### Plan Conversion
- Free → Plus: 10-15%
- Plus → Pro: 5-10%
- Paywall CTR: 20%+

### Marketing
- Landing page conversion: 3-5%
- Pricing page clarity: High
- Onboarding completion: 80%+

---

**This implementation plan provides a complete roadmap. The schema foundation is ready. Next steps are building the knowledge documents and RAG pipeline!**

