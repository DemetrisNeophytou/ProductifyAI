import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Video, Search, Plus, Play, Trash2, Download, Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface VideoClip {
  id: string | number;
  url: string;
  thumbnail: string;
  duration: number;
  source: string;
}

interface VideoProject {
  id: string;
  title: string;
  prompt: string;
  clips: VideoClip[];
  captions: string[];
  status: string;
  duration: number;
  outputUrl?: string;
  createdAt: string;
}

export default function VideoBuilder() {
  const [prompt, setPrompt] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClips, setSelectedClips] = useState<VideoClip[]>([]);
  const [projectTitle, setProjectTitle] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  // Fetch user credits
  const { data: creditInfo } = useQuery<{ credits: number }>({
    queryKey: ['/api/ai-agents/credits'],
  });

  // Search clips
  const { data: searchResults, refetch: searchClips, isLoading: isSearching } = useQuery({
    queryKey: ['/api/video-builder/search-clips', searchQuery],
    queryFn: async () => {
      if (!searchQuery) return { clips: [] };
      const response = await fetch(`/api/video-builder/search-clips?query=${encodeURIComponent(searchQuery)}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to search clips');
      }
      return response.json();
    },
    enabled: false,
  });

  // Fetch user's video projects
  const { data: projects = [] } = useQuery<VideoProject[]>({
    queryKey: ['/api/video-builder/projects'],
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/video-builder/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: projectTitle || 'Untitled Video',
          prompt,
          clips: selectedClips,
          captions: [],
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create project');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/video-builder/projects'] });
      setShowCreateDialog(false);
      setPrompt('');
      setSelectedClips([]);
      setProjectTitle('');
      toast({
        title: 'Project Created',
        description: 'Your video project has been saved.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create project',
        variant: 'destructive',
      });
    },
  });

  // Render video mutation
  const renderMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const response = await fetch(`/api/video-builder/projects/${projectId}/render`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to render video');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/video-builder/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ai-agents/credits'] });
      toast({
        title: 'Rendering Started',
        description: 'Your video is being rendered. This may take a few minutes.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to render video',
        variant: 'destructive',
      });
    },
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast({
        title: 'Search Query Required',
        description: 'Please enter a search query to find video clips',
        variant: 'destructive',
      });
      return;
    }
    searchClips();
  };

  const handleAddClip = (clip: VideoClip) => {
    if (!selectedClips.find(c => c.id === clip.id)) {
      setSelectedClips([...selectedClips, clip]);
      toast({
        title: 'Clip Added',
        description: 'Video clip added to your project',
      });
    }
  };

  const handleRemoveClip = (clipId: string | number) => {
    setSelectedClips(selectedClips.filter(c => c.id !== clipId));
  };

  const totalDuration = selectedClips.reduce((sum, clip) => sum + (clip.duration || 5), 0);

  return (
    <div className="h-full flex flex-col p-6 gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3" data-testid="text-page-title">
            <Video className="w-8 h-8" />
            Video Builder
          </h1>
          <p className="text-muted-foreground">Create professional videos from clips</p>
        </div>
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-yellow-500" />
          <span className="text-lg font-semibold" data-testid="text-credits">
            {creditInfo?.credits || 0} credits
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Left: Clip Search */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Search Clips</CardTitle>
            <CardDescription>Find video clips from Pexels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="e.g., beach sunset, city traffic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                data-testid="input-search-clips"
              />
              <Button onClick={handleSearch} disabled={isSearching} data-testid="button-search">
                <Search className="w-4 h-4" />
              </Button>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {searchResults?.clips?.map((clip: VideoClip) => (
                  <Card key={clip.id} className="overflow-hidden" data-testid={`clip-${clip.id}`}>
                    <img src={clip.thumbnail} alt="Clip thumbnail" className="w-full h-32 object-cover" />
                    <div className="p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline">{clip.duration}s</Badge>
                        <Button
                          size="sm"
                          onClick={() => handleAddClip(clip)}
                          data-testid={`button-add-clip-${clip.id}`}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Middle: Timeline/Storyboard */}
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader>
            <CardTitle>Your Storyboard</CardTitle>
            <CardDescription>
              {selectedClips.length} clips • {Math.floor(totalDuration)}s total
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4">
            <Textarea
              placeholder="Describe your video concept..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              data-testid="input-prompt"
            />

            <ScrollArea className="flex-1">
              <div className="space-y-3">
                {selectedClips.map((clip, index) => (
                  <Card key={clip.id} className="overflow-hidden" data-testid={`selected-clip-${index}`}>
                    <div className="flex items-center gap-3 p-3">
                      <Badge variant="secondary">{index + 1}</Badge>
                      <img src={clip.thumbnail} alt="Clip" className="w-20 h-12 object-cover rounded" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{clip.duration}s</div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveClip(clip.id)}
                        data-testid={`button-remove-clip-${index}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button
                  className="w-full"
                  disabled={selectedClips.length === 0}
                  data-testid="button-create-project"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Video Project</DialogTitle>
                  <DialogDescription>
                    Give your video project a name
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Input
                    placeholder="Project title"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    data-testid="input-project-title"
                  />
                  <Button
                    onClick={() => createProjectMutation.mutate()}
                    disabled={createProjectMutation.isPending}
                    className="w-full"
                    data-testid="button-save-project"
                  >
                    Save Project
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Right: Projects */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Your Projects</CardTitle>
            <CardDescription>Manage your video projects</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {projects.map((project) => (
                  <Card key={project.id} data-testid={`project-${project.id}`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{project.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{project.prompt}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Video className="w-4 h-4" />
                        {project.clips?.length || 0} clips • {Math.floor(project.duration)}s
                      </div>
                      <Badge variant={
                        project.status === 'completed' ? 'default' :
                        project.status === 'rendering' ? 'secondary' : 'outline'
                      }>
                        {project.status}
                      </Badge>
                      
                      <div className="flex gap-2 pt-2">
                        {project.status === 'draft' && (
                          <Button
                            size="sm"
                            onClick={() => renderMutation.mutate(project.id)}
                            disabled={renderMutation.isPending}
                            data-testid={`button-render-${project.id}`}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Render (50 credits)
                          </Button>
                        )}
                        {project.status === 'completed' && project.outputUrl && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={project.outputUrl} download>
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {projects.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No projects yet. Create your first video!
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
