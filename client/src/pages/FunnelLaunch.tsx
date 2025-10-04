import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Rocket, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const funnelLaunchSchema = z.object({
  niche: z.string().min(1, "Please enter your niche"),
  goal: z.string().min(1, "Please enter your goal"),
  audience: z.string().min(1, "Please describe your audience"),
});

type FunnelLaunchForm = z.infer<typeof funnelLaunchSchema>;

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

export default function FunnelLaunch() {
  const { toast } = useToast();
  const [result, setResult] = useState<AIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FunnelLaunchForm>({
    resolver: zodResolver(funnelLaunchSchema),
    defaultValues: {
      niche: "",
      goal: "",
      audience: "",
    },
  });

  const onGenerate = async (data: FunnelLaunchForm) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'funnel',
          inputs: data,
          format: 'markdown'
        })
      });
      
      const result = await response.json();
      
      if (!result.ok) {
        toast({
          title: "Generation Failed",
          description: result.error || "Unable to generate funnel. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      setResult(result);
      toast({
        title: "Funnel Created!",
        description: "Generated complete funnel architecture and launch plan.",
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
          <Rocket className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold" data-testid="heading-funnel-launch">
            AI Funnel & Launch Builder
          </h1>
        </div>
        <p className="text-lg text-muted-foreground" data-testid="text-description">
          Design your complete funnel architecture with traffic strategy and launch timeline
        </p>
      </div>

      <Card className="mb-8" data-testid="card-input-form">
        <CardHeader>
          <CardTitle data-testid="heading-form-title">Funnel Details</CardTitle>
          <CardDescription data-testid="text-form-description">
            Tell us about your niche and goals to create the perfect funnel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onGenerate)} className="space-y-6">
              <FormField
                control={form.control}
                name="niche"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-niche">Your Niche</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="E.g., Productivity for developers"
                        {...field}
                        data-testid="input-niche"
                      />
                    </FormControl>
                    <FormMessage data-testid="error-niche" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="goal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-goal">Your Goal</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="E.g., Generate €10k in 30 days"
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
                name="audience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-audience">Target Audience</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe who will buy from you and their main pain points"
                        className="min-h-[100px]"
                        {...field}
                        data-testid="textarea-audience"
                      />
                    </FormControl>
                    <FormMessage data-testid="error-audience" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
                data-testid="button-generate-funnel"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" data-testid="loader-generating" />
                    Building Funnel...
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-4 w-4" />
                    Generate Funnel Plan
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
              Your Funnel & Launch Plan
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
