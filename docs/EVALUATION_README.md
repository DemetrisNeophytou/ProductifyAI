# ProductifyAI AI Evaluation Suite

## Overview

The Evaluation Suite provides **quantitative measurement** of AI chat quality through benchmark questions. This allows you to:
- Test AI accuracy against golden questions
- Measure grounding in knowledge base
- Track improvements over time
- Identify weak areas for KB expansion

## Architecture

### Components

```
eval/
├── goldenQuestions.json    # 30 benchmark questions
├── evalRunner.ts           # Evaluation logic
└── evalReport.json         # Latest results (generated)

client/src/pages/
└── AdminEvaluation.tsx     # Dashboard UI

docs/
└── EVALUATION_README.md    # This file
```

## Golden Questions Dataset

### Structure

```json
{
  "id": "pricing_1",
  "category": "Pricing",
  "question": "What are 3 effective pricing strategies?",
  "expected_topics": ["pricing", "value-based", "tiered"],
  "min_checklist_items": 3,
  "difficulty": "easy"
}
```

### Categories (30 questions total)
- **Pricing** (7 questions)
- **Launch** (4 questions)
- **Marketplace** (3 questions)
- **SEO** (2 questions)
- **Support** (2 questions)
- **Analytics** (2 questions)
- **Branding** (2 questions)
- **Growth** (2 questions)
- **Legal** (2 questions)
- **Content** (2 questions)
- **Validation** (2 questions)

### Difficulty Levels
- **Easy**: Direct factual questions (60% of set)
- **Medium**: Multi-part or nuanced (30%)
- **Hard**: Complex strategy questions (10%)

## Scoring Algorithm

### 1. Grounding Score (0-100)
**Measures**: Citation accuracy

**Calculation:**
```
citations_found / total_sentences * 200 (capped at 100)
```

**Criteria:**
- ✅ **80-100%**: Most claims cited
- ⚠️ **60-79%**: Some grounding
- ❌ **<60%**: Insufficient citations

**Example:**
```
Response: "Value-based pricing works best [KB: pricing#value]. 
          Set prices at 10-20% of customer outcome [KB: pricing#formula]. 
          Test different tiers."

Sentences: 3
Citations: 2
Score: (2/3) * 200 = 133 → capped at 100
```

### 2. Structure Score (0-100)
**Measures**: Response formatting

**Criteria:**
- Numbered lists (+40 if 3+, +20 if 1-2)
- Bullet points (+30 if 3+, +15 if 1-2)
- Section headers (+30 if 2+, +15 if 1)

**Target**: 
- ✅ **80-100%**: Well-structured with lists
- ⚠️ **60-79%**: Some formatting
- ❌ **<60%**: Plain paragraph

### 3. Completeness Score (0-100)
**Measures**: Topic coverage + actionability

**Formula:**
```
(topics_found / expected_topics * 0.6) + 
(checklist_items >= min_required ? 1 : ratio) * 0.4) * 100
```

**Criteria:**
- ✅ **80-100%**: All topics + full checklist
- ⚠️ **60-79%**: Most topics covered
- ❌ **<60%**: Missing key info

### 4. Length Score (0-100)
**Measures**: Response conciseness

**Ideal Range**: 150-500 words

**Scoring:**
- 150-500 words = 100%
- < 150 words = (wordCount / 150) * 100
- > 500 words = penalize 10% per 100 excess words

### 5. Overall Score (0-100)
**Weighted Average:**
```
(grounding * 0.3) + 
(structure * 0.2) + 
(completeness * 0.4) + 
(length * 0.1)
```

**Rating:**
- ✅ **90-100**: Excellent
- ✅ **80-89**: Good
- ⚠️ **60-79**: Acceptable
- ❌ **<60**: Needs Improvement

## Running Evaluations

### Command Line

```bash
# Run full evaluation suite
npm run eval

# Output:
# 📊 Loaded 30 benchmark questions
# 📝 Evaluating: pricing_1
#    ✅ Overall Score: 85/100
# ...
# ✅ Overall AI Quality Score: 78/100
# 📄 Report saved: eval/evalReport.json
```

### Via Dashboard

1. Navigate to: http://localhost:5173/admin/evaluation
2. Click "Run Evaluation" button
3. Wait for completion (30-60 seconds)
4. View results in tables and charts

## Dashboard Features

### Overview Cards
- **Overall Score**: Average across all questions
- **Grounding**: Citation accuracy
- **Structure**: Formatting quality
- **Completeness**: Topic coverage
- **Total Questions**: Benchmark size

### Category Performance
- Bar chart per category
- Color-coded (green/yellow/red)
- Question count per category

### Detailed Results Table
- All questions with scores
- Filterable tabs (All / Low / High)
- Click row to view response detail
- Sort by any column

### Response Detail View
- Full AI response
- Score breakdown
- Topics found
- Checklist items counted
- Word count

## Adding New Questions

### 1. Edit `eval/goldenQuestions.json`

```json
{
  "id": "unique_id",
  "category": "Category Name",
  "question": "Your question here?",
  "expected_topics": ["topic1", "topic2", "topic3"],
  "min_checklist_items": 3,
  "difficulty": "easy"
}
```

### 2. Guidelines

**Good Questions:**
- Specific and focused
- Have clear expected topics
- Answerable from KB docs
- Representative of real user queries

**Bad Questions:**
- Too vague ("Tell me about products")
- Require external knowledge
- Opinion-based
- Too narrow/niche

### 3. Expected Topics

List 3-5 keywords that MUST appear in a good answer:
- Use lowercase
- Single words or short phrases
- Core to the question

### 4. Min Checklist Items

How many action steps should the response include?
- Easy questions: 2-3 items
- Medium: 3-5 items
- Hard: 5+ items

