import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Upload, Search, Trash2, Image as ImageIcon, FileText, Video, Music, Download, ExternalLink } from "lucide-react";
import type { Asset } from "@shared/schema";

interface UnsplashPhoto {
  id: string;
  urls: {
    regular: string;
    small: string;
    thumb: string;
  };
  width: number;
  height: number;
  user: {
    name: string;
    links: {
      html: string;
    };
  };
  links: {
    download_location: string;
  };
  alt_description?: string;
}

const getAssetIcon = (type: string) => {
  switch (type) {
    case "image":
      return <ImageIcon className="h-5 w-5" />;
    case "document":
      return <FileText className="h-5 w-5" />;
    case "video":
      return <Video className="h-5 w-5" />;
    case "audio":
      return <Music className="h-5 w-5" />;
    default:
      return <FileText className="h-5 w-5" />;
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

export default function Assets() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [unsplashQuery, setUnsplashQuery] = useState("");
  const [unsplashSearchQuery, setUnsplashSearchQuery] = useState("");

  const { data: assets = [], isLoading } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

  const { data: unsplashResults, isLoading: isSearchingUnsplash } = useQuery({
    queryKey: ["/api/unsplash/search", unsplashSearchQuery],
    enabled: !!unsplashSearchQuery,
    queryFn: async () => {
      const response = await fetch(
        `/api/unsplash/search?query=${encodeURIComponent(unsplashSearchQuery)}&per_page=12`
      );
      if (!response.ok) throw new Error("Failed to search Unsplash");
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (assetId: string) => {
      await apiRequest("DELETE", `/api/assets/${assetId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      toast({
        title: "Asset deleted",
        description: "The asset has been removed from your library.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete asset. Please try again.",
        variant: "destructive",
      });
    },
  });

  const importUnsplashMutation = useMutation({
    mutationFn: async (photo: UnsplashPhoto) => {
      const response = await apiRequest("POST", "/api/unsplash/import", {
        unsplashId: photo.id,
        url: photo.urls.regular,
        width: photo.width,
        height: photo.height,
        photographer: photo.user.name,
        photographerUrl: photo.user.links.html,
        download_location: photo.links.download_location,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      toast({
        title: "Image imported",
        description: "The Unsplash image has been added to your library.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to import image. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUnsplashSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (unsplashQuery.trim()) {
      setUnsplashSearchQuery(unsplashQuery.trim());
    }
  };

  const filteredAssets = assets.filter(
    (asset) =>
      asset.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-muted-foreground">Loading assets...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold" data-testid="heading-assets">
            Asset Library
          </h1>
          <p className="text-muted-foreground mt-2">Manage your images, documents, and media files</p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-asset">
              <ImageIcon className="mr-2 h-4 w-4" />
              Add Asset
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Asset</DialogTitle>
              <DialogDescription>
                Upload your own files or search for stock images from Unsplash
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="unsplash" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="unsplash" data-testid="tab-unsplash">
                  Unsplash Stock Images
                </TabsTrigger>
                <TabsTrigger value="upload" data-testid="tab-upload">
                  Upload File
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="unsplash" className="space-y-4 mt-4">
                <form onSubmit={handleUnsplashSearch} className="flex gap-2">
                  <Input
                    placeholder="Search for images (e.g., 'workspace', 'nature', 'technology')"
                    value={unsplashQuery}
                    onChange={(e) => setUnsplashQuery(e.target.value)}
                    data-testid="input-unsplash-search"
                  />
                  <Button type="submit" data-testid="button-search-unsplash">
                    <Search className="h-4 w-4" />
                  </Button>
                </form>

                {isSearchingUnsplash && (
                  <div className="text-center py-12 text-muted-foreground">
                    Searching Unsplash...
                  </div>
                )}

                {unsplashResults && unsplashResults.results && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {unsplashResults.results.map((photo: UnsplashPhoto) => (
                      <div key={photo.id} className="group relative aspect-video rounded-lg overflow-hidden bg-muted">
                        <img
                          src={photo.urls.small}
                          alt={photo.alt_description || "Unsplash image"}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 p-2">
                          <Button
                            size="sm"
                            onClick={() => importUnsplashMutation.mutate(photo)}
                            disabled={importUnsplashMutation.isPending}
                            data-testid={`button-import-${photo.id}`}
                          >
                            <Download className="mr-2 h-3 w-3" />
                            Import
                          </Button>
                          <a
                            href={photo.user.links.html}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-white mt-2 flex items-center gap-1 hover:underline"
                          >
                            by {photo.user.name}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {unsplashResults && unsplashResults.results?.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No images found. Try a different search term.
                  </div>
                )}

                {!unsplashSearchQuery && !isSearchingUnsplash && (
                  <div className="text-center py-12 space-y-2">
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Search for high-quality stock images from Unsplash
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="upload" className="space-y-4 mt-4">
                <div className="border-2 border-dashed rounded-lg p-12 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drag and drop files here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    (File upload with Replit Object Storage coming soon)
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assets by name or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-assets"
          />
        </div>
      </div>

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">No assets yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery
                  ? "No assets match your search"
                  : "Upload your first asset to get started"}
              </p>
            </div>
            {!searchQuery && (
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Your First Asset
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAssets.map((asset) => (
            <Card key={asset.id} className="group overflow-hidden" data-testid={`card-asset-${asset.id}`}>
              <div className="aspect-video bg-muted flex items-center justify-center relative">
                {asset.type === "image" && asset.url ? (
                  <img
                    src={asset.url}
                    alt={asset.filename}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="text-muted-foreground">{getAssetIcon(asset.type)}</div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => deleteMutation.mutate(asset.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-asset-${asset.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium truncate flex-1" title={asset.filename}>
                    {asset.filename}
                  </p>
                  <Badge variant="secondary" className="shrink-0">
                    {asset.type}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {asset.metadata && typeof asset.metadata === 'object' && 'size' in asset.metadata 
                    ? formatFileSize(asset.metadata.size as number) 
                    : 'Unknown size'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          {filteredAssets.length} {filteredAssets.length === 1 ? "asset" : "assets"}
        </span>
        {searchQuery && <span>• Filtered from {assets.length} total</span>}
      </div>
    </div>
  );
}
