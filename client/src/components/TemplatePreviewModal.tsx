import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Star,
  Clock,
  TrendingUp,
  Users,
  BookOpen,
  FileText,
  ListChecks,
  Zap,
  Download
} from "lucide-react";
import type { TemplateMetadata } from "@shared/template-catalog";

import { GraduationCap } from "lucide-react";

const TYPE_ICONS: Record<string, any> = {
  ebook: BookOpen,
  course: GraduationCap,
  checklist: ListChecks,
  workbook: FileText,
  guide: FileText,
  leadmagnet: Zap,
  template: FileText,
};

interface TemplatePreviewModalProps {
  template: TemplateMetadata | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseTemplate: (template: TemplateMetadata) => void;
  onToggleFavorite: (templateId: string) => void;
  isFavorite: boolean;
  isGenerating?: boolean;
}

export function TemplatePreviewModal({
  template,
  open,
  onOpenChange,
  onUseTemplate,
  onToggleFavorite,
  isFavorite,
  isGenerating = false,
}: TemplatePreviewModalProps) {
  if (!template) return null;

  const TypeIcon = TYPE_ICONS[template.type] || FileText;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]" data-testid="modal-template-preview">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <TypeIcon className="h-5 w-5 text-primary" />
                <Badge variant="outline" className="text-xs">
                  {template.type}
                </Badge>
                <Badge
                  variant={template.tier === "free" ? "outline" : "default"}
                  className="text-xs"
                  data-testid={`badge-tier-${template.tier}`}
                >
                  {template.tier.toUpperCase()}
                </Badge>
                {template.isTrending && (
                  <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-600 border-orange-500/20">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Trending
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-2xl" data-testid="text-template-title">
                {template.title}
              </DialogTitle>
              <DialogDescription className="text-base mt-2">
                {template.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Time to create</p>
                <p className="text-sm font-medium">{template.estimatedTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Revenue potential</p>
                <p className="text-sm font-medium">{template.revenuePotential}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Downloads</p>
                <p className="text-sm font-medium">{template.downloads.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-muted-foreground fill-yellow-400 text-yellow-400" />
              <div>
                <p className="text-xs text-muted-foreground">Rating</p>
                <p className="text-sm font-medium">{template.rating} / 5</p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-3">What's included:</h3>
            <ScrollArea className="h-[200px] rounded-md border p-4">
              {template.templateStructure ? (
                <div className="space-y-3">
                  {template.templateStructure.sections.map((section, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{section.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    • Professional structure and layout
                  </p>
                  <p className="text-sm text-muted-foreground">
                    • AI-generated content tailored to your niche
                  </p>
                  <p className="text-sm text-muted-foreground">
                    • Ready-to-customize sections
                  </p>
                  <p className="text-sm text-muted-foreground">
                    • Export in multiple formats
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>

          <div className="flex flex-wrap gap-2">
            {template.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => onUseTemplate(template)}
              className="flex-1"
              size="lg"
              disabled={isGenerating}
              data-testid="button-use-template"
            >
              {isGenerating ? (
                <>
                  <Zap className="h-4 w-4 mr-2 animate-pulse" />
                  Generating with AI...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Use This Template
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => onToggleFavorite(template.id)}
              data-testid="button-toggle-favorite-modal"
            >
              <Star
                className={`h-4 w-4 ${isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`}
              />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
