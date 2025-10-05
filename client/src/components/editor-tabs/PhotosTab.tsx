import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, Loader2 } from "lucide-react";

interface PhotoResult {
  id: string;
  src: string;
  photographer: string;
  url: string;
  alt: string;
  source: "pexels" | "pixabay";
}

interface PhotosTabProps {
  projectId: string;
  onInsert?: (url: string, source: string) => void;
}

export function PhotosTab({ projectId, onInsert }: PhotosTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [orientation, setOrientation] = useState<string>("all");
  const [color, setColor] = useState<string>("all");
  const [currentQuery, setCurrentQuery] = useState("");

  const { data: photos, isLoading } = useQuery<PhotoResult[]>({
    queryKey: ["/api/photos/search", { q: currentQuery, orientation, color }],
    enabled: currentQuery.length > 0,
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setCurrentQuery(searchQuery.trim());
    }
  };

  const handleInsert = (photo: PhotoResult) => {
    if (onInsert) {
      onInsert(photo.src, photo.source);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Search free photos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            data-testid="input-photo-search"
          />
          <Button onClick={handleSearch} size="icon" data-testid="button-search-photos">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Select value={orientation} onValueChange={setOrientation}>
            <SelectTrigger className="flex-1" data-testid="select-orientation">
              <SelectValue placeholder="Orientation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="landscape">Landscape</SelectItem>
              <SelectItem value="portrait">Portrait</SelectItem>
              <SelectItem value="square">Square</SelectItem>
            </SelectContent>
          </Select>

          <Select value={color} onValueChange={setColor}>
            <SelectTrigger className="flex-1" data-testid="select-color">
              <SelectValue placeholder="Color" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Colors</SelectItem>
              <SelectItem value="red">Red</SelectItem>
              <SelectItem value="orange">Orange</SelectItem>
              <SelectItem value="yellow">Yellow</SelectItem>
              <SelectItem value="green">Green</SelectItem>
              <SelectItem value="blue">Blue</SelectItem>
              <SelectItem value="purple">Purple</SelectItem>
              <SelectItem value="black">Black</SelectItem>
              <SelectItem value="white">White</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" className="w-full gap-2" data-testid="button-ai-generate-image">
          <Sparkles className="h-4 w-4" />
          Generate with AI
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!currentQuery && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Search for free stock photos</p>
            <p className="text-xs mt-1">Powered by Pexels & Pixabay</p>
          </div>
        )}

        {photos && photos.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer hover-elevate border"
                onClick={() => handleInsert(photo)}
                data-testid={`photo-result-${photo.id}`}
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-end">
                  <div className="p-2 w-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Badge variant="secondary" className="text-xs">
                      {photo.source}
                    </Badge>
                    <p className="text-xs text-white mt-1 truncate">{photo.photographer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {photos && photos.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No photos found</p>
            <p className="text-xs mt-1">Try different keywords</p>
          </div>
        )}
      </div>

      <div className="text-xs text-muted-foreground border-t pt-3">
        <p>All images are free for commercial use from Pexels & Pixabay</p>
      </div>
    </div>
  );
}
