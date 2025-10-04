import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ideaFinderSchema = z.object({
  interests: z.string().min(1, "Please tell us about your interests"),
  timeAvailable: z.string().min(1, "Please select your available time"),
  audienceType: z.string().min(1, "Please select your target audience"),
  experienceLevel: z.string().min(1, "Please select your experience level"),
});

type IdeaFinderForm = z.infer<typeof ideaFinderSchema>;

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

export default function IdeaFinder() {
  const { toast } = useToast();
  const [result, setResult] = useState<AIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<IdeaFinderForm>({
    resolver: zodResolver(ideaFinderSchema),
    defaultValues: {
      interests: "",
      timeAvailable: "",
      audienceType: "",
      experienceLevel: "",
    },
  });

  const onGenerate = async (data: IdeaFinderForm) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'idea',
          inputs: data,
          format: 'markdown'
        })
      });
      
      const result = await response.json();
      
      if (!result.ok) {
        toast({
          title: "Generation Failed",
          description: result.error || "Unable to generate ideas. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      setResult(result);
      toast({
        title: "Ideas Generated!",
        description: "Successfully generated profitable niche ideas for you.",
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
          <Lightbulb className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold" data-testid="heading-idea-finder">
            AI Idea Finder
          </h1>
        </div>
        <p className="text-lg text-muted-foreground" data-testid="text-description">
          Discover 5-7 profitable digital product niches validated with Pain/Money/Access/Speed scoring
        </p>
      </div>

      <Card className="mb-8" data-testid="card-input-form">
        <CardHeader>
          <CardTitle data-testid="heading-form-title">Tell Us About You</CardTitle>
          <CardDescription data-testid="text-form-description">
            Answer a few questions so we can find the perfect niches for you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onGenerate)} className="space-y-6">
              <FormField
                control={form.control}
                name="interests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-interests">Your Interests & Skills</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="E.g., fitness, productivity, design, coding..."
                        {...field}
                        data-testid="input-interests"
                      />
                    </FormControl>
                    <FormMessage data-testid="error-interests" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeAvailable"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-time">Time Available Per Week</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-time">
                          <SelectValue placeholder="How much time can you dedicate?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="5-10 hours" data-testid="option-time-5-10">5-10 hours (Part-time hustle)</SelectItem>
                        <SelectItem value="10-20 hours" data-testid="option-time-10-20">10-20 hours (Serious side project)</SelectItem>
                        <SelectItem value="20+ hours" data-testid="option-time-20plus">20+ hours (Full-time commitment)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage data-testid="error-time" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="audienceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-audience">Target Audience</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-audience">
                          <SelectValue placeholder="Who will buy your products?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="B2C" data-testid="option-audience-b2c">B2C (Consumers/Individuals)</SelectItem>
                        <SelectItem value="B2B" data-testid="option-audience-b2b">B2B (Businesses/Professionals)</SelectItem>
                        <SelectItem value="Both" data-testid="option-audience-both">Both B2B and B2C</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage data-testid="error-audience" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experienceLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-experience">Your Experience Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-experience">
                          <SelectValue placeholder="Select your experience" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Complete beginner" data-testid="option-exp-beginner">Complete Beginner (Never created anything)</SelectItem>
                        <SelectItem value="Some experience" data-testid="option-exp-some">Some Experience (Created 1-2 products)</SelectItem>
                        <SelectItem value="Experienced" data-testid="option-exp-experienced">Experienced (Created 3+ products)</SelectItem>
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
                data-testid="button-generate-ideas"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" data-testid="loader-generating" />
                    Analyzing Profitable Niches...
                  </>
                ) : (
                  <>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Generate Niche Ideas
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
              Your Niche Analysis
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
