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

interface UnsplashPhoto {
  id: string;
  urls: {
    regular: string;
    small: string;
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
  description = "Choose an image from your library or search Unsplash",
}: AssetPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [unsplashQuery, setUnsplashQuery] = useState("");
  const [unsplashSearchQuery, setUnsplashSearchQuery] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  const { data: assets = [] } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
    enabled: open,
  });

  const { data: unsplashResults, isLoading: isSearchingUnsplash } = useQuery({
    queryKey: ["/api/unsplash/search", unsplashSearchQuery],
    enabled: !!unsplashSearchQuery && open,
    queryFn: async () => {
      const response = await fetch(
        `/api/unsplash/search?query=${encodeURIComponent(unsplashSearchQuery)}&per_page=12`
      );
      if (!response.ok) throw new Error("Failed to search Unsplash");
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

  const handleSelectUnsplashImage = (photo: UnsplashPhoto) => {
    onSelect({
      url: photo.urls.regular,
      alt: photo.alt_description || `Photo by ${photo.user.name}`,
      source: "unsplash",
    });
    onOpenChange(false);
  };

  const handleUnsplashSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (unsplashQuery.trim()) {
      setUnsplashSearchQuery(unsplashQuery.trim());
    }
  };

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
            <TabsTrigger value="unsplash" data-testid="tab-unsplash-picker">
              Unsplash
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="flex-1 flex flex-col overflow-hidden space-y-4 mt-4">
            <Input
              placeholder="Search your images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-library"
              className="w-full"
            />

            <div className="flex-1 overflow-y-auto">
              {filteredAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? "No images match your search"
                      : "No images in your library yet"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {filteredAssets.map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => handleSelectLibraryAsset(asset)}
                      className="relative aspect-video rounded-lg overflow-hidden bg-muted hover-elevate active-elevate-2 group"
                      data-testid={`button-select-asset-${asset.id}`}
                    >
                      <img
                        src={asset.url}
                        alt={asset.filename}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Check className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {asset.metadata && typeof asset.metadata === 'object' && 'unsplash' in asset.metadata && (
                        <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
                          Unsplash
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="unsplash" className="flex-1 flex flex-col overflow-hidden space-y-4 mt-4">
            <form onSubmit={handleUnsplashSearch} className="flex gap-2">
              <Input
                placeholder="Search Unsplash..."
                value={unsplashQuery}
                onChange={(e) => setUnsplashQuery(e.target.value)}
                data-testid="input-search-unsplash-picker"
              />
              <Button type="submit" data-testid="button-search-unsplash-picker">
                <Search className="h-4 w-4" />
              </Button>
            </form>

            <div className="flex-1 overflow-y-auto">
              {isSearchingUnsplash && (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Searching...
                </div>
              )}

              {unsplashResults && unsplashResults.results && (
                <div className="grid grid-cols-3 gap-3">
                  {unsplashResults.results.map((photo: UnsplashPhoto) => (
                    <button
                      key={photo.id}
                      onClick={() => handleSelectUnsplashImage(photo)}
                      className="relative aspect-video rounded-lg overflow-hidden bg-muted hover-elevate active-elevate-2 group"
                      data-testid={`button-select-unsplash-${photo.id}`}
                    >
                      <img
                        src={photo.urls.small}
                        alt={photo.alt_description || "Unsplash image"}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Check className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!unsplashSearchQuery && !isSearchingUnsplash && (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Search for stock images
                    </p>
                  </div>
                </div>
              )}

              {unsplashResults && unsplashResults.results?.length === 0 && (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No results found
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