## Interpreting Results

### High Overall Score (80-100)
✅ AI is performing well  
✅ KB coverage is good  
✅ Maintain current quality  

**Action**: None needed, monitor over time

### Medium Score (60-79)
⚠️ Room for improvement  
⚠️ Some KB gaps  

**Actions:**
1. Review low-scoring questions
2. Identify missing topics
3. Add/enhance KB documents
4. Re-run evaluation

### Low Score (<60)
❌ Significant issues  
❌ KB gaps or poor prompting  

**Actions:**
1. Audit all low scores
2. Expand KB coverage
3. Improve system prompt
4. Add more examples to KB
5. Re-run frequently

## Category-Specific Analysis

### Low Pricing Score
→ Add more pricing examples to `pricing_strategies.md`

### Low Launch Score
→ Expand `launch_checklist.md` with tactics

### Low SEO Score
→ Create detailed `seo_for_digital_goods.md`

## Improving Scores

### 1. Expand Knowledge Base
Add documents in weak categories:
```bash
# Create new document
echo "# Your Topic" > docs/knowledge/your_topic.md

# Write expert content
# Include examples, checklists, case studies

# Ingest to KB
npm run kb:ingest

# Re-evaluate
npm run eval
```

### 2. Enhance Existing Docs
- Add more examples
- Include checklists
- Cite specific tactics
- Add case studies

### 3. Improve System Prompt
Adjust the prompt in `server/routes/ai-chat.ts`:
- Emphasize structure
- Require citations
- Request action steps

### 4. Test & Iterate
```bash
# Make changes
# Re-run eval
npm run eval

# Compare scores
# Iterate based on results
```

## Benchmarking

### Target Scores

**Production Quality:**
- Overall: ≥ 75
- Grounding: ≥ 70
- Structure: ≥ 80
- Completeness: ≥ 75

**Excellent Quality:**
- Overall: ≥ 85
- Grounding: ≥ 80
- Structure: ≥ 90
- Completeness: ≥ 85

### Tracking Over Time

Save reports with timestamps:
```bash
# Rename report after each run
cp eval/evalReport.json eval/reports/eval-2024-01-15.json

# Compare scores over time
# Look for trends
```

## Use Cases

### 1. After KB Updates
```bash
# Add new document
# Ingest
npm run kb:ingest

# Measure improvement
npm run eval

# Compare: Did scores increase?
```

### 2. Before Production Deploy
```bash
# Run evaluation
npm run eval

# Check: Overall score ≥ 75?
# If yes → Deploy
# If no → Improve KB first
```

### 3. Finding KB Gaps
```bash
# Run eval
npm run eval

# Check low scores
# Identify missing topics
# Add KB docs
# Re-eval
```

### 4. A/B Testing Prompts
```bash
# Change system prompt
# Run eval
# Compare scores
# Keep better version
```

## Advanced Features (Future)

### Automatic Regression Testing
```bash
# Run on every KB update
git add docs/knowledge/*.md
git commit -m "Update KB"
# Hook: npm run eval (fails if score drops >10%)
```

### Golden Answer Comparison
```json
{
  "id": "pricing_1",
  "question": "...",
  "golden_answer": "Expected response...",
  "similarity_threshold": 0.85
}
```

### User Feedback Integration
```typescript
// Track real user ratings
POST /api/ai/chat/feedback
{
  messageId: "...",
  rating: 1-5,
  comment: "helpful" | "not helpful"
}

// Compare eval scores vs real ratings
```

## Troubleshooting

### No evalReport.json
**Issue**: Report file not found  
**Solution**: Run `npm run eval` first

### All Scores Zero
**Issue**: AI not responding  
**Solution**: Check OPENAI_API_KEY in .env

### Low Grounding Scores
**Issue**: Responses lack citations  
**Solution**: Update system prompt to require [KB:] citations

### Low Structure Scores
**Issue**: Plain paragraphs, no lists  
**Solution**: Prompt to include action steps

## Example Report

```json
{
  "runId": "eval-1729425600000",
  "timestamp": "2024-10-20T12:00:00.000Z",
  "totalQuestions": 30,
  "summary": {
    "averageGrounding": 75,
    "averageStructure": 85,
    "averageCompleteness": 78,
    "averageLength": 90,
    "overallScore": 78
  },
  "categoryBreakdown": {
    "Pricing": { "count": 7, "averageScore": 82 },
    "Launch": { "count": 4, "averageScore": 75 },
    "SEO": { "count": 2, "averageScore": 65 }
  }
}
```

## Best Practices

### Writing Questions
✅ **DO**:
- Ask realistic user questions
- Include context when needed
- Cover diverse topics
- Test edge cases

❌ **DON'T**:
- Ask opinion questions
- Require real-time data
- Test general knowledge
- Include multiple questions in one

### Interpreting Scores
- Focus on **trends** over time
- Compare **categories** to find gaps
- Review **individual low scores** for insights
- Celebrate **improvements**!

### Improving Quality
1. Run baseline evaluation
2. Identify lowest scoring category
3. Expand KB in that area
4. Re-run and compare
5. Repeat until target scores reached

---

## Quick Start

```bash
# 1. Run evaluation
npm run eval

# 2. View results
cat eval/evalReport.json

# 3. Open dashboard
npm run dev
# Navigate to: http://localhost:5173/admin/evaluation

# 4. Improve KB based on low scores
# Add content to docs/knowledge/

# 5. Re-run
npm run eval
```

---

**Status**: ✅ Complete  
**Questions**: 30 benchmark questions  
**Scoring**: 4 dimensions + overall  
**Dashboard**: Full admin UI  
**Command**: `npm run eval`

