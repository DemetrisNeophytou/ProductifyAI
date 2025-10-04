import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Rocket, Loader2, Target, Users, TrendingUp, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const funnelPlannerSchema = z.object({
  productName: z.string().min(1, "Please enter product name"),
  productPrice: z.string().min(1, "Please enter price"),
  hasAudience: z.string().min(1, "Please select audience status"),
  launchGoal: z.string().min(1, "Please enter launch goal"),
});

type FunnelPlannerForm = z.infer<typeof funnelPlannerSchema>;

interface FunnelStage {
  stage: string;
  objective: string;
  tactics: string[];
  metrics: string;
}

interface LaunchDay {
  day: number;
  activities: string[];
  goal: string;
}

interface FunnelResult {
  funnelStrategy: {
    type: string;
    overview: string;
    expectedConversion: string;
  };
  funnelStages: FunnelStage[];
  launchRoadmap: LaunchDay[];
  trafficStrategies: {
    channel: string;
    approach: string;
    timeline: string;
  }[];
  nextSteps: string[];
}

export default function FunnelPlanner() {
  const { toast } = useToast();
  const [results, setResults] = useState<FunnelResult | null>(null);

  const { data: subscriptionStatus } = useQuery<{
    tier: 'free' | 'plus' | 'pro' | null;
  }>({
    queryKey: ["/api/subscription/status"],
  });

  const isPro = subscriptionStatus?.tier === 'pro';

  const form = useForm<FunnelPlannerForm>({
    resolver: zodResolver(funnelPlannerSchema),
    defaultValues: {
      productName: "",
      productPrice: "",
      hasAudience: "",
      launchGoal: "",
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (data: FunnelPlannerForm) => {
      const response = await apiRequest<FunnelResult>('/api/builders/funnel', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/builders/funnel'] });
      setResults(data);
      toast({
        title: "Funnel Created!",
        description: `Generated complete launch roadmap with ${data.launchRoadmap.length}-day plan.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Unable to generate funnel. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FunnelPlannerForm) => {
    generateMutation.mutate(data);
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Rocket className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold" data-testid="heading-funnel-planner">
            Funnel & Launch Planner
          </h1>
        </div>
        <p className="text-lg text-muted-foreground" data-testid="text-description">
          Build your complete sales funnel and launch roadmap from product to first sales
        </p>
      </div>

      <Card className="mb-8" data-testid="card-input-form">
        <CardHeader>
          <CardTitle data-testid="heading-form-title">Launch Details</CardTitle>
          <CardDescription data-testid="text-form-description">
            Tell us about your product and goals so we can create your launch plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="productName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-name">Product Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Complete Freelance Writing System"
                        {...field}
                        data-testid="input-name"
                      />
                    </FormControl>
                    <FormMessage data-testid="error-name" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="productPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-price">Product Price</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., €97"
                        {...field}
                        data-testid="input-price"
                      />
                    </FormControl>
                    <FormMessage data-testid="error-price" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hasAudience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-audience">Do you have an existing audience?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-audience">
                          <SelectValue placeholder="Select audience status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="No audience" data-testid="option-audience-none">No - Starting from zero</SelectItem>
                        <SelectItem value="Small audience" data-testid="option-audience-small">Small (under 500 followers)</SelectItem>
                        <SelectItem value="Medium audience" data-testid="option-audience-medium">Medium (500-5000)</SelectItem>
                        <SelectItem value="Large audience" data-testid="option-audience-large">Large (5000+)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage data-testid="error-audience" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="launchGoal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-goal">Launch Revenue Goal</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., €10,000 in first 30 days with 100 sales"
                        className="resize-none"
                        rows={3}
                        {...field}
                        data-testid="input-goal"
                      />
                    </FormControl>
                    <FormMessage data-testid="error-goal" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={generateMutation.isPending}
                data-testid="button-generate-funnel"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" data-testid="loader-generating" />
                    Creating Launch Plan...
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-4 w-4" />
                    Generate Funnel & Launch Plan
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5" data-testid="card-funnel-strategy">
            <CardHeader>
              <CardTitle className="text-2xl" data-testid="heading-strategy">
                {results.funnelStrategy.type}
              </CardTitle>
              <CardDescription className="text-base" data-testid="text-overview">
                {results.funnelStrategy.overview}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" data-testid="badge-conversion">
                <TrendingUp className="h-3 w-3 mr-1" />
                Expected: {results.funnelStrategy.expectedConversion}
              </Badge>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-2xl font-bold mb-4" data-testid="heading-funnel-stages">
              Funnel Stages
            </h2>
            <div className="space-y-4">
              {results.funnelStages.map((stage, index) => (
                <Card key={index} className="hover-elevate" data-testid={`card-stage-${index}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg" data-testid={`stage-name-${index}`}>
                          {stage.stage}
                        </CardTitle>
                        <CardDescription data-testid={`objective-${index}`}>
                          {stage.objective}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" data-testid={`metrics-${index}`}>
                        {stage.metrics}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h4 className="font-semibold text-sm mb-2">Tactics:</h4>
                    <ul className="space-y-1" data-testid={`tactics-${index}`}>
                      {stage.tactics.map((tactic, tIndex) => (
                        <li key={tIndex} className="text-sm flex items-start gap-2">
                          <Target className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>{tactic}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4" data-testid="heading-launch-roadmap">
              {results.launchRoadmap.length}-Day Launch Roadmap
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {results.launchRoadmap.map((day, index) => (
                <Card key={index} className="hover-elevate" data-testid={`card-day-${index}`}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" data-testid={`day-number-${index}`}>
                        <Calendar className="h-3 w-3 mr-1" />
                        Day {day.day}
                      </Badge>
                      <CardTitle className="text-base" data-testid={`day-goal-${index}`}>
                        {day.goal}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1" data-testid={`activities-${index}`}>
                      {day.activities.map((activity, aIndex) => (
                        <li key={aIndex} className="text-sm flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>{activity}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4" data-testid="heading-traffic">
              Traffic Strategies
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {results.trafficStrategies.map((strategy, index) => (
                <Card key={index} className="hover-elevate" data-testid={`card-traffic-${index}`}>
                  <CardHeader>
                    <CardTitle className="text-lg" data-testid={`channel-${index}`}>
                      {strategy.channel}
                    </CardTitle>
                    <Badge variant="outline" data-testid={`timeline-${index}`}>
                      <Clock className="h-3 w-3 mr-1" />
                      {strategy.timeline}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground" data-testid={`approach-${index}`}>
                      {strategy.approach}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card data-testid="card-next-steps">
            <CardHeader>
              <CardTitle data-testid="heading-next-steps">Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2" data-testid="list-next-steps">
                {results.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start gap-2" data-testid={`next-step-${index}`}>
                    <Rocket className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{step}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
