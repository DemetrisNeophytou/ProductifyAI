// Shared TypeScript types for AI Agent system

export type AgentName =
  | "idea_finder"
  | "offer_crafter"
  | "outline_builder"
  | "content_writer"
  | "image_agent"
  | "video_agent"
  | "analytics_agent"
  | "ai_coach";

export interface AgentRunRequest<T = any> {
  jobId: string;                // uuid
  idempotencyKey?: string;      // avoid double-charge
  agent: AgentName;
  input: T;                     // agent-specific input
  projectId: string;            // current project
  userId: string;
  estimateOnly?: boolean;       // if true -> return {estimatedCredits}
}

export interface AgentRunResponse<R = any> {
  jobId: string;
  status: "queued" | "running" | "succeeded" | "failed" | "cancelled";
  estimatedCredits?: number;
  consumedCredits?: number;
  output?: R;                   // agent-specific output
  error?: { code: string; message: string; hint?: string };
  steps?: Array<{ at: string; message: string }>;
}

// Content Writer Agent
export interface ContentWriterInput {
  blockId: string;
  operation: "polish" | "improve" | "shorten" | "expand" | "translate";
  tone?: "professional" | "casual" | "inspirational" | "educational";
  targetLang?: string;
  context?: string; // brand kit, audience, style guide
  maxTokens?: number;
}

export interface ContentWriterOutput {
  blockId: string;
  newText: string;
  diff?: Array<{ op: "add" | "del" | "keep"; text: string }>;
}

// Image Agent
export interface ImageAgentInput {
  sectionId: string;
  mode: "search" | "generate" | "upload";
  query?: string;               // for search/generate
  style?: "photo" | "illustration" | "vector";
  license: "pexels" | "pixabay";  // for search mode
}

export interface ImageAsset {
  url: string;
  width: number;
  height: number;
  source: "pexels" | "pixabay" | "ai";
  attribution?: string;
  alt?: string;
}

export interface ImageAgentOutput {
  sectionId: string;
  images: ImageAsset[];
  selectedIndex: number;        // which one we inserted
}

// Idea Finder Agent
export interface IdeaFinderInput {
  brief: string;
  industry?: string;
  targetAudience?: string;
}

export interface IdeaNiche {
  title: string;
  description: string;
  marketSize: string;
  competition: "low" | "medium" | "high";
  profitPotential: "low" | "medium" | "high";
  reasoning: string;
}

export interface IdeaFinderOutput {
  niches: IdeaNiche[];
}

// Offer Crafter Agent
export interface OfferCrafterInput {
  productType: string;
  targetAudience: string;
  painPoints: string[];
  desiredOutcome: string;
}

export interface PricingTier {
  name: string;
  price: number;
  features: string[];
  bonuses?: string[];
}

export interface OfferCrafterOutput {
  tiers: PricingTier[];
  promise: string;
  guarantee: string;
}

// Outline Builder Agent
export interface OutlineBuilderInput {
  productType: "ebook" | "course" | "template" | "workbook";
  topic: string;
  audience: string;
  chapters?: number;
}

export interface OutlineChapter {
  number: number;
  title: string;
  description: string;
  keyPoints: string[];
  estimatedPages?: number;
}

export interface OutlineBuilderOutput {
  chapters: OutlineChapter[];
  totalPages: number;
}

// Video Agent
export interface VideoAgentInput {
  scriptPrompt: string;
  aspectRatio: "16:9" | "9:16" | "1:1";
  duration?: number; // seconds
  style?: "minimal" | "dynamic" | "professional";
}

export interface VideoAgentOutput {
  script: string;
  captions: Array<{ start: number; end: number; text: string }>;
  thumbnailUrl?: string;
  videoUrl?: string; // if actually generated
}

// Analytics Agent
export interface AnalyticsAgentInput {
  projectId: string;
  timeRange?: "7d" | "30d" | "90d";
}

export interface AnalyticsAgentOutput {
  summary: {
    totalViews: number;
    totalExports: number;
    avgEngagement: number;
  };
  recommendations: string[];
  topPerformingContent: Array<{ id: string; title: string; views: number }>;
}

// AI Coach Agent
export interface AICoachInput {
  message: string;
  context?: {
    currentProject?: string;
    recentActions?: string[];
    userGoals?: string[];
  };
}

export interface AICoachOutput {
  response: string;
  suggestions: Array<{
    action: string;
    agentToUse?: AgentName;
    description: string;
  }>;
  nextStep?: string;
}

// Agent pricing configuration
export const AGENT_PRICING = {
  idea_finder: { min: 2, max: 4 },
  offer_crafter: { min: 2, max: 4 },
  outline_builder: { min: 2, max: 4 },
  content_writer: { min: 1, max: 3 }, // per 500-1500 tokens
  image_agent: {
    search: 1,
    generate: { min: 3, max: 5 },
    upload: 0
  },
  video_agent: { min: 5, max: 8 },
  analytics_agent: { min: 1, max: 2 },
  ai_coach: { min: 1, max: 2 }
} as const;
