/**
 * Canvas AI Assistant
 * Floating AI helper for the visual editor
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sparkles,
  Wand2,
  AlignCenter,
  Grid3x3,
  Palette,
  FileText,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { useEditorStore } from '@/stores/editorStore';
import { useToast } from '@/hooks/use-toast';
import {
  generateLayoutFromPrompt,
  autoNameLayers,
  autoAlignLayers,
  analyzeDesign,
  suggestColorPalette,
  describeLayout,
  distributeLayersEvenly,
} from '@/utils/aiMock';

export function CanvasAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'analyze' | 'actions'>('generate');

  const { layers, selectedLayerIds, addLayer, updateLayerBatch, saveHistory } = useEditorStore();
  const { toast } = useToast();

  const selectedLayers = layers.filter(l => selectedLayerIds.includes(l.id));

  // Generate layout from prompt
  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const newLayers = await generateLayoutFromPrompt(prompt);
      
      newLayers.forEach(layer => addLayer(layer));
      
      toast({
        title: 'Layout generated',
        description: `Created ${newLayers.length} layers from your prompt.`,
      });
      
      setPrompt('');
    } catch (error) {
      toast({
        title: 'Generation failed',
        description: 'Please try a different prompt.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-name all layers
  const handleAutoName = async () => {
    setLoading(true);
    try {
      const renames = await autoNameLayers(layers);
      
      const updates = renames.map(r => ({
        id: r.id,
        updates: { name: r.name },
      }));
      
      updateLayerBatch(updates);
      saveHistory();
      
      toast({
        title: 'Layers renamed',
        description: `${renames.length} layers automatically named.`,
      });
    } catch (error) {
      toast({
        title: 'Naming failed',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-align layers
  const handleAutoAlign = async () => {
    if (layers.length === 0) return;

    setLoading(true);
    try {
      const alignments = await autoAlignLayers(layers);
      
      updateLayerBatch(alignments);
      saveHistory();
      
      toast({
        title: 'Layout aligned',
        description: 'All layers snapped to grid.',
      });
    } catch (error) {
      toast({
        title: 'Alignment failed',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Distribute evenly
  const handleDistribute = async (direction: 'horizontal' | 'vertical') => {
    if (selectedLayers.length < 2) {
      toast({
        title: 'Select 2+ layers',
        description: 'Select multiple layers to distribute.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const updates = await distributeLayersEvenly(selectedLayers, direction);
      
      updateLayerBatch(updates);
      saveHistory();
      
      toast({
        title: 'Layers distributed',
        description: `Evenly spaced ${direction}ly.`,
      });
    } catch (error) {
      toast({
        title: 'Distribution failed',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Analyze design
  const handleAnalyze = async () => {
    if (layers.length === 0) return;

    setLoading(true);
    try {
      const analysis = await analyzeDesign(layers);
      
      toast({
        title: `Design Score: ${analysis.score}/100`,
        description: analysis.issues.length === 0 
          ? 'Your design looks great!' 
          : `Found ${analysis.issues.length} potential issues.`,
      });
    } catch (error) {
      toast({
        title: 'Analysis failed',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Describe layout
  const handleDescribe = async () => {
    if (layers.length === 0) return;

    setLoading(true);
    try {
      const description = await describeLayout(layers);
      
      toast({
        title: 'Layout Description',
        description,
      });
    } catch (error) {
      toast({
        title: 'Description failed',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group hover:scale-110"
        title="Open AI Assistant (Ctrl+K)"
      >
        <Sparkles className="h-6 w-6 group-hover:rotate-12 transition-transform" />
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 bg-background border rounded-xl shadow-2xl transition-all duration-300 ${
        isMinimized ? 'w-80' : 'w-96'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">Smart canvas helper</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8"
          >
            {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <div className="max-h-[600px] flex flex-col">
          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('generate')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'generate'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Generate
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'actions'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Actions
            </button>
            <button
              onClick={() => setActiveTab('analyze')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'analyze'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Analyze
            </button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Generate Tab */}
              {activeTab === 'generate' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Describe what you want to create</label>
                    <Input
                      placeholder="e.g., Create a pricing section with 3 cards..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                    />
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={loading || !prompt.trim()}
                    className="w-full"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="mr-2 h-4 w-4" />
                    )}
                    {loading ? 'Generating...' : 'Generate Layout'}
                  </Button>

                  <Separator />

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Quick Templates:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPrompt('Create a hero section')}
                        className="justify-start text-xs"
                      >
                        Hero Section
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPrompt('Create pricing cards')}
                        className="justify-start text-xs"
                      >
                        Pricing Cards
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPrompt('Create testimonials')}
                        className="justify-start text-xs"
                      >
                        Testimonials
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPrompt('Create feature cards')}
                        className="justify-start text-xs"
                      >
                        Features
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {/* Actions Tab */}
              {activeTab === 'actions' && (
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleAutoAlign}
                    disabled={loading || layers.length === 0}
                  >
                    <Grid3x3 className="mr-2 h-4 w-4" />
                    Auto-Align to Grid
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleAutoName}
                    disabled={loading || layers.length === 0}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Auto-Name Layers
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleDistribute('horizontal')}
                    disabled={loading || selectedLayers.length < 2}
                  >
                    <AlignCenter className="mr-2 h-4 w-4" />
                    Distribute Horizontally
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleDistribute('vertical')}
                    disabled={loading || selectedLayers.length < 2}
                  >
                    <AlignCenter className="mr-2 h-4 w-4 rotate-90" />
                    Distribute Vertically
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleDescribe}
                    disabled={loading || layers.length === 0}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Describe Layout
                  </Button>

                  <Separator />

                  <div className="text-xs text-muted-foreground">
                    {selectedLayers.length > 0 ? (
                      <p>{selectedLayers.length} layer{selectedLayers.length > 1 ? 's' : ''} selected</p>
                    ) : (
                      <p>Select layers to enable more actions</p>
                    )}
                  </div>
                </div>
              )}

              {/* Analyze Tab */}
              {activeTab === 'analyze' && (
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleAnalyze}
                    disabled={loading || layers.length === 0}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analyze Design
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    disabled={loading}
                  >
                    <Palette className="mr-2 h-4 w-4" />
                    Suggest Colors
                  </Button>

                  <Separator />

                  <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Layers</span>
                      <Badge variant="secondary">{layers.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Selected</span>
                      <Badge variant="secondary">{selectedLayers.length}</Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

