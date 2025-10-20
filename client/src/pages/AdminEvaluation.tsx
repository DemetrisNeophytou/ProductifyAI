/**
 * Admin Evaluation Dashboard
 * View and run AI quality benchmarks
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Clock,
  Play,
  RefreshCw,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EvaluationResult {
  questionId: string;
  category: string;
  question: string;
  response: string;
  scores: {
    grounding: number;
    structure: number;
    completeness: number;
    length: number;
    overall: number;
  };
  topics_found: string[];
  checklist_items_found: number;
  word_count: number;
  timestamp: string;
}

interface EvaluationReport {
  runId: string;
  timestamp: string;
  totalQuestions: number;
  results: EvaluationResult[];
  summary: {
    averageGrounding: number;
    averageStructure: number;
    averageCompleteness: number;
    averageLength: number;
    overallScore: number;
  };
  categoryBreakdown: Record<string, {
    count: number;
    averageScore: number;
  }>;
}

export default function AdminEvaluation() {
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState<EvaluationResult | null>(null);
  const { toast } = useToast();

  // Load existing report on mount
  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      const response = await fetch('/eval/evalReport.json');
      if (response.ok) {
        const data = await response.json();
        setReport(data);
      }
    } catch (error) {
      console.log('No existing report found');
    }
  };

  const runEvaluation = async () => {
    setLoading(true);
    try {
      // TODO: Call actual eval API
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: 'Evaluation complete',
        description: 'All benchmark questions have been evaluated.',
      });
      
      await loadReport();
    } catch (error) {
      toast({
        title: 'Evaluation failed',
        description: 'Please check the console for errors.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">AI Evaluation Suite</h1>
          <p className="text-muted-foreground mt-2">
            Measure AI chat quality against benchmark questions
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={loadReport}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={runEvaluation} disabled={loading}>
            {loading ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run Evaluation
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Overall Scores */}
      {report && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Overall Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-bold ${getScoreColor(report.summary.overallScore)}`}>
                  {report.summary.overallScore}
                  <span className="text-2xl text-muted-foreground">/100</span>
                </div>
                <Progress value={report.summary.overallScore} className="mt-3" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Grounding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${getScoreColor(report.summary.averageGrounding)}`}>
                  {report.summary.averageGrounding}%
                </div>
                <p className="text-xs text-muted-foreground mt-2">Citation accuracy</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Structure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${getScoreColor(report.summary.averageStructure)}`}>
                  {report.summary.averageStructure}%
                </div>
                <p className="text-xs text-muted-foreground mt-2">Lists & formatting</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completeness
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${getScoreColor(report.summary.averageCompleteness)}`}>
                  {report.summary.averageCompleteness}%
                </div>
                <p className="text-xs text-muted-foreground mt-2">Topic coverage</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{report.totalQuestions}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Run: {new Date(report.timestamp).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
              <CardDescription>Score breakdown by question category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(report.categoryBreakdown).map(([category, data]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{category}</span>
                      <Badge variant={getScoreBadge(data.averageScore)}>
                        {data.averageScore}/100
                      </Badge>
                    </div>
                    <Progress value={data.averageScore} />
                    <p className="text-xs text-muted-foreground">
                      {data.count} question{data.count > 1 ? 's' : ''}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Results</CardTitle>
              <CardDescription>Individual question performance</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">All Questions</TabsTrigger>
                  <TabsTrigger value="low">Low Scores (&lt;60)</TabsTrigger>
                  <TabsTrigger value="high">High Scores (≥80)</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-4">
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Question</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-center">Overall</TableHead>
                          <TableHead className="text-center">Grounding</TableHead>
                          <TableHead className="text-center">Structure</TableHead>
                          <TableHead className="text-center">Complete</TableHead>
                          <TableHead className="text-right">Words</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.results.map((result) => (
                          <TableRow
                            key={result.questionId}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setSelectedResult(result)}
                          >
                            <TableCell className="font-medium max-w-md truncate">
                              {result.question}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{result.category}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={getScoreBadge(result.scores.overall)}>
                                {result.scores.overall}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {result.scores.grounding}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {result.scores.structure}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {result.scores.completeness}
                            </TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">
                              {result.word_count}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="low">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {report.results
                        .filter(r => r.scores.overall < 60)
                        .map(result => (
                          <div
                            key={result.questionId}
                            className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                            onClick={() => setSelectedResult(result)}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <p className="font-medium">{result.question}</p>
                              <Badge variant="destructive">{result.scores.overall}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Issues: Low grounding ({result.scores.grounding}%), 
                              needs better structure
                            </p>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="high">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {report.results
                        .filter(r => r.scores.overall >= 80)
                        .map(result => (
                          <div
                            key={result.questionId}
                            className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                            onClick={() => setSelectedResult(result)}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <p className="font-medium">{result.question}</p>
                              <Badge>{result.scores.overall}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Excellent: {result.checklist_items_found} checklist items, 
                              {result.topics_found.length} topics covered
                            </p>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Selected Response Detail */}
          {selectedResult && (
            <Card>
              <CardHeader>
                <CardTitle>Response Detail</CardTitle>
                <CardDescription>{selectedResult.question}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{selectedResult.scores.grounding}</div>
                    <div className="text-xs text-muted-foreground">Grounding</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{selectedResult.scores.structure}</div>
                    <div className="text-xs text-muted-foreground">Structure</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{selectedResult.scores.completeness}</div>
                    <div className="text-xs text-muted-foreground">Completeness</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{selectedResult.word_count}</div>
                    <div className="text-xs text-muted-foreground">Words</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">AI Response:</h4>
                  <ScrollArea className="h-64 border rounded-lg p-4 bg-muted/20">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {selectedResult.response.split('\n').map((line, i) => (
                        <p key={i} className="text-sm mb-2">{line}</p>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div className="flex gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Topics Found:</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedResult.topics_found.map(topic => (
                        <Badge key={topic} variant="secondary">{topic}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Checklist Items:</h4>
                    <Badge>{selectedResult.checklist_items_found}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* No Report Yet */}
      {!report && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Evaluation Report</h3>
            <p className="text-muted-foreground mb-6">
              Run the evaluation suite to generate a quality report
            </p>
            <Button onClick={runEvaluation}>
              <Play className="mr-2 h-4 w-4" />
              Run First Evaluation
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

