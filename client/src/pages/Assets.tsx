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

interface PexelsPhoto {
  id: number;
  src: {
    large: string;
    medium: string;
    small: string;
  };
  alt: string;
  photographer: string;
  photographer_url: string;
  width: number;
  height: number;
}

interface PixabayPhoto {
  id: number;
  largeImageURL: string;
  webformatURL: string;
  previewURL: string;
  tags: string;
  user: string;
  pageURL: string;
  imageWidth: number;
  imageHeight: number;
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
  const [photoQuery, setPhotoQuery] = useState("");
  const [photoSearchQuery, setPhotoSearchQuery] = useState("");
  const [photoSource, setPhotoSource] = useState<"pexels" | "pixabay">("pexels");

  const { data: assets = [], isLoading } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

  const { data: pexelsResults, isLoading: isSearchingPexels } = useQuery({
    queryKey: ["/api/pexels/search", photoSearchQuery],
    enabled: !!photoSearchQuery && photoSource === "pexels",
    queryFn: async () => {
      const response = await fetch(
        `/api/pexels/search?query=${encodeURIComponent(photoSearchQuery)}&per_page=12`
      );
      if (!response.ok) throw new Error("Failed to search Pexels");
      return response.json();
    },
  });

  const { data: pixabayResults, isLoading: isSearchingPixabay } = useQuery({
    queryKey: ["/api/pixabay/search", photoSearchQuery],
    enabled: !!photoSearchQuery && photoSource === "pixabay",
    queryFn: async () => {
      const response = await fetch(
        `/api/pixabay/search?query=${encodeURIComponent(photoSearchQuery)}&per_page=12`
      );
      if (!response.ok) throw new Error("Failed to search Pixabay");
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

  const importPexelsMutation = useMutation({
    mutationFn: async (photo: PexelsPhoto) => {
      const response = await apiRequest("POST", "/api/pexels/import", {
        pexelsId: photo.id,
        url: photo.src.large,
        width: photo.width,
        height: photo.height,
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url,
        alt: photo.alt,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      toast({
        title: "Image imported",
        description: "The free stock image has been added to your library.",
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

  const importPixabayMutation = useMutation({
    mutationFn: async (photo: PixabayPhoto) => {
      const response = await apiRequest("POST", "/api/pixabay/import", {
        pixabayId: photo.id,
        url: photo.largeImageURL,
        width: photo.imageWidth,
        height: photo.imageHeight,
        user: photo.user,
        userUrl: photo.pageURL,
        tags: photo.tags,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      toast({
        title: "Image imported",
        description: "The free stock image has been added to your library.",
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

  const handlePhotoSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (photoQuery.trim()) {
      setPhotoSearchQuery(photoQuery.trim());
    }
  };

  const filteredAssets = assets.filter(
    (asset) =>
      asset.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isSearchingPhotos = isSearchingPexels || isSearchingPixabay;

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
                Search for 100% free stock photos (commercial use, no attribution required)
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="photos" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="photos" data-testid="tab-photos">
                  Free Stock Photos
                </TabsTrigger>
                <TabsTrigger value="upload" data-testid="tab-upload">
                  Upload File
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="photos" className="space-y-4 mt-4">
                <div className="flex gap-2">
                  <select
                    value={photoSource}
                    onChange={(e) => setPhotoSource(e.target.value as "pexels" | "pixabay")}
                    className="border rounded-md px-3 py-2 bg-background"
                    data-testid="select-photo-source"
                  >
                    <option value="pexels">Pexels</option>
                    <option value="pixabay">Pixabay</option>
                  </select>
                  <form onSubmit={handlePhotoSearch} className="flex gap-2 flex-1">
                    <Input
                      placeholder="Search for images (e.g., 'workspace', 'nature', 'technology')"
                      value={photoQuery}
                      onChange={(e) => setPhotoQuery(e.target.value)}
                      data-testid="input-photo-search"
                    />
                    <Button type="submit" data-testid="button-search-photos">
                      <Search className="h-4 w-4" />
                    </Button>
                  </form>
                </div>

                <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  ✓ 100% free for commercial use • No attribution required • CC0 License
                </div>

                {isSearchingPhotos && (
                  <div className="text-center py-12 text-muted-foreground">
                    Searching {photoSource === "pexels" ? "Pexels" : "Pixabay"}...
                  </div>
                )}

                {photoSource === "pexels" && pexelsResults && pexelsResults.photos && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {pexelsResults.photos.map((photo: PexelsPhoto) => (
                      <div key={photo.id} className="group relative aspect-video rounded-lg overflow-hidden bg-muted">
                        <img
                          src={photo.src.medium}
                          alt={photo.alt || "Free stock photo"}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 p-2">
                          <Button
                            size="sm"
                            onClick={() => importPexelsMutation.mutate(photo)}
                            disabled={importPexelsMutation.isPending}
                            data-testid={`button-import-pexels-${photo.id}`}
                          >
                            <Download className="mr-2 h-3 w-3" />
                            Import
                          </Button>
                          <a
                            href={photo.photographer_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-white mt-2 flex items-center gap-1 hover:underline"
                          >
                            by {photo.photographer}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {photoSource === "pixabay" && pixabayResults && pixabayResults.hits && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {pixabayResults.hits.map((photo: PixabayPhoto) => (
                      <div key={photo.id} className="group relative aspect-video rounded-lg overflow-hidden bg-muted">
                        <img
                          src={photo.webformatURL}
                          alt={photo.tags || "Free stock photo"}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 p-2">
                          <Button
                            size="sm"
                            onClick={() => importPixabayMutation.mutate(photo)}
                            disabled={importPixabayMutation.isPending}
                            data-testid={`button-import-pixabay-${photo.id}`}
                          >
                            <Download className="mr-2 h-3 w-3" />
                            Import
                          </Button>
                          <a
                            href={photo.pageURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-white mt-2 flex items-center gap-1 hover:underline"
                          >
                            by {photo.user}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {pexelsResults && pexelsResults.photos?.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No images found. Try a different search term.
                  </div>
                )}

                {pixabayResults && pixabayResults.hits?.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No images found. Try a different search term.
                  </div>
                )}

                {!photoSearchQuery && !isSearchingPhotos && (
                  <div className="text-center py-12 space-y-2">
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Search for high-quality free stock photos from {photoSource === "pexels" ? "Pexels" : "Pixabay"}
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
                  : "Import your first free stock photo to get started"}
              </p>
            </div>
            {!searchQuery && (
              <Button onClick={() => setUploadDialogOpen(true)}>
                <ImageIcon className="mr-2 h-4 w-4" />
                Add Your First Asset
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
                {asset.metadata && typeof asset.metadata === 'object' && 'source' in asset.metadata && (
                  <Badge variant="outline" className="text-xs">
                    {asset.metadata.source === 'pexels' && '📸 Pexels'}
                    {asset.metadata.source === 'pixabay' && '🖼️ Pixabay'}
                  </Badge>
                )}
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
