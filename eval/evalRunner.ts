/**
 * ProductifyAI Evaluation Runner
 * Tests AI chat quality against benchmark questions
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface GoldenQuestion {
  id: string;
  category: string;
  question: string;
  expected_topics: string[];
  min_checklist_items: number;
  difficulty: string;
}

interface EvaluationResult {
  questionId: string;
  category: string;
  question: string;
  response: string;
  scores: {
    grounding: number;      // 0-100: % of sentences with citations
    structure: number;      // 0-100: presence of lists/bullets
    completeness: number;   // 0-100: topic coverage
    length: number;         // 0-100: ideal 150-500 words
    overall: number;        // Average of above
  };
  topics_found: string[];
  checklist_items_found: number;
  word_count: number;
  timestamp: string;
}

interface EvaluationReport {
  runId: string;
  timestamp: string;
  totalQuestions: number;
  results: EvaluationResult[];
  summary: {
    averageGrounding: number;
    averageStructure: number;
    averageCompleteness: number;
    averageLength: number;
    overallScore: number;
  };
  categoryBreakdown: Record<string, {
    count: number;
    averageScore: number;
  }>;
}

/**
 * Simulate AI chat response (mock for now - replace with actual API call)
 */
async function getAIResponse(question: string): Promise<string> {
  // TODO: Replace with actual POST /api/ai/chat call
  // For now, return mock responses based on question keywords
  
  await new Promise(resolve => setTimeout(resolve, 500));

  if (question.toLowerCase().includes('pricing')) {
    return `Here are 3 effective pricing strategies for digital templates:

1. **Value-Based Pricing** - Price based on the time/money saved by the customer. If your template saves 10 hours of work, price it at $49-$149 (consultant would charge $50/hr). [KB: pricing_strategies#value-based]

2. **Tiered Pricing** - Offer Basic ($19), Standard ($49), and Premium ($99) versions with different features. Most customers choose the middle tier. [KB: pricing_strategies#price-anchoring]

3. **Bundle Pricing** - Package multiple templates together for higher perceived value. Sell individual at $29 or bundle of 5 for $99. [KB: pricing_strategies#revenue-optimization]

**Action Plan:**
- Calculate transformation value for your customer
- Research 3-5 competitor prices
- Test with middle-tier pricing first
- Offer bundle discount (20-30% off)

**Example:** Canva templates that save designers 5 hours typically sell for $47-$97.`;
  }

  if (question.toLowerCase().includes('launch')) {
    return `Launching your first online course with zero budget requires strategic organic marketing:

**Pre-Launch (2-3 weeks):**
1. Build email list with free lead magnet
2. Create social media teasers
3. Recruit beta testers for testimonials
4. Prepare launch content

**Launch Week:**
- Email announcement to list
- Social media campaign (daily posts)
- Engage in relevant communities
- Partner collaborations (cross-promotion)
- Limited-time discount (20-30% off)

[KB: launch_checklist#pre-launch] [KB: email_sequences#launch]

**Key Success Factors:**
- Have at least 100 email subscribers before launch
- Collect 5-10 testimonials from beta users
- Create urgency with limited-time offer
- Follow up with non-buyers

**Timeline:** Aim for $1K-$5K in first week with proper execution.`;
  }

  // Default response
  return `I don't have specific information about that in my knowledge base. However, I recommend:

1. Research best practices in this area
2. Test with a small audience first
3. Iterate based on feedback

Would you like me to help with a related topic I have more information about?`;
}

/**
 * Evaluate grounding score
 */
function evaluateGrounding(response: string): number {
  const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const citedSentences = response.match(/\[KB:[^\]]+\]/g) || [];
  
  if (sentences.length === 0) return 0;
  
  // Each citation counts for nearby sentences (within 2 sentences)
  const citationScore = Math.min(100, (citedSentences.length / sentences.length) * 200);
  
  return Math.round(citationScore);
}

/**
 * Evaluate structure score
 */
function evaluateStructure(response: string): number {
  let score = 0;
  
  // Check for numbered lists
  const numberedLists = (response.match(/^\d+\./gm) || []).length;
  if (numberedLists >= 3) score += 40;
  else if (numberedLists >= 1) score += 20;
  
  // Check for bullet points
  const bulletPoints = (response.match(/^[-*]/gm) || []).length;
  if (bulletPoints >= 3) score += 30;
  else if (bulletPoints >= 1) score += 15;
  
  // Check for section headers
  const headers = (response.match(/^\*\*[^*]+\*\*:?/gm) || []).length;
  if (headers >= 2) score += 30;
  else if (headers >= 1) score += 15;
  
  return Math.min(100, score);
}

/**
 * Evaluate completeness score
 */
function evaluateCompleteness(
  response: string,
  expectedTopics: string[],
  minChecklist: number
): { score: number; topicsFound: string[]; checklistItems: number } {
  const lowerResponse = response.toLowerCase();
  
  // Check topic coverage
  const topicsFound = expectedTopics.filter(topic =>
    lowerResponse.includes(topic.toLowerCase())
  );
  
  const topicScore = (topicsFound.length / expectedTopics.length) * 100;
  
  // Count checklist items (numbered or bulleted)
  const numberedItems = (response.match(/^\d+\./gm) || []).length;
  const bulletItems = (response.match(/^[-*]/gm) || []).length;
  const checklistItems = Math.max(numberedItems, bulletItems);
  
  const checklistScore = checklistItems >= minChecklist ? 100 : (checklistItems / minChecklist) * 100;
  
  // Combined score
  const score = Math.round((topicScore * 0.6 + checklistScore * 0.4));
  
  return {
    score,
    topicsFound,
    checklistItems,
  };
}

