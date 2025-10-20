/**
 * KB Editor Modal
 * Rich editor for creating/updating KB documents
 */

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, X, Plus } from 'lucide-react';

interface KBDocument {
  id?: string;
  title: string;
  topic: string;
  tags: string[];
  content: string;
  source?: string;
}

interface KBEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: KBDocument | null;
  onSave: () => void;
}

export function KBEditorModal({ open, onOpenChange, document, onSave }: KBEditorModalProps) {
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [content, setContent] = useState('');
  const { toast } = useToast();

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5050';
  const isEditing = !!document?.id;

  // Fetch document details if editing
  const { data: docData } = useQuery({
    queryKey: ['/api/kb', document?.id],
    queryFn: async () => {
      if (!document?.id) return null;
      const response = await fetch(`${API_BASE}/api/kb/${document.id}`);
      return response.json();
    },
    enabled: isEditing && open,
  });

  // Reset form when modal opens/closes or document changes
  useEffect(() => {
    if (open) {
      if (isEditing && docData?.data) {
        const doc = docData.data;
        setTitle(doc.title || '');
        setTopic(doc.topic || '');
        setTags(doc.tags || []);
        setContent(doc.content || '');
      } else if (!isEditing) {
        // New document
        setTitle('');
        setTopic('');
        setTags([]);
        setContent('');
      }
    }
  }, [open, isEditing, docData]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { title, topic, tags, content };
      const url = isEditing
        ? `${API_BASE}/api/kb/${document!.id}`
        : `${API_BASE}/api/kb`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save document');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: isEditing ? 'Document updated' : 'Document created',
        description: 'KB document saved successfully.',
      });
      onSave();
    },
    onError: (error: any) => {
      toast({
        title: 'Save failed',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !topic.trim() || !content.trim()) {
      toast({
        title: 'Validation error',
        description: 'Title, topic, and content are required.',
        variant: 'destructive',
      });
      return;
    }

    saveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit KB Document' : 'Create KB Document'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the knowledge base document and embeddings.'
              : 'Create a new expert knowledge document for the AI.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Pricing Strategies for Digital Products"
              required
            />
          </div>

          {/* Topic */}
          <div className="space-y-2">
            <Label htmlFor="topic">Topic *</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Pricing, Marketing, Product Development"
              required
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tag and press Enter"
              />
              <Button type="button" onClick={handleAddTag} variant="secondary">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="pl-3 pr-1">
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-1 p-0"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Content (Markdown) */}
          <div className="space-y-2">
            <Label htmlFor="content">Content (Markdown) *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="# Your Expert Content&#10;&#10;Write your knowledge base content in Markdown format...&#10;&#10;## Section 1&#10;Content here...&#10;&#10;## Section 2&#10;More content..."
              className="min-h-[400px] font-mono text-sm"
              required
            />
            <p className="text-xs text-muted-foreground">
              Write in Markdown. Use ## for sections, - for lists, **bold**, *italic*, etc.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saveMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditing ? 'Update' : 'Create'} Document
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

