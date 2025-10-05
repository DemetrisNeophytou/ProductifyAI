import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Search, Image as ImageIcon, Check } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [photoQuery, setPhotoQuery] = useState("");
  const [photoSearchQuery, setPhotoSearchQuery] = useState("");
  const [photoSource, setPhotoSource] = useState<"pexels" | "pixabay">("pexels");
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  const { data: assets = [] } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
    enabled: open,
  });

  const { data: pexelsResults, isLoading: isSearchingPexels } = useQuery({
    queryKey: ["/api/pexels/search", photoSearchQuery],
    enabled: !!photoSearchQuery && photoSource === "pexels" && open,
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
    enabled: !!photoSearchQuery && photoSource === "pixabay" && open,
    queryFn: async () => {
      const response = await fetch(
        `/api/pixabay/search?query=${encodeURIComponent(photoSearchQuery)}&per_page=12`
      );
      if (!response.ok) throw new Error("Failed to search Pixabay");
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

  const handleSelectPexelsImage = (photo: PexelsPhoto) => {
    onSelect({
      url: photo.src.large,
      alt: photo.alt || `Photo by ${photo.photographer}`,
      source: "pexels",
    });
    onOpenChange(false);
  };

  const handleSelectPixabayImage = (photo: PixabayPhoto) => {
    onSelect({
      url: photo.largeImageURL,
      alt: photo.tags || `Photo by ${photo.user}`,
      source: "pixabay",
    });
    onOpenChange(false);
  };

  const handlePhotoSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (photoQuery.trim()) {
      setPhotoSearchQuery(photoQuery.trim());
    }
  };

  const isSearchingPhotos = isSearchingPexels || isSearchingPixabay;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="library" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="library" data-testid="tab-library">
              My Library ({assets.filter(a => a.type === "image").length})
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

          <TabsContent value="stock" className="flex-1 flex flex-col overflow-hidden space-y-4 mt-4">
            <div className="flex gap-2">
              <select
                value={photoSource}
                onChange={(e) => setPhotoSource(e.target.value as "pexels" | "pixabay")}
                className="border rounded-md px-3 py-2 bg-background"
                data-testid="select-photo-source-picker"
              >
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
                <Button type="submit" data-testid="button-search-stock">
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
                  Searching {photoSource === "pexels" ? "Pexels" : "Pixabay"}...
                </div>
              )}

              {photoSource === "pexels" && pexelsResults && pexelsResults.photos && (
                <div className="grid grid-cols-3 gap-3">
                  {pexelsResults.photos.map((photo: PexelsPhoto) => (
                    <button
                      key={photo.id}
                      onClick={() => handleSelectPexelsImage(photo)}
                      className="group relative aspect-video rounded-lg overflow-hidden bg-muted hover:ring-2 hover:ring-primary transition-all"
                      data-testid={`button-select-pexels-${photo.id}`}
                    >
                      <img
                        src={photo.src.medium}
                        alt={photo.alt || "Stock photo"}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-xs text-white truncate">
                          by {photo.photographer}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {photoSource === "pixabay" && pixabayResults && pixabayResults.hits && (
                <div className="grid grid-cols-3 gap-3">
                  {pixabayResults.hits.map((photo: PixabayPhoto) => (
                    <button
                      key={photo.id}
                      onClick={() => handleSelectPixabayImage(photo)}
                      className="group relative aspect-video rounded-lg overflow-hidden bg-muted hover:ring-2 hover:ring-primary transition-all"
                      data-testid={`button-select-pixabay-${photo.id}`}
                    >
                      <img
                        src={photo.webformatURL}
                        alt={photo.tags || "Stock photo"}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-xs text-white truncate">
                          by {photo.user}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {pexelsResults && pexelsResults.photos?.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mb-2" />
                  <p className="text-sm">No images found. Try a different search.</p>
                </div>
              )}

              {pixabayResults && pixabayResults.hits?.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mb-2" />
                  <p className="text-sm">No images found. Try a different search.</p>
                </div>
              )}

              {!photoSearchQuery && !isSearchingPhotos && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mb-2" />
                  <p className="text-sm">Search for high-quality free stock photos from {photoSource === "pexels" ? "Pexels" : "Pixabay"}</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