/**
 * Evaluate length score
 */
function evaluateLengthScore(wordCount: number): number {
  const idealMin = 150;
  const idealMax = 500;
  
  if (wordCount >= idealMin && wordCount <= idealMax) {
    return 100;
  }
  
  if (wordCount < idealMin) {
    return Math.round((wordCount / idealMin) * 100);
  }
  
  // Too long (penalize but not as harshly)
  const excess = wordCount - idealMax;
  const penalty = Math.min(50, (excess / 500) * 50);
  return Math.max(50, 100 - penalty);
}

/**
 * Run evaluation on single question
 */
async function evaluateQuestion(question: GoldenQuestion): Promise<EvaluationResult> {
  console.log(`\n📝 Evaluating: ${question.id}`);
  console.log(`   Question: ${question.question}`);
  
  // Get AI response
  const response = await getAIResponse(question.question);
  const wordCount = response.split(/\s+/).length;
  
  // Calculate scores
  const groundingScore = evaluateGrounding(response);
  const structureScore = evaluateStructure(response);
  const completeness = evaluateCompleteness(
    response,
    question.expected_topics,
    question.min_checklist_items
  );
  const lengthScore = evaluateLengthScore(wordCount);
  
  const overallScore = Math.round(
    (groundingScore * 0.3 + 
     structureScore * 0.2 + 
     completeness.score * 0.4 + 
     lengthScore * 0.1)
  );
  
  console.log(`   ✅ Overall Score: ${overallScore}/100`);
  console.log(`      - Grounding: ${groundingScore}/100`);
  console.log(`      - Structure: ${structureScore}/100`);
  console.log(`      - Completeness: ${completeness.score}/100`);
  console.log(`      - Length: ${lengthScore}/100 (${wordCount} words)`);
  
  return {
    questionId: question.id,
    category: question.category,
    question: question.question,
    response,
    scores: {
      grounding: groundingScore,
      structure: structureScore,
      completeness: completeness.score,
      length: lengthScore,
      overall: overallScore,
    },
    topics_found: completeness.topicsFound,
    checklist_items_found: completeness.checklistItems,
    word_count: wordCount,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Run full evaluation suite
 */
export async function runEvaluation(): Promise<EvaluationReport> {
  console.log('🚀 Starting ProductifyAI AI Evaluation Suite\n');
  
  // Load golden questions
  const questionsPath = join(process.cwd(), 'eval', 'goldenQuestions.json');
  const questions: GoldenQuestion[] = JSON.parse(readFileSync(questionsPath, 'utf-8'));
  
  console.log(`📊 Loaded ${questions.length} benchmark questions\n`);
  
  // Run evaluations
  const results: EvaluationResult[] = [];
  
  for (const question of questions) {
    const result = await evaluateQuestion(question);
    results.push(result);
  }
  
  // Calculate summary statistics
  const avgGrounding = results.reduce((sum, r) => sum + r.scores.grounding, 0) / results.length;
  const avgStructure = results.reduce((sum, r) => sum + r.scores.structure, 0) / results.length;
  const avgCompleteness = results.reduce((sum, r) => sum + r.scores.completeness, 0) / results.length;
  const avgLength = results.reduce((sum, r) => sum + r.scores.length, 0) / results.length;
  const overallScore = results.reduce((sum, r) => sum + r.scores.overall, 0) / results.length;
  
  // Category breakdown
  const categoryBreakdown: Record<string, { count: number; averageScore: number }> = {};
  
  results.forEach(result => {
    if (!categoryBreakdown[result.category]) {
      categoryBreakdown[result.category] = { count: 0, averageScore: 0 };
    }
    categoryBreakdown[result.category].count++;
    categoryBreakdown[result.category].averageScore += result.scores.overall;
  });
  
  Object.keys(categoryBreakdown).forEach(category => {
    categoryBreakdown[category].averageScore = Math.round(
      categoryBreakdown[category].averageScore / categoryBreakdown[category].count
    );
  });
  
  // Build report
  const report: EvaluationReport = {
    runId: `eval-${Date.now()}`,
    timestamp: new Date().toISOString(),
    totalQuestions: questions.length,
    results,
    summary: {
      averageGrounding: Math.round(avgGrounding),
      averageStructure: Math.round(avgStructure),
      averageCompleteness: Math.round(avgCompleteness),
      averageLength: Math.round(avgLength),
      overallScore: Math.round(overallScore),
    },
    categoryBreakdown,
  };
  
  // Save report
  const reportPath = join(process.cwd(), 'eval', 'evalReport.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 EVALUATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`\n✅ Overall AI Quality Score: ${report.summary.overallScore}/100\n`);
  console.log('Score Breakdown:');
  console.log(`   Grounding:    ${report.summary.averageGrounding}/100`);
  console.log(`   Structure:    ${report.summary.averageStructure}/100`);
  console.log(`   Completeness: ${report.summary.averageCompleteness}/100`);
  console.log(`   Length:       ${report.summary.averageLength}/100\n`);
  
  console.log('Category Performance:');
  Object.entries(categoryBreakdown).forEach(([category, data]) => {
    console.log(`   ${category}: ${data.averageScore}/100 (${data.count} questions)`);
  });
  
  console.log(`\n📄 Report saved: eval/evalReport.json\n`);
  
  return report;
}

// Run if called directly
if (require.main === module) {
  runEvaluation().catch(console.error);
}

export { runEvaluation };
export type { EvaluationReport, EvaluationResult };

