import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, FileText, ListChecks, Sparkles, ArrowRight } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const projectTypes = [
  {
    id: "ebook",
    name: "eBook",
    description: "Create a professional digital book",
    icon: BookOpen,
  },
  {
    id: "course",
    name: "Online Course",
    description: "Build a structured learning experience",
    icon: FileText,
  },
  {
    id: "checklist",
    name: "Checklist",
    description: "Create actionable step-by-step guides",
    icon: ListChecks,
  },
  {
    id: "lead_magnet",
    name: "Lead Magnet",
    description: "Design compelling opt-in content",
    icon: Sparkles,
  },
];

export default function NewProject() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<string>("");
  const [title, setTitle] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/projects", {
        type: selectedType,
        title: title || `New ${projectTypes.find(t => t.id === selectedType)?.name}`,
        status: "draft",
      });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Project created successfully!",
      });
      setLocation(`/projects/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (!selectedType) {
      toast({
        title: "Select a type",
        description: "Please select a project type to continue",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Create New Project</h1>
        <p className="text-muted-foreground">Choose the type of digital product you want to create</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Project Title (Optional)</Label>
          <Input
            id="title"
            data-testid="input-title"
            placeholder="Enter a title for your project..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <Label>Select Project Type</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projectTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Card
                  key={type.id}
                  className={`cursor-pointer transition-all hover-elevate ${
                    selectedType === type.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedType(type.id)}
                  data-testid={`card-type-${type.id}`}
                >
                  <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                    <Icon className="h-8 w-8 text-primary" />
                    <div className="flex-1">
                      <CardTitle className="text-lg">{type.name}</CardTitle>
                      <CardDescription className="mt-1">{type.description}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setLocation("/dashboard")}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!selectedType || createMutation.isPending}
            data-testid="button-create"
          >
            {createMutation.isPending ? (
              "Creating..."
            ) : (
              <>
                Create Project
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
