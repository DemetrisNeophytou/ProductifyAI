import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Image, Download, Plus, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MediaAsset {
  id: string;
  projectId?: string;
  url: string;
  type: string;
  prompt: string;
  license: string;
  attribution?: string;
  metadata?: {
    width?: number;
    height?: number;
    format?: string;
    size?: number;
  };
  createdAt: string;
}

const MediaGallery = () => {
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const { toast } = useToast();

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5050";

  // Fetch media assets
  const fetchMediaAssets = async () => {
    setLoading(true);
    try {
      const url = selectedProject 
        ? `${API_BASE}/api/media?projectId=${selectedProject}`
        : `${API_BASE}/api/media`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.ok) {
        setMediaAssets(data.data || []);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch media assets",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch media assets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate new media
  const generateMedia = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a prompt",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch(`${API_BASE}/api/media/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          projectId: selectedProject || null,
          type: "image",
          style: "realistic",
          size: "square"
        }),
      });
      
      const data = await response.json();
      
      if (data.ok) {
        setPrompt("");
        await fetchMediaAssets(); // Refresh the list
        toast({
          title: "Media Generated!",
          description: "Image created successfully",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to generate media",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate media",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  // Insert media into project
  const insertIntoProject = async (mediaId: string) => {
    if (!selectedProject) {
      toast({
        title: "Error",
        description: "Please select a project first",
        variant: "destructive",
      });
      return;
    }

    try {
      // This would integrate with the project editor
      toast({
        title: "Media Inserted!",
        description: `Media ${mediaId} inserted into project ${selectedProject}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to insert media into project",
        variant: "destructive",
      });
    }
  };

  // Download media
  const downloadMedia = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download media",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchMediaAssets();
  }, [selectedProject]);

  // Filter media assets
  const filteredAssets = mediaAssets.filter(asset => {
    const matchesSearch = asset.prompt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || asset.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Media Gallery</h1>
          <p className="text-muted-foreground">
            Generate and manage AI-created media assets
          </p>
        </div>
        <Button onClick={fetchMediaAssets} variant="outline">
          <Image className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Generate New Media */}
      <Card>
        <CardHeader>
          <CardTitle>Generate New Media</CardTitle>
          <CardDescription>
            Create AI-generated images and media assets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="project-select">Project (optional)</Label>
              <select
                id="project-select"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
              >
                <option value="">No project selected</option>
                <option value="proj_1234567890_abc123">Sample Project 1</option>
                <option value="proj_0987654321_xyz789">Sample Project 2</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="prompt">Image Prompt *</Label>
              <Input
                id="prompt"
                placeholder="e.g., Professional business meeting, modern office setting"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <Button 
              onClick={generateMedia} 
              disabled={generating || !prompt.trim()} 
              className="w-full"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Generate Media
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by prompt..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Label htmlFor="filter-type">Type</Label>
              <select
                id="filter-type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="audio">Audio</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Media Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAssets.map((asset) => (
            <Card key={asset.id} className="overflow-hidden">
              <div className="aspect-square relative">
                <img
                  src={asset.url}
                  alt={asset.prompt}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => downloadMedia(asset.url, `media-${asset.id}.jpg`)}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  {selectedProject && (
                    <Button
                      size="sm"
                      onClick={() => insertIntoProject(asset.id)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {asset.prompt}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="capitalize">{asset.type}</span>
                  {asset.metadata && (
                    <span>
                      {asset.metadata.width}x{asset.metadata.height}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(asset.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredAssets.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Image className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No media found</h3>
            <p className="text-muted-foreground text-center">
              {searchTerm || filterType !== "all" 
                ? "Try adjusting your search or filters"
                : "Generate your first media asset using the form above"
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MediaGallery;