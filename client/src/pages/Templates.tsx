import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { TemplatePreviewModal } from "@/components/TemplatePreviewModal";
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
  Home,
  Sparkles,
  History
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  TEMPLATE_CATALOG, 
  TEMPLATE_CATEGORIES,
  getTrendingTemplates,
  getNewTemplates,
  getTemplatesByCategory,
  searchTemplates,
  type TemplateMetadata
} from "@shared/template-catalog";

const ICON_MAP: Record<string, any> = {
  Heart,
  Brain,
  ListChecks,
  Briefcase,
  Zap,
  GraduationCap,
  Target,
  Home,
  TrendingUp,
  Rocket,
  DollarSign,
  FileText,
  Users,
  BookOpen
};

export default function Templates() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState<TemplateMetadata | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templateData } = useQuery({
    queryKey: ["/api/templates"],
    staleTime: 60000,
  });

  const { data: recommendationsData } = useQuery({
    queryKey: ["/api/templates/recommendations"],
    staleTime: 60000,
  });

  const favorites = templateData?.favorites || [];
  const recentlyUsed = templateData?.recentlyUsed || [];
  const recommendedIds = recommendationsData?.recommendations || [];

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (templateId: string) => {
      return await apiRequest("POST", `/api/templates/${templateId}/favorite`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "Updated!",
        description: "Template favorites updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update favorites. Please try again.",
        variant: "destructive",
      });
    },
  });

  const trackUsageMutation = useMutation({
    mutationFn: async ({ templateId, projectId }: { templateId: string; projectId?: string }) => {
      return await apiRequest("POST", `/api/templates/${templateId}/use`, { projectId });
    },
  });

  const useTemplateMutation = useMutation({
    mutationFn: async (template: TemplateMetadata) => {
      const response = await apiRequest("POST", "/api/templates/generate", {
        templateId: template.id,
        title: template.title,
        type: template.type,
        category: template.category,
        description: template.description,
      });
      const data = await response.json();
      return { data, templateId: template.id };
    },
    onSuccess: ({ data, templateId }) => {
      trackUsageMutation.mutate({ templateId, projectId: data?.id });
      setPreviewTemplate(null);
      toast({
        title: "Product Created!",
        description: "Your AI-generated product is ready to edit.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      if (data?.id) {
        setLocation(`/projects/${data.id}`);
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

  const getTierBadgeColor = (tier: string) => {
    switch(tier) {
      case 'free': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'plus': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'pro': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const filteredTemplates = searchQuery 
    ? searchTemplates(searchQuery)
    : getTemplatesByCategory(selectedCategory);

  const trendingTemplates = getTrendingTemplates();
  const newTemplates = getNewTemplates();
  const starredTemplates = TEMPLATE_CATALOG.filter(t => favorites.includes(t.id));
  const recentTemplates = TEMPLATE_CATALOG.filter(t => recentlyUsed.includes(t.id)).slice(0, 6);
  const recommendedTemplates = TEMPLATE_CATALOG.filter(t => recommendedIds.includes(t.id));

  const renderTemplateCard = (template: TemplateMetadata) => {
    const Icon = ICON_MAP[template.icon] || FileText;
    const TypeIcon = getTypeIcon(template.type);
    const isFavorited = favorites.includes(template.id);

    return (
      <Card 
        key={template.id} 
        className="hover-elevate cursor-pointer h-full flex flex-col group relative" 
        data-testid={`card-template-${template.id}`}
        onClick={() => setPreviewTemplate(template)}
      >
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavoriteMutation.mutate(template.id);
          }}
          data-testid={`button-favorite-${template.id}`}
        >
          <Star className={`h-4 w-4 ${isFavorited ? 'fill-yellow-400 text-yellow-400' : ''}`} />
        </Button>
        
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
              <Badge variant="outline" className={`text-xs ${getTierBadgeColor(template.tier)}`}>
                {template.tier}
              </Badge>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">{template.title}</CardTitle>
              {(template.isTrending || template.isNew) && (
                <div className="flex gap-1 mb-2">
                  {template.isTrending && (
                    <Badge className="text-xs bg-orange-500/10 text-orange-600 border-orange-500/20">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Trending
                    </Badge>
                  )}
                  {template.isNew && (
                    <Badge className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                      <Sparkles className="h-3 w-3 mr-1" />
                      New
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
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
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="flex items-center justify-between gap-2 pt-2 border-t">
            <span className="text-lg font-bold">{template.price}</span>
            <Badge variant="outline" className={`text-xs ${getDifficultyColor(template.difficulty)}`}>
              {template.difficulty}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="heading-templates">Template Library</h1>
            <p className="text-muted-foreground">
              Discover professionally designed templates to jumpstart your digital products
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates by name, category, or tags..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search"
          />
        </div>

        {!searchQuery && (
          <div>
            <ScrollArea className="w-full whitespace-nowrap pb-4">
              <div className="flex gap-2">
                {TEMPLATE_CATEGORIES.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category)}
                    className="shrink-0"
                    data-testid={`button-category-${category.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {category}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}

        {!searchQuery && recommendedTemplates.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <h2 className="text-2xl font-bold">For You</h2>
              <Badge className="text-xs bg-purple-500/10 text-purple-600 border-purple-500/20">
                Personalized
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedTemplates.map(renderTemplateCard)}
            </div>
          </div>
        )}

        {!searchQuery && starredTemplates.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <h2 className="text-2xl font-bold">Starred Templates</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {starredTemplates.map(renderTemplateCard)}
            </div>
          </div>
        )}

        {!searchQuery && recentTemplates.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <History className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Recently Used</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentTemplates.map(renderTemplateCard)}
            </div>
          </div>
        )}

        {!searchQuery && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <h2 className="text-2xl font-bold">Trending Templates</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingTemplates.map(renderTemplateCard)}
            </div>
          </div>
        )}

        {!searchQuery && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-green-500" />
              <h2 className="text-2xl font-bold">New Templates</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {newTemplates.map(renderTemplateCard)}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold mb-4">
            {searchQuery ? `Search Results for "${searchQuery}"` : "Explore Templates"}
          </h2>
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">
                No templates found. Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map(renderTemplateCard)}
            </div>
          )}
        </div>
      </div>

      <TemplatePreviewModal
        template={previewTemplate}
        open={!!previewTemplate}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
        onUseTemplate={(template) => useTemplateMutation.mutate(template)}
        onToggleFavorite={(templateId) => toggleFavoriteMutation.mutate(templateId)}
        isFavorite={previewTemplate ? favorites.includes(previewTemplate.id) : false}
        isGenerating={useTemplateMutation.isPending}
      />
    </div>
  );
}
