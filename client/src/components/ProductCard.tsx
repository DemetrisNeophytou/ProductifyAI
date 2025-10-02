import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Edit, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ProductCardProps {
  id: string;
  title: string;
  type: string;
  createdAt: Date;
  preview?: string;
  onEdit?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
}

export function ProductCard({ id, title, type, createdAt, preview, onEdit, onDownload, onDelete }: ProductCardProps) {
  return (
    <Card className="overflow-hidden hover-elevate transition-all duration-200" data-testid={`card-product-${id}`}>
      <CardHeader className="p-0">
        <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          {preview ? (
            <img src={preview} alt={title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-muted-foreground">Preview</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold truncate flex-1" data-testid={`text-product-title-${id}`}>{title}</h3>
          <Badge variant="outline" className="text-xs">
            {type}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Created {formatDistanceToNow(createdAt, { addSuffix: true })}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center gap-2">
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={onEdit}
          data-testid={`button-edit-${id}`}
          className="flex-1 hover-elevate active-elevate-2"
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={onDownload}
          data-testid={`button-download-${id}`}
          className="flex-1 hover-elevate active-elevate-2"
        >
          <Download className="h-4 w-4 mr-1" />
          Download
        </Button>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={onDelete}
          data-testid={`button-delete-${id}`}
          className="hover-elevate active-elevate-2"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
