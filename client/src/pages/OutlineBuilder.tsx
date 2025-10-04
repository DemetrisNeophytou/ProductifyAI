import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ListChecks, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const outlineBuilderSchema = z.object({
  productType: z.string().min(1, "Please select a product type"),
  topic: z.string().min(1, "Please describe your topic"),
  targetAudience: z.string().min(1, "Please describe your target audience"),
  mainGoal: z.string().min(1, "Please describe the main goal"),
  experienceLevel: z.string().min(1, "Please select experience level"),
});

type OutlineBuilderForm = z.infer<typeof outlineBuilderSchema>;

interface AIResponse {
  ok: boolean;
  error?: string;
  module?: string;
  deliverables?: Array<{
    type: string;
    filename: string;
    content: string;
  }>;
  kpis?: string[];
  nextActions?: string[];
}

export default function OutlineBuilder() {
  const { toast } = useToast();
  const [result, setResult] = useState<AIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<OutlineBuilderForm>({
    resolver: zodResolver(outlineBuilderSchema),
    defaultValues: {
      productType: "",
      topic: "",
      targetAudience: "",
      mainGoal: "",
      experienceLevel: "",
    },
  });

  const onGenerate = async (data: OutlineBuilderForm) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'launch',
          inputs: data,
          format: 'markdown'
        })
      });
      
      const result = await response.json();
      
      if (!result.ok) {
        toast({
          title: "Generation Failed",
          description: result.error || "Unable to generate outline. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      setResult(result);
      toast({
        title: "Outline Created!",
        description: "Generated complete product outline and structure.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ListChecks className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold" data-testid="heading-outline-builder">
            AI Product Outline
          </h1>
        </div>
        <p className="text-lg text-muted-foreground" data-testid="text-description">
          Create a complete product outline and launch plan with daily action steps
        </p>
      </div>

      <Card className="mb-8" data-testid="card-input-form">
        <CardHeader>
          <CardTitle data-testid="heading-form-title">Product Details</CardTitle>
          <CardDescription data-testid="text-form-description">
            Tell us about your product to create the perfect outline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onGenerate)} className="space-y-6">
              <FormField
                control={form.control}
                name="productType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-product-type">Product Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-product-type">
                          <SelectValue placeholder="Select product type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="eBook" data-testid="option-type-ebook">eBook/Guide</SelectItem>
                        <SelectItem value="Course" data-testid="option-type-course">Online Course</SelectItem>
                        <SelectItem value="Template" data-testid="option-type-template">Template/Toolkit</SelectItem>
                        <SelectItem value="Membership" data-testid="option-type-membership">Membership/Community</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage data-testid="error-product-type" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-topic">Topic/Subject</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="E.g., Email marketing for SaaS founders"
                        {...field}
                        data-testid="input-topic"
                      />
                    </FormControl>
                    <FormMessage data-testid="error-topic" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetAudience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-audience">Target Audience</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Who is this for?"
                        className="min-h-[80px]"
                        {...field}
                        data-testid="textarea-audience"
                      />
                    </FormControl>
                    <FormMessage data-testid="error-audience" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mainGoal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-goal">Main Goal/Outcome</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="E.g., Help users get their first 100 email subscribers"
                        {...field}
                        data-testid="input-goal"
                      />
                    </FormControl>
                    <FormMessage data-testid="error-goal" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experienceLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-experience">Target Experience Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-experience">
                          <SelectValue placeholder="Select experience level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Beginner" data-testid="option-exp-beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate" data-testid="option-exp-intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced" data-testid="option-exp-advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage data-testid="error-experience" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
                data-testid="button-generate-outline"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" data-testid="loader-generating" />
                    Creating Outline...
                  </>
                ) : (
                  <>
                    <ListChecks className="mr-2 h-4 w-4" />
                    Generate Outline
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {result?.ok && result.deliverables && result.deliverables.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold" data-testid="heading-results">
              Your Product Outline
            </h2>
            <Badge variant="secondary" data-testid="badge-generated">
              Generated
            </Badge>
          </div>

          {result.deliverables.map((deliverable, index) => (
            <Card key={index} className="hover-elevate" data-testid={`card-deliverable-${index}`}>
              <CardHeader>
                <CardTitle data-testid={`heading-deliverable-${index}`}>
                  {deliverable.filename}
                </CardTitle>
                <CardDescription data-testid={`text-deliverable-type-${index}`}>
                  {deliverable.type.toUpperCase()} Format
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre 
                  className="whitespace-pre-wrap font-sans text-sm leading-relaxed" 
                  data-testid={`text-deliverable-content-${index}`}
                >
                  {String(deliverable.content)}
                </pre>
              </CardContent>
            </Card>
          ))}

          {result.nextActions && result.nextActions.length > 0 && (
            <Card data-testid="card-next-actions">
              <CardHeader>
                <CardTitle className="text-lg" data-testid="heading-next-actions">
                  Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  {result.nextActions.map((action, index) => (
                    <li key={index} className="text-muted-foreground" data-testid={`next-action-${index}`}>
                      {action}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
