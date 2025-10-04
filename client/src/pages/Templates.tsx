import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  BookOpen, 
  FileText, 
  ListChecks, 
  Rocket, 
  Search, 
  Clock,
  Zap,
  Download,
  Star,
  Users,
  DollarSign,
  TrendingUp,
  Target,
  Heart,
  Brain,
  Briefcase,
  GraduationCap,
  Home
} from "lucide-react";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'ebook' | 'course' | 'checklist' | 'workbook' | 'guide';
  icon: any;
  estimatedTime: string;
  revenuePotential: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  downloads: number;
  rating: number;
  price: string;
}

const TEMPLATES: Template[] = [
  {
    id: "fitness-ebook",
    title: "30-Day Fitness Transformation",
    description: "Complete workout and nutrition guide for busy professionals",
    category: "Health & Fitness",
    type: "ebook",
    icon: Heart,
    estimatedTime: "2 hours",
    revenuePotential: "€5k-€15k/month",
    difficulty: "beginner",
    downloads: 1243,
    rating: 4.9,
    price: "€47"
  },
  {
    id: "mindfulness-course",
    title: "Mindfulness for Entrepreneurs",
    description: "7-module course on stress management and focus",
    category: "Personal Development",
    type: "course",
    icon: Brain,
    estimatedTime: "3 hours",
    revenuePotential: "€10k-€30k/month",
    difficulty: "intermediate",
    downloads: 892,
    rating: 4.8,
    price: "€97"
  },
  {
    id: "social-media-checklist",
    title: "Social Media Launch Checklist",
    description: "Step-by-step product launch checklist for Instagram/TikTok",
    category: "Marketing",
    type: "checklist",
    icon: ListChecks,
    estimatedTime: "1 hour",
    revenuePotential: "€2k-€8k/month",
    difficulty: "beginner",
    downloads: 2105,
    rating: 4.7,
    price: "€27"
  },
  {
    id: "freelance-business",
    title: "Freelancer's Business Toolkit",
    description: "Templates, contracts, and systems for 6-figure freelancing",
    category: "Business",
    type: "workbook",
    icon: Briefcase,
    estimatedTime: "4 hours",
    revenuePotential: "€15k-€40k/month",
    difficulty: "advanced",
    downloads: 678,
    rating: 5.0,
    price: "€147"
  },
  {
    id: "productivity-guide",
    title: "The 4-Hour Workday System",
    description: "Productivity framework for digital entrepreneurs",
    category: "Productivity",
    type: "guide",
    icon: Zap,
    estimatedTime: "2 hours",
    revenuePotential: "€8k-€20k/month",
    difficulty: "intermediate",
    downloads: 1567,
    rating: 4.9,
    price: "€67"
  },
  {
    id: "online-course-creator",
    title: "Online Course Creation Blueprint",
    description: "Build and launch your first €10k course in 30 days",
    category: "Education",
    type: "course",
    icon: GraduationCap,
    estimatedTime: "5 hours",
    revenuePotential: "€20k-€50k/month",
    difficulty: "advanced",
    downloads: 543,
    rating: 4.8,
    price: "€197"
  },
  {
    id: "email-marketing-ebook",
    title: "Email Marketing Mastery",
    description: "Build a €100k email list and automated funnel",
    category: "Marketing",
    type: "ebook",
    icon: Target,
    estimatedTime: "3 hours",
    revenuePotential: "€12k-€35k/month",
    difficulty: "intermediate",
    downloads: 1089,
    rating: 4.7,
    price: "€77"
  },
  {
    id: "remote-work-guide",
    title: "Remote Work Success Guide",
    description: "Work from anywhere while earning €100k+",
    category: "Career",
    type: "guide",
    icon: Home,
    estimatedTime: "2 hours",
    revenuePotential: "€6k-€18k/month",
    difficulty: "beginner",
    downloads: 1834,
    rating: 4.6,
    price: "€47"
  },
  {
    id: "instagram-growth",
    title: "Instagram Growth Accelerator",
    description: "0 to 100k followers in 90 days (organic strategy)",
    category: "Social Media",
    type: "course",
    icon: TrendingUp,
    estimatedTime: "3 hours",
    revenuePotential: "€10k-€25k/month",
    difficulty: "intermediate",
    downloads: 1456,
    rating: 4.8,
    price: "€97"
  },
  {
    id: "startup-checklist",
    title: "Startup Launch Checklist",
    description: "Complete checklist to launch your startup in 60 days",
    category: "Business",
    type: "checklist",
    icon: Rocket,
    estimatedTime: "2 hours",
    revenuePotential: "€5k-€12k/month",
    difficulty: "intermediate",
    downloads: 789,
    rating: 4.9,
    price: "€57"
  },
  {
    id: "passive-income-ebook",
    title: "7 Passive Income Streams",
    description: "Build multiple income sources that run on autopilot",
    category: "Finance",
    type: "ebook",
    icon: DollarSign,
    estimatedTime: "3 hours",
    revenuePotential: "€8k-€22k/month",
    difficulty: "beginner",
    downloads: 2341,
    rating: 4.7,
    price: "€67"
  },
  {
    id: "content-creation-workbook",
    title: "Content Creator's Playbook",
    description: "30-day content strategy for viral growth",
    category: "Content Creation",
    type: "workbook",
    icon: FileText,
    estimatedTime: "2 hours",
    revenuePotential: "€6k-€16k/month",
    difficulty: "beginner",
    downloads: 1678,
    rating: 4.8,
    price: "€47"
  },
  {
    id: "coaching-business",
    title: "6-Figure Coaching Business",
    description: "Launch and scale your coaching practice to €100k+",
    category: "Business",
    type: "course",
    icon: Users,
    estimatedTime: "4 hours",
    revenuePotential: "€15k-€40k/month",
    difficulty: "advanced",
    downloads: 456,
    rating: 5.0,
    price: "€197"
  },
  {
    id: "copywriting-guide",
    title: "Conversion Copywriting Secrets",
    description: "Write sales copy that converts at 15%+",
    category: "Marketing",
    type: "guide",
    icon: FileText,
    estimatedTime: "3 hours",
    revenuePotential: "€10k-€28k/month",
    difficulty: "intermediate",
    downloads: 1123,
    rating: 4.9,
    price: "€87"
  },
  {
    id: "wellness-workbook",
    title: "Holistic Wellness Workbook",
    description: "Mind, body, spirit transformation in 90 days",
    category: "Health & Wellness",
    type: "workbook",
    icon: Heart,
    estimatedTime: "3 hours",
    revenuePotential: "€7k-€18k/month",
    difficulty: "beginner",
    downloads: 1567,
    rating: 4.6,
    price: "€57"
  },
  {
    id: "affiliate-marketing",
    title: "Affiliate Marketing Blueprint",
    description: "€10k/month affiliate income without a huge audience",
    category: "Marketing",
    type: "course",
    icon: DollarSign,
    estimatedTime: "4 hours",
    revenuePotential: "€12k-€30k/month",
    difficulty: "intermediate",
    downloads: 987,
    rating: 4.8,
    price: "€127"
  }
];

