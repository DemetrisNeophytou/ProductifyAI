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
import { FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const contentWriterSchema = z.object({
  productType: z.string().min(1, "Please select product type"),
  topic: z.string().min(1, "Please enter your topic"),
  targetAudience: z.string().min(1, "Please describe your audience"),
  tone: z.string().min(1, "Please select tone"),
});

type ContentWriterForm = z.infer<typeof contentWriterSchema>;

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

export default function ContentWriter() {
  const { toast } = useToast();
  const [result, setResult] = useState<AIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ContentWriterForm>({
    resolver: zodResolver(contentWriterSchema),
    defaultValues: {
      productType: "",
      topic: "",
      targetAudience: "",
      tone: "",
    },
  });

  const onGenerate = async (data: ContentWriterForm) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'content',
          inputs: data,
          format: 'markdown'
        })
      });
      
      const result = await response.json();
      
      if (!result.ok) {
        toast({
          title: "Generation Failed",
          description: result.error || "Unable to generate content. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      setResult(result);
      toast({
        title: "Content Created!",
        description: "Generated production-ready content outline and copy.",
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
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold" data-testid="heading-content-writer">
            AI Content Writer
          </h1>
        </div>
        <p className="text-lg text-muted-foreground" data-testid="text-description">
          Generate production-ready content outlines, copy, and marketing materials
        </p>
      </div>

      <Card className="mb-8" data-testid="card-input-form">
        <CardHeader>
          <CardTitle data-testid="heading-form-title">Content Details</CardTitle>
          <CardDescription data-testid="text-form-description">
            Tell us what type of content you need to create
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
                    <FormLabel data-testid="label-product-type">Content Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-product-type">
                          <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="eBook" data-testid="option-type-ebook">eBook/Guide</SelectItem>
                        <SelectItem value="Course" data-testid="option-type-course">Online Course</SelectItem>
                        <SelectItem value="Email Sequence" data-testid="option-type-email">Email Sequence</SelectItem>
                        <SelectItem value="Sales Page" data-testid="option-type-sales">Sales Page Copy</SelectItem>
                        <SelectItem value="Ad Copy" data-testid="option-type-ad">Ad Copy</SelectItem>
                        <SelectItem value="Social Media" data-testid="option-type-social">Social Media Content</SelectItem>
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
                        placeholder="E.g., Time management for busy entrepreneurs"
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
                        placeholder="Who is this content for? What are their pain points?"
                        className="min-h-[100px]"
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
                name="tone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-tone">Tone of Voice</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-tone">
                          <SelectValue placeholder="Select tone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Professional" data-testid="option-tone-professional">Professional</SelectItem>
                        <SelectItem value="Casual & Friendly" data-testid="option-tone-casual">Casual & Friendly</SelectItem>
                        <SelectItem value="Direct & Bold" data-testid="option-tone-direct">Direct & Bold</SelectItem>
                        <SelectItem value="Educational" data-testid="option-tone-educational">Educational</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage data-testid="error-tone" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
                data-testid="button-generate-content"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" data-testid="loader-generating" />
                    Writing Content...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Content
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
              Your Content
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
