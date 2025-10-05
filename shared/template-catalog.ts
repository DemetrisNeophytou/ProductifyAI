// Comprehensive template catalog for Canva-style browsing experience
import { ProductTemplate, PRODUCT_TEMPLATES } from './templates';

export interface TemplateMetadata {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'ebook' | 'course' | 'checklist' | 'workbook' | 'guide' | 'leadmagnet';
  icon: string;
  estimatedTime: string;
  revenuePotential: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  downloads: number;
  rating: number;
  price: string;
  tags: string[];
  tier: 'free' | 'plus' | 'pro';
  isTrending?: boolean;
  isNew?: boolean;
  previewImage?: string;
  templateStructure?: ProductTemplate;
}

export const TEMPLATE_CATALOG: TemplateMetadata[] = [
  {
    id: "fitness-ebook",
    title: "30-Day Fitness Transformation",
    description: "Complete workout and nutrition guide for busy professionals",
    category: "Health & Fitness",
    type: "ebook",
    icon: "Heart",
    estimatedTime: "2 hours",
    revenuePotential: "€5k-€15k/month",
    difficulty: "beginner",
    downloads: 1243,
    rating: 4.9,
    price: "€47",
    tags: ["fitness", "wellness", "health", "nutrition"],
    tier: "free",
    isTrending: true,
    templateStructure: PRODUCT_TEMPLATES.find(t => t.id === "ebook-10-chapter")
  },
  {
    id: "mindfulness-course",
    title: "Mindfulness for Entrepreneurs",
    description: "7-module course on stress management and focus",
    category: "Personal Development",
    type: "course",
    icon: "Brain",
    estimatedTime: "3 hours",
    revenuePotential: "€10k-€30k/month",
    difficulty: "intermediate",
    downloads: 892,
    rating: 4.8,
    price: "€97",
    tags: ["mindfulness", "stress-management", "productivity"],
    tier: "plus",
    isNew: true,
    templateStructure: PRODUCT_TEMPLATES.find(t => t.id === "course-6-modules")
  },
  {
    id: "social-media-checklist",
    title: "Social Media Launch Checklist",
    description: "Step-by-step product launch checklist for Instagram/TikTok",
    category: "Marketing",
    type: "checklist",
    icon: "ListChecks",
    estimatedTime: "1 hour",
    revenuePotential: "€2k-€8k/month",
    difficulty: "beginner",
    downloads: 2105,
    rating: 4.7,
    price: "€27",
    tags: ["social-media", "marketing", "launch", "instagram"],
    tier: "free",
    isTrending: true
  },
  {
    id: "freelance-business",
    title: "Freelancer's Business Toolkit",
    description: "Templates, contracts, and systems for 6-figure freelancing",
    category: "Business",
    type: "workbook",
    icon: "Briefcase",
    estimatedTime: "4 hours",
    revenuePotential: "€15k-€40k/month",
    difficulty: "advanced",
    downloads: 678,
    rating: 5.0,
    price: "€147",
    tags: ["freelancing", "business", "contracts", "systems"],
    tier: "pro",
    templateStructure: PRODUCT_TEMPLATES.find(t => t.id === "workbook-interactive")
  },
  {
    id: "productivity-guide",
    title: "The 4-Hour Workday System",
    description: "Productivity framework for digital entrepreneurs",
    category: "Productivity",
    type: "guide",
    icon: "Zap",
    estimatedTime: "2 hours",
    revenuePotential: "€8k-€20k/month",
    difficulty: "intermediate",
    downloads: 1567,
    rating: 4.9,
    price: "€67",
    tags: ["productivity", "time-management", "efficiency"],
    tier: "free",
    isTrending: true
  },
  {
    id: "online-course-creator",
    title: "Online Course Creation Blueprint",
    description: "Build and launch your first €10k course in 30 days",
    category: "Education",
    type: "course",
    icon: "GraduationCap",
    estimatedTime: "5 hours",
    revenuePotential: "€20k-€50k/month",
    difficulty: "advanced",
    downloads: 543,
    rating: 4.8,
    price: "€197",
    tags: ["course-creation", "education", "teaching", "online-business"],
    tier: "pro",
    isNew: true,
    templateStructure: PRODUCT_TEMPLATES.find(t => t.id === "course-6-modules")
  },
  {
    id: "email-marketing-ebook",
    title: "Email Marketing Mastery",
    description: "Build a €100k email list and automated funnel",
    category: "Marketing",
    type: "ebook",
    icon: "Target",
    estimatedTime: "3 hours",
    revenuePotential: "€12k-€35k/month",
    difficulty: "intermediate",
    downloads: 1089,
    rating: 4.7,
    price: "€77",
    tags: ["email-marketing", "list-building", "automation", "funnel"],
    tier: "plus",
    templateStructure: PRODUCT_TEMPLATES.find(t => t.id === "ebook-10-chapter")
  },
  {
    id: "remote-work-guide",
    title: "Remote Work Success Guide",
    description: "Work from anywhere while earning €100k+",
    category: "Career",
    type: "guide",
    icon: "Home",
    estimatedTime: "2 hours",
    revenuePotential: "€6k-€18k/month",
    difficulty: "beginner",
    downloads: 1834,
    rating: 4.6,
    price: "€47",
    tags: ["remote-work", "career", "digital-nomad", "freedom"],
    tier: "free",
    isTrending: true
  },
  {
    id: "instagram-growth",
    title: "Instagram Growth Accelerator",
    description: "0 to 100k followers in 90 days (organic strategy)",
    category: "Social Media",
    type: "course",
    icon: "TrendingUp",
    estimatedTime: "3 hours",
    revenuePotential: "€10k-€25k/month",
    difficulty: "intermediate",
    downloads: 1456,
    rating: 4.8,
    price: "€97",
    tags: ["instagram", "social-media", "growth", "followers"],
    tier: "plus",
    isTrending: true,
    templateStructure: PRODUCT_TEMPLATES.find(t => t.id === "course-6-modules")
  },
  {
    id: "startup-checklist",
    title: "Startup Launch Checklist",
    description: "Complete checklist to launch your startup in 60 days",
    category: "Business",
    type: "checklist",
    icon: "Rocket",
    estimatedTime: "2 hours",
    revenuePotential: "€5k-€12k/month",
    difficulty: "intermediate",
    downloads: 789,
    rating: 4.9,
    price: "€57",
    tags: ["startup", "launch", "entrepreneurship", "business"],
    tier: "free",
    isNew: true
  },
  {
    id: "passive-income-ebook",
    title: "7 Passive Income Streams",
    description: "Build multiple income sources that run on autopilot",
    category: "Finance",
    type: "ebook",
    icon: "DollarSign",
    estimatedTime: "3 hours",
    revenuePotential: "€8k-€22k/month",
    difficulty: "beginner",
    downloads: 2341,
    rating: 4.7,
    price: "€67",
    tags: ["passive-income", "finance", "automation", "wealth"],
    tier: "plus",
    isTrending: true,
    templateStructure: PRODUCT_TEMPLATES.find(t => t.id === "ebook-10-chapter")
  },
  {
    id: "content-creation-workbook",
    title: "Content Creator's Playbook",
    description: "30-day content strategy for viral growth",
    category: "Content Creation",
    type: "workbook",
    icon: "FileText",
    estimatedTime: "2 hours",
    revenuePotential: "€6k-€16k/month",
    difficulty: "beginner",
    downloads: 1678,
    rating: 4.8,
    price: "€47",
    tags: ["content-creation", "strategy", "viral", "growth"],
    tier: "free",
    isNew: true,
    templateStructure: PRODUCT_TEMPLATES.find(t => t.id === "workbook-interactive")
  },
  {
    id: "coaching-business",
    title: "6-Figure Coaching Business",
    description: "Launch and scale your coaching practice to €100k+",
    category: "Business",
    type: "course",
    icon: "Users",
    estimatedTime: "4 hours",
    revenuePotential: "€15k-€40k/month",
    difficulty: "advanced",
    downloads: 456,
    rating: 5.0,
    price: "€197",
    tags: ["coaching", "business", "consulting", "scaling"],
    tier: "pro",
    templateStructure: PRODUCT_TEMPLATES.find(t => t.id === "course-6-modules")
  },
  {
    id: "copywriting-guide",
    title: "Conversion Copywriting Secrets",
    description: "Write sales copy that converts at 15%+",
    category: "Marketing",
    type: "guide",
    icon: "FileText",
    estimatedTime: "3 hours",
    revenuePotential: "€10k-€28k/month",
    difficulty: "intermediate",
    downloads: 1123,
    rating: 4.9,
    price: "€87",
    tags: ["copywriting", "conversion", "sales", "marketing"],
    tier: "plus",
    isTrending: true
  },
  {
    id: "wellness-workbook",
    title: "Holistic Wellness Workbook",
    description: "Mind, body, spirit transformation in 90 days",
    category: "Health & Wellness",
    type: "workbook",
    icon: "Heart",
    estimatedTime: "3 hours",
    revenuePotential: "€7k-€18k/month",
    difficulty: "beginner",
    downloads: 1567,
    rating: 4.6,
    price: "€57",
    tags: ["wellness", "health", "holistic", "transformation"],
    tier: "free",
    templateStructure: PRODUCT_TEMPLATES.find(t => t.id === "workbook-interactive")
  },
  {
    id: "affiliate-marketing",
    title: "Affiliate Marketing Blueprint",
    description: "€10k/month affiliate income without a huge audience",
    category: "Marketing",
    type: "course",
    icon: "DollarSign",
    estimatedTime: "4 hours",
    revenuePotential: "€10k-€30k/month",
    difficulty: "intermediate",
    downloads: 934,
    rating: 4.7,
    price: "€127",
    tags: ["affiliate-marketing", "passive-income", "marketing"],
    tier: "plus",
    templateStructure: PRODUCT_TEMPLATES.find(t => t.id === "course-6-modules")
  },
];

// Category helpers
export const TEMPLATE_CATEGORIES = [
  "All",
  "Health & Fitness",
  "Personal Development",
  "Marketing",
  "Business",
  "Productivity",
  "Education",
  "Career",
  "Social Media",
  "Finance",
  "Content Creation",
  "Health & Wellness"
];

// Filter helpers
export function getTemplatesByCategory(category: string): TemplateMetadata[] {
  if (category === "All") return TEMPLATE_CATALOG;
  return TEMPLATE_CATALOG.filter(t => t.category === category);
}

export function getTemplatesByTier(tier: 'free' | 'plus' | 'pro'): TemplateMetadata[] {
  return TEMPLATE_CATALOG.filter(t => t.tier === tier);
}

export function getTrendingTemplates(): TemplateMetadata[] {
  return TEMPLATE_CATALOG.filter(t => t.isTrending).slice(0, 6);
}

export function getNewTemplates(): TemplateMetadata[] {
  return TEMPLATE_CATALOG.filter(t => t.isNew).slice(0, 6);
}

export function searchTemplates(query: string): TemplateMetadata[] {
  const lowerQuery = query.toLowerCase();
  return TEMPLATE_CATALOG.filter(t => 
    t.title.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.includes(lowerQuery))
  );
}
