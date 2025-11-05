/**
 * KB Table
 * Table displaying all knowledge base documents with actions
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit, Trash2, RefreshCw, MoreHorizontal, FileText, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface KBDocument {
  id: string;
  title: string;
  topic: string;
  tags: string[];
  source: string;
  updatedAt: string;
  chunkCount: number;
}

interface KBTableProps {
  documents: KBDocument[];
  isLoading: boolean;
  onEdit: (doc: KBDocument) => void;
  onDelete: (id: string) => void;
  onRecompute: (id: string) => void;
}

export function KBTable({ documents, isLoading, onEdit, onDelete, onRecompute }: KBTableProps) {
  if (isLoading) {
    return (
      <Card>
        <div className="p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No KB Documents</h3>
          <p className="text-muted-foreground mb-6">
            Create your first knowledge base document to get started
          </p>
          <Button onClick={() => onEdit({} as KBDocument)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Document
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Topic</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Chunks</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">{doc.title}</TableCell>
              <TableCell>
                <Badge variant="secondary">{doc.topic}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {doc.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {doc.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{doc.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="outline">{doc.chunkCount}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(doc.updatedAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(doc)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onRecompute(doc.id)}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Recompute Embeddings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onDelete(doc.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

