import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Loader2, TrendingUp, Users, Target, Search, DollarSign, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const ideaFinderSchema = z.object({
  interests: z.string().min(1, "Please tell us about your interests"),
  timeAvailable: z.string().min(1, "Please select your available time"),
  audienceType: z.string().min(1, "Please select your target audience"),
  experienceLevel: z.string().min(1, "Please select your experience level"),
});

type IdeaFinderForm = z.infer<typeof ideaFinderSchema>;

interface IdeaResult {
  title: string;
  why: string;
  icp: string;
  painPoints: string[];
  proofKeywords: string[];
  revenuePotential: string;
  difficulty: string;
  timeToMarket: string;
}

interface IdeaFinderResponse {
  ideas: IdeaResult[];
  nextSteps: string[];
}

export default function IdeaFinder() {
  const { toast } = useToast();
  const [results, setResults] = useState<IdeaFinderResponse | null>(null);

  const form = useForm<IdeaFinderForm>({
    resolver: zodResolver(ideaFinderSchema),
    defaultValues: {
      interests: "",
      timeAvailable: "",
      audienceType: "",
      experienceLevel: "",
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (data: IdeaFinderForm) => {
      const response = await apiRequest('POST', '/api/builders/idea-finder', data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/builders/idea-finder'] });
      
      // Validate response structure
      if (!data || !data.ideas || !Array.isArray(data.ideas)) {
        toast({
          title: "Invalid Response",
          description: "Received unexpected data format. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      setResults(data);
      toast({
        title: "Ideas Generated!",
        description: `Found ${data.ideas.length} profitable niches for you.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Unable to generate ideas. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: IdeaFinderForm) => {
    generateMutation.mutate(data);
  };

  const getDifficultyColor = (difficulty: string) => {
    if (difficulty.toLowerCase().includes('easy')) return 'bg-green-500';
    if (difficulty.toLowerCase().includes('medium')) return 'bg-yellow-500';
    return 'bg-red-500';
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
          Discover 5 profitable digital product niches validated for €100k+ revenue potential
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="interests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-interests">Your Interests & Experience</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Fitness, marketing, productivity, real estate..."
                        {...field}
                        data-testid="input-interests"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      What topics do you know about or are interested in learning?
                    </p>
                    <FormMessage data-testid="error-interests" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeAvailable"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-time">Available Time Per Week</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-time">
                          <SelectValue placeholder="Select time availability" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1-5 hours" data-testid="option-time-1-5">1-5 hours per week</SelectItem>
                        <SelectItem value="5-10 hours" data-testid="option-time-5-10">5-10 hours per week</SelectItem>
                        <SelectItem value="10-20 hours" data-testid="option-time-10-20">10-20 hours per week</SelectItem>
                        <SelectItem value="20+ hours" data-testid="option-time-20-plus">20+ hours per week (full-time)</SelectItem>
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
                disabled={generateMutation.isPending}
                data-testid="button-generate-ideas"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" data-testid="loader-generating" />
                    Analyzing Profitable Niches...
                  </>
                ) : (
                  <>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Generate 5 Profitable Ideas
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {results && results.ideas && Array.isArray(results.ideas) && results.ideas.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold" data-testid="heading-results">
              Your Profitable Niche Ideas
            </h2>
            <Badge variant="secondary" data-testid="badge-idea-count">
              {results.ideas.length} Ideas Found
            </Badge>
          </div>

          <div className="grid gap-6">
            {results.ideas.map((idea, index) => (
              <Card key={index} className="hover-elevate" data-testid={`card-idea-${index}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2" data-testid={`title-idea-${index}`}>
                        {idea.title}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2">
                        <Badge 
                          className={getDifficultyColor(idea.difficulty)}
                          data-testid={`badge-difficulty-${index}`}
                        >
                          {idea.difficulty}
                        </Badge>
                        <Badge variant="outline" data-testid={`badge-revenue-${index}`}>
                          <DollarSign className="h-3 w-3 mr-1" />
                          {idea.revenuePotential}
                        </Badge>
                        <Badge variant="outline" data-testid={`badge-time-${index}`}>
                          <Clock className="h-3 w-3 mr-1" />
                          {idea.timeToMarket}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-2" data-testid={`heading-why-${index}`}>
                      <TrendingUp className="h-4 w-4" />
                      Why This Works
                    </h4>
                    <p className="text-muted-foreground" data-testid={`text-why-${index}`}>
                      {idea.why}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-2" data-testid={`heading-icp-${index}`}>
                      <Users className="h-4 w-4" />
                      Ideal Customer
                    </h4>
                    <p className="text-muted-foreground" data-testid={`text-icp-${index}`}>
                      {idea.icp}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-2" data-testid={`heading-pain-${index}`}>
                      <Target className="h-4 w-4" />
                      Pain Points Solved
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground" data-testid={`list-pain-${index}`}>
                      {idea.painPoints.map((pain, pIndex) => (
                        <li key={pIndex} data-testid={`pain-${index}-${pIndex}`}>{pain}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-2" data-testid={`heading-keywords-${index}`}>
                      <Search className="h-4 w-4" />
                      Validation Keywords
                    </h4>
                    <div className="flex flex-wrap gap-2" data-testid={`keywords-${index}`}>
                      {idea.proofKeywords.map((keyword, kIndex) => (
                        <Badge key={kIndex} variant="secondary" data-testid={`keyword-${index}-${kIndex}`}>
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2" data-testid={`text-keywords-hint-${index}`}>
                      Search these on Google/Amazon to validate demand
                    </p>
                  </div>

                  <Button className="w-full" variant="outline" data-testid={`button-select-${index}`}>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Use This Idea
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {results.nextSteps && results.nextSteps.length > 0 && (
            <Card data-testid="card-next-steps">
              <CardHeader>
                <CardTitle data-testid="heading-next-steps">Next Steps</CardTitle>
                <CardDescription data-testid="text-next-steps-description">
                  Take these actions to validate and launch your chosen niche
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2" data-testid="list-next-steps">
                  {results.nextSteps.map((step, index) => (
                    <li key={index} className="text-muted-foreground" data-testid={`step-${index}`}>
                      {step}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
