import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Search, Image as ImageIcon, Check, Link as LinkIcon, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
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

interface AssetPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (asset: { url: string; alt?: string; source?: string }) => void;
  title?: string;
  description?: string;
}

export function AssetPicker({
  open,
  onOpenChange,
  onSelect,
  title = "Select Image",
  description = "Choose an image from your library or search free stock photos",
}: AssetPickerProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [photoQuery, setPhotoQuery] = useState("");
  const [photoSearchQuery, setPhotoSearchQuery] = useState("");
  const [photoSource, setPhotoSource] = useState<"pexels" | "pixabay" | "all">("all");
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageName, setImageName] = useState("");

  const { data: assets = [] } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
    enabled: open,
  });

  const { data: stockResults, isLoading: isSearchingPhotos } = useQuery({
    queryKey: ["/api/images/search", photoSearchQuery, photoSource],
    enabled: !!photoSearchQuery && open,
    queryFn: async () => {
      const response = await fetch(
        `/api/images/search?query=${encodeURIComponent(photoSearchQuery)}&source=${photoSource}&perPage=12`
      );
      if (!response.ok) throw new Error("Failed to search stock photos");
      return response.json();
    },
  });

  const filteredAssets = assets.filter(
    (asset) =>
      asset.type === "image" &&
      (asset.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        searchQuery === "")
  );

  const handleSelectLibraryAsset = (asset: Asset) => {
    onSelect({
      url: asset.url,
      alt: asset.filename,
      source: "library",
    });
    onOpenChange(false);
  };

  const handleSelectStockImage = (image: any) => {
    onSelect({
      url: image.url,
      alt: image.alt || image.tags || "Stock photo",
      source: image.source,
    });
    onOpenChange(false);
  };

  const handlePhotoSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (photoQuery.trim()) {
      setPhotoSearchQuery(photoQuery.trim());
    }
  };

  const uploadUrlMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/assets", {
        type: "image",
        url: imageUrl,
        filename: imageName || "Uploaded image",
        metadata: { source: "url_upload" },
      });
      return await response.json();
    },
    onSuccess: (asset) => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      toast({
        title: "Image added",
        description: "Your image has been added to the library",
      });
      onSelect({
        url: asset.url,
        alt: asset.filename,
        source: "library",
      });
      setImageUrl("");
      setImageName("");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add image",
        variant: "destructive",
      });
    },
  });

  const handleUrlUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      toast({
        title: "URL required",
        description: "Please enter an image URL",
        variant: "destructive",
      });
      return;
    }
    uploadUrlMutation.mutate();
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="library" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="library" data-testid="tab-library">
              My Library ({assets.filter(a => a.type === "image").length})
            </TabsTrigger>
            <TabsTrigger value="url" data-testid="tab-url-upload">
              <Upload className="h-3 w-3 mr-1" />
              Add by URL
            </TabsTrigger>
            <TabsTrigger value="stock" data-testid="tab-stock-photos">
              Free Stock Photos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="flex-1 flex flex-col overflow-hidden space-y-4 mt-4">
            <Input
              placeholder="Search your images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-library-search"
            />

            <div className="flex-1 overflow-y-auto">
              {filteredAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mb-2" />
                  <p className="text-sm">
                    {searchQuery ? "No images match your search" : "No images in your library"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {filteredAssets.map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => handleSelectLibraryAsset(asset)}
                      className="group relative aspect-video rounded-lg overflow-hidden bg-muted hover:ring-2 hover:ring-primary transition-all"
                      data-testid={`button-select-asset-${asset.id}`}
                    >
                      <img
                        src={asset.url}
                        alt={asset.filename}
                        className="w-full h-full object-cover"
                      />
                      {selectedAsset === asset.id && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="bg-primary text-primary-foreground rounded-full p-1">
                            <Check className="h-4 w-4" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="url" className="flex-1 flex flex-col overflow-hidden space-y-4 mt-4">
            <form onSubmit={handleUrlUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image-url">Image URL *</Label>
                <Input
                  id="image-url"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  data-testid="input-image-url"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Paste a direct link to an image (JPG, PNG, GIF, WebP)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image-name">Image Name (Optional)</Label>
                <Input
                  id="image-name"
                  type="text"
                  placeholder="e.g., Product photo, Hero banner"
                  value={imageName}
                  onChange={(e) => setImageName(e.target.value)}
                  data-testid="input-image-name"
                />
              </div>

              {imageUrl && (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <p className="text-sm font-medium mb-2">Preview:</p>
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={uploadUrlMutation.isPending || !imageUrl}
                data-testid="button-add-by-url"
              >
                {uploadUrlMutation.isPending ? (
                  <>Adding to library...</>
                ) : (
                  <>
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Add to Library
                  </>
                )}
              </Button>

              <div className="text-xs text-muted-foreground bg-blue-500/10 border border-blue-500/20 p-3 rounded">
                <p className="font-medium mb-1">💡 Tip: Where to find image URLs</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Right-click any web image → "Copy image address"</li>
                  <li>Use free stock sites like Unsplash, Pexels, or Pixabay</li>
                  <li>Upload to Imgur or similar hosting services</li>
                </ul>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="stock" className="flex-1 flex flex-col overflow-hidden space-y-4 mt-4">
            <div className="flex gap-2">
              <select
                value={photoSource}
                onChange={(e) => setPhotoSource(e.target.value as "pexels" | "pixabay" | "all")}
                className="border rounded-md px-3 py-2 bg-background"
                data-testid="select-photo-source-picker"
              >
                <option value="all">All Sources</option>
                <option value="pexels">Pexels</option>
                <option value="pixabay">Pixabay</option>
              </select>
              <form onSubmit={handlePhotoSearch} className="flex gap-2 flex-1">
                <Input
                  placeholder="Search for images (e.g., 'workspace', 'nature')"
                  value={photoQuery}
                  onChange={(e) => setPhotoQuery(e.target.value)}
                  data-testid="input-stock-search"
                />
                <Button type="submit" data-testid="button-search-stock" disabled={isSearchingPhotos}>
                  <Search className="h-4 w-4" />
                </Button>
              </form>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              ✓ 100% free for commercial use • No attribution required • CC0 License
            </div>

            <div className="flex-1 overflow-y-auto">
              {isSearchingPhotos && (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Searching stock photos...
                </div>
              )}

              {stockResults && stockResults.images && stockResults.images.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {stockResults.images.map((image: any) => (
                    <button
                      key={`${image.source}-${image.id}`}
                      onClick={() => handleSelectStockImage(image)}
                      className="group relative aspect-video rounded-lg overflow-hidden bg-muted hover:ring-2 hover:ring-primary transition-all"
                      data-testid={`button-select-stock-${image.id}`}
                    >
                      <img
                        src={image.thumbnail}
                        alt={image.alt || "Stock photo"}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-xs text-white truncate">
                          {image.attribution || `from ${image.source}`}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {stockResults && stockResults.images?.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mb-2" />
                  <p className="text-sm">No images found. Try a different search.</p>
                </div>
              )}

              {!photoSearchQuery && !isSearchingPhotos && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mb-2" />
                  <p className="text-sm">Search for high-quality free stock photos</p>
                  <p className="text-xs mt-1">Try: workspace, nature, business, technology</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
