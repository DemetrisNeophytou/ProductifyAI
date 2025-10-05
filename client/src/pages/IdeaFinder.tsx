import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lightbulb, ArrowRight, TrendingUp, DollarSign, Zap, Users, RefreshCw, Share2, ChevronDown, Sparkles, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Niche {
  id?: string;
  title: string;
  description: string;
  painScore: number;
  moneyScore: number;
  speedScore: number;
  competitionLevel: 'low' | 'medium' | 'high';
  suggestedOffer: string;
}

interface FormData {
  interests: string;
  timeAvailable: string;
  audienceType: string;
  experienceLevel: string;
}

export default function IdeaFinder() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Form state - conversational approach
  const [step, setStep] = useState<'interests' | 'time' | 'audience' | 'experience' | 'results'>('interests');
  const [formData, setFormData] = useState<FormData>({
    interests: '',
    timeAvailable: '',
    audienceType: '',
    experienceLevel: '',
  });
  
  // Results state
  const [niches, setNiches] = useState<Niche[]>([]);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  
  // Filter/sort state
  const [sortBy, setSortBy] = useState<'total' | 'pain' | 'money' | 'speed'>('total');
  const [filterBy, setFilterBy] = useState<'all' | 'high-profit' | 'low-competition' | 'fast-launch'>('all');
  
  // Analyzer state (bonus feature)
  const [analyzerMode, setAnalyzerMode] = useState(false);
  const [analyzerInput, setAnalyzerInput] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);

  const handleGenerateNiches = async () => {
    if (!formData.interests || !formData.timeAvailable || !formData.audienceType || !formData.experienceLevel) {
      toast({
        title: "Incomplete Information",
        description: "Please complete all questions first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setStreamingContent('');
    setNiches([]);

    try {
      const response = await fetch('/api/niches/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate niches');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                setIsGenerating(false);
                break;
              }
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullContent += parsed.content;
                  setStreamingContent(fullContent);
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      // Parse final JSON from streamed content
      try {
        const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          if (result.niches) {
            setNiches(result.niches);
            setAiInsights(result.aiInsights || '');
            setStep('results');
            toast({
              title: "Niches Generated!",
              description: `Found ${result.niches.length} profitable niche ideas for you.`,
            });
          }
        }
      } catch (parseError) {
        console.error('Parse error:', parseError);
      }
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate niches. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setStreamingContent('');
    }
  };

  const handleAnalyzeNiche = async () => {
    if (!analyzerInput.trim()) return;

    try {
      const response = await fetch('/api/niches/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nicheIdea: analyzerInput }),
      });

      const result = await response.json();
      if (result.ok && result.analysis) {
        setAnalysis(result.analysis);
        toast({
          title: "Analysis Complete!",
          description: "Your niche has been analyzed.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze niche.",
        variant: "destructive",
      });
    }
  };

  const getFilteredAndSortedNiches = () => {
    let filtered = [...niches];

    // Apply filters
    if (filterBy === 'high-profit') {
      filtered = filtered.filter(n => n.moneyScore >= 8);
    } else if (filterBy === 'low-competition') {
      filtered = filtered.filter(n => n.competitionLevel === 'low');
    } else if (filterBy === 'fast-launch') {
      filtered = filtered.filter(n => n.speedScore >= 8);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'total') {
        return (b.painScore + b.moneyScore + b.speedScore) - (a.painScore + a.moneyScore + a.speedScore);
      } else if (sortBy === 'pain') {
        return b.painScore - a.painScore;
      } else if (sortBy === 'money') {
        return b.moneyScore - a.moneyScore;
      } else {
        return b.speedScore - a.speedScore;
      }
    });

    return filtered;
  };

  const handleNavigateToOutline = (niche: Niche) => {
    // Store selected niche in localStorage for outline builder
    localStorage.setItem('selected-niche', JSON.stringify(niche));
    navigate('/builders/outline');
  };

  const handleShareResults = () => {
    const text = niches.map(n => 
      `${n.title}\n${n.description}\nScores: Pain ${n.painScore}/10, Money ${n.moneyScore}/10, Speed ${n.speedScore}/10\nSuggested: ${n.suggestedOffer}\n`
    ).join('\n---\n');
    
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard!",
      description: "Your niche results have been copied.",
    });
  };

  const getCompetitionColor = (level: string) => {
    if (level === 'low') return 'text-green-600 dark:text-green-400';
    if (level === 'medium') return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 dark:text-green-400';
    if (score >= 6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-medium text-muted-foreground" data-testid="text-step-label">
              Step 1 of 5: Find Your Niche
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold" data-testid="heading-idea-finder">
                AI Niche Finder
              </h1>
            </div>
          </div>
          <Badge variant="secondary" data-testid="badge-progress">40% Complete</Badge>
        </div>
        <Progress value={40} className="h-2" data-testid="progress-bar" />
      </div>

      {/* Main Content Tabs */}
      <Tabs value={analyzerMode ? 'analyzer' : 'finder'} onValueChange={(v) => setAnalyzerMode(v === 'analyzer')}>
        <TabsList className="mb-6" data-testid="tabs-mode">
          <TabsTrigger value="finder" data-testid="tab-finder">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Ideas
          </TabsTrigger>
          <TabsTrigger value="analyzer" data-testid="tab-analyzer">
            <Target className="h-4 w-4 mr-2" />
            Analyze My Idea
          </TabsTrigger>
        </TabsList>

        {/* Niche Generator */}
        <TabsContent value="finder" className="space-y-6">
          {step !== 'results' ? (
            <Card data-testid="card-conversation">
              <CardHeader>
                <CardTitle data-testid="heading-conversation">
                  Let's Find Your Perfect Niche
                </CardTitle>
                <CardDescription data-testid="text-conversation-desc">
                  Answer a few questions and I'll find profitable niches tailored to you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 1: Interests */}
                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2" data-testid="label-interests">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Hey! Tell me about your skills and interests
                  </label>
                  <Input
                    value={formData.interests}
                    onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                    placeholder="E.g., fitness, productivity, design, coding, cooking..."
                    onKeyDown={(e) => e.key === 'Enter' && formData.interests && setStep('time')}
                    data-testid="input-interests"
                  />
                </div>

                {/* Step 2: Time (only show if interests filled) */}
                {formData.interests && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium" data-testid="label-time">
                      Great! How many hours a week can you put into this?
                    </label>
                    <Select value={formData.timeAvailable} onValueChange={(v) => setFormData({ ...formData, timeAvailable: v })}>
                      <SelectTrigger data-testid="select-time">
                        <SelectValue placeholder="Choose your availability" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5-10 hours" data-testid="option-time-5-10">5-10 hours (Part-time hustle)</SelectItem>
                        <SelectItem value="10-20 hours" data-testid="option-time-10-20">10-20 hours (Serious side project)</SelectItem>
                        <SelectItem value="20+ hours" data-testid="option-time-20plus">20+ hours (Full-time commitment)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Step 3: Audience (only show if time filled) */}
                {formData.timeAvailable && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium" data-testid="label-audience">
                      Perfect! Who do you want to help most?
                    </label>
                    <Select value={formData.audienceType} onValueChange={(v) => setFormData({ ...formData, audienceType: v })}>
                      <SelectTrigger data-testid="select-audience">
                        <SelectValue placeholder="Select your target audience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="B2C" data-testid="option-audience-b2c">Consumers (B2C) - Individuals & hobbyists</SelectItem>
                        <SelectItem value="B2B" data-testid="option-audience-b2b">Businesses (B2B) - Professionals & companies</SelectItem>
                        <SelectItem value="Both" data-testid="option-audience-both">Both B2B and B2C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Step 4: Experience (only show if audience filled) */}
                {formData.audienceType && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium" data-testid="label-experience">
                      Last question: What's your experience level?
                    </label>
                    <Select value={formData.experienceLevel} onValueChange={(v) => setFormData({ ...formData, experienceLevel: v })}>
                      <SelectTrigger data-testid="select-experience">
                        <SelectValue placeholder="Your experience creating products" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Complete beginner" data-testid="option-exp-beginner">Complete Beginner (Never created anything)</SelectItem>
                        <SelectItem value="Some experience" data-testid="option-exp-some">Some Experience (Created 1-2 products)</SelectItem>
                        <SelectItem value="Experienced" data-testid="option-exp-experienced">Experienced (Created 3+ products)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Generate Button */}
                {formData.experienceLevel && (
                  <Button
                    onClick={handleGenerateNiches}
                    disabled={isGenerating}
                    size="lg"
                    className="w-full"
                    data-testid="button-generate"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Finding Your Perfect Niches...
                      </>
                    ) : (
                      <>
                        <Lightbulb className="mr-2 h-4 w-4" />
                        Find My Perfect Niches
                      </>
                    )}
                  </Button>
                )}

                {/* Streaming indicator */}
                {isGenerating && streamingContent && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground animate-pulse" data-testid="text-streaming">
                      AI is analyzing profitable niches for you...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            /* Results View */
            <div className="space-y-6">
              {/* Filter and Sort Controls */}
              <Card data-testid="card-controls">
                <CardContent className="pt-6">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Filter:</label>
                      <Select value={filterBy} onValueChange={(v: any) => setFilterBy(v)}>
                        <SelectTrigger className="w-[180px]" data-testid="select-filter">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Niches</SelectItem>
                          <SelectItem value="high-profit">High Profit</SelectItem>
                          <SelectItem value="low-competition">Low Competition</SelectItem>
                          <SelectItem value="fast-launch">Fast Launch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Sort by:</label>
                      <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                        <SelectTrigger className="w-[150px]" data-testid="select-sort">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="total">Total Score</SelectItem>
                          <SelectItem value="pain">Pain Level</SelectItem>
                          <SelectItem value="money">Money Potential</SelectItem>
                          <SelectItem value="speed">Speed to Market</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="ml-auto flex gap-2">
                      <Button variant="outline" onClick={() => { setStep('interests'); setNiches([]); }} data-testid="button-regenerate">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate
                      </Button>
                      <Button variant="outline" onClick={handleShareResults} data-testid="button-share">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Results
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Niche Cards */}
              <div className="grid gap-6 md:grid-cols-2">
                {getFilteredAndSortedNiches().map((niche, idx) => {
                  const totalScore = niche.painScore + niche.moneyScore + niche.speedScore;
                  return (
                    <Card key={idx} className="hover-elevate" data-testid={`card-niche-${idx}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-2" data-testid={`heading-niche-${idx}`}>
                              {niche.title}
                            </CardTitle>
                            <CardDescription data-testid={`text-niche-desc-${idx}`}>
                              {niche.description}
                            </CardDescription>
                          </div>
                          <Badge variant="secondary" data-testid={`badge-score-${idx}`}>
                            {totalScore}/30
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Scores Grid */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center" data-testid={`score-pain-${idx}`}>
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <TrendingUp className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Pain</span>
                            </div>
                            <div className={`text-2xl font-bold ${getScoreColor(niche.painScore)}`}>
                              {niche.painScore}
                            </div>
                          </div>
                          
                          <div className="text-center" data-testid={`score-money-${idx}`}>
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Money</span>
                            </div>
                            <div className={`text-2xl font-bold ${getScoreColor(niche.moneyScore)}`}>
                              {niche.moneyScore}
                            </div>
                          </div>
                          
                          <div className="text-center" data-testid={`score-speed-${idx}`}>
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Zap className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Speed</span>
                            </div>
                            <div className={`text-2xl font-bold ${getScoreColor(niche.speedScore)}`}>
                              {niche.speedScore}
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Competition & Offer */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Competition:</span>
                            <span className={`text-sm font-medium capitalize ${getCompetitionColor(niche.competitionLevel)}`} data-testid={`text-competition-${idx}`}>
                              {niche.competitionLevel}
                            </span>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm font-medium text-primary" data-testid={`text-offer-${idx}`}>
                              {niche.suggestedOffer}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button 
                            onClick={() => handleNavigateToOutline(niche)} 
                            className="flex-1"
                            data-testid={`button-outline-${idx}`}
                          >
                            Generate Outline
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* AI Insights Section */}
              {aiInsights && (
                <Card className="border-primary/20" data-testid="card-ai-insights">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2" data-testid="heading-ai-insights">
                      <Sparkles className="h-5 w-5 text-primary" />
                      AI Insights for Better Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed" data-testid="text-ai-insights">
                      {aiInsights}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Niche Analyzer Tab */}
        <TabsContent value="analyzer" className="space-y-6">
          <Card data-testid="card-analyzer">
            <CardHeader>
              <CardTitle data-testid="heading-analyzer">Analyze Your Own Niche Idea</CardTitle>
              <CardDescription data-testid="text-analyzer-desc">
                Have an idea already? Let AI analyze it and give you a detailed score
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={analyzerInput}
                onChange={(e) => setAnalyzerInput(e.target.value)}
                placeholder="E.g., Meal prep guides for busy professionals..."
                data-testid="input-analyzer"
              />
              <Button onClick={handleAnalyzeNiche} disabled={!analyzerInput.trim()} data-testid="button-analyze">
                <Target className="h-4 w-4 mr-2" />
                Analyze This Niche
              </Button>

              {analysis && (
                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card data-testid="card-analysis-pain">
                      <CardContent className="pt-6 text-center">
                        <div className="text-3xl font-bold mb-1">{analysis.painScore}</div>
                        <div className="text-sm text-muted-foreground">Pain Score</div>
                      </CardContent>
                    </Card>
                    <Card data-testid="card-analysis-money">
                      <CardContent className="pt-6 text-center">
                        <div className="text-3xl font-bold mb-1">{analysis.moneyScore}</div>
                        <div className="text-sm text-muted-foreground">Money Score</div>
                      </CardContent>
                    </Card>
                    <Card data-testid="card-analysis-speed">
                      <CardContent className="pt-6 text-center">
                        <div className="text-3xl font-bold mb-1">{analysis.speedScore}</div>
                        <div className="text-sm text-muted-foreground">Speed Score</div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card data-testid="card-analysis-details">
                    <CardContent className="pt-6 space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Strengths:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {analysis.strengths?.map((s: string, i: number) => (
                            <li key={i} className="text-sm text-muted-foreground">{s}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Weaknesses:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {analysis.weaknesses?.map((w: string, i: number) => (
                            <li key={i} className="text-sm text-muted-foreground">{w}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">AI Verdict:</h4>
                        <p className="text-sm text-muted-foreground">{analysis.verdict}</p>
                      </div>
                      <div className="p-4 bg-primary/10 rounded-lg">
                        <h4 className="font-medium mb-2">Suggestions:</h4>
                        <p className="text-sm">{analysis.suggestions}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