const CATEGORIES = ["All", "Business", "Marketing", "Health & Fitness", "Personal Development", "Education", "Finance", "Content Creation", "Social Media"];

export default function Templates() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const useTemplateMutation = useMutation({
    mutationFn: async (template: Template) => {
      const response = await apiRequest("POST", "/api/projects", {
        title: template.title,
        type: template.type,
        templateId: template.id,
        metadata: {
          niche: template.category,
          goal: template.description,
          audience: "Target audience",
          tone: "professional"
        }
      });
      const data = await response.json();
      return data;
    },
    onSuccess: (data: any) => {
      toast({
        title: "Template Added!",
        description: "Your product has been created from this template.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      // Navigate to project editor immediately
      if (data?.id) {
        window.location.href = `/projects/${data.id}`;
      } else {
        console.error("No project ID returned from API", data);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to use template. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredTemplates = TEMPLATES.filter(template => {
    const matchesCategory = selectedCategory === "All" || template.category === selectedCategory;
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'ebook': return BookOpen;
      case 'course': return GraduationCap;
      case 'checklist': return ListChecks;
      case 'workbook': return FileText;
      case 'guide': return Rocket;
      default: return FileText;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty) {
      case 'beginner': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'intermediate': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'advanced': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2" data-testid="heading-templates">
            Template Library
          </h1>
          <p className="text-lg text-muted-foreground" data-testid="text-templates-subtitle">
            15+ proven templates. One-click setup. Start earning in hours, not weeks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Zap className="h-3 w-3" />
            10x Faster Than Building From Scratch
          </Badge>
        </div>
      </div>

      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20" data-testid="card-template-benefits">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Why Use Templates?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Save 20+ Hours</h3>
                <p className="text-sm text-muted-foreground">Pre-built structure, just customize</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <DollarSign className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Proven Revenue Models</h3>
                <p className="text-sm text-muted-foreground">€5k-€50k monthly potential</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Star className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Battle-Tested</h3>
                <p className="text-sm text-muted-foreground">Used by 5,000+ creators</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-templates"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              data-testid={`button-category-${category.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No templates found. Try a different search or category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => {
            const Icon = template.icon;
            const TypeIcon = getTypeIcon(template.type);
            return (
              <Card key={template.id} className="hover-elevate cursor-pointer h-full flex flex-col" data-testid={`card-template-${template.id}`}>
                <CardHeader className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <Badge variant="outline" className="text-xs">
                        <TypeIcon className="h-3 w-3 mr-1" />
                        {template.type}
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${getDifficultyColor(template.difficulty)}`}>
                        {template.difficulty}
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="text-lg mb-2">{template.title}</CardTitle>
                  <CardDescription className="text-sm line-clamp-2">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {template.estimatedTime}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Download className="h-3 w-3" />
                      {template.downloads}
                    </div>
                    <div className="flex items-center gap-1 text-green-600">
                      <DollarSign className="h-3 w-3" />
                      {template.revenuePotential}
                    </div>
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Star className="h-3 w-3 fill-current" />
                      {template.rating}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-2 border-t">
                    <span className="text-lg font-bold">{template.price}</span>
                    <Button 
                      onClick={() => useTemplateMutation.mutate(template)}
                      disabled={useTemplateMutation.isPending}
                      data-testid={`button-use-${template.id}`}
                    >
                      {useTemplateMutation.isPending ? "Creating..." : "Use Template"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
