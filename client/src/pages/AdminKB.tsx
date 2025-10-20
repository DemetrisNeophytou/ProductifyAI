/**
 * KB Admin Dashboard
 * Manage knowledge base documents, embeddings, and metadata
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, RefreshCw, Database, FileText, Sparkles } from 'lucide-react';
import { KBTable } from '@/components/admin/KBTable';
import { KBEditorModal } from '@/components/admin/KBEditorModal';
import { useToast } from '@/hooks/use-toast';

interface KBDocument {
  id: string;
  title: string;
  topic: string;
  tags: string[];
  source: string;
  updatedAt: string;
  chunkCount: number;
}

export default function AdminKB() {
  const [searchQuery, setSearchQuery] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<KBDocument | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5050';

  // Fetch KB documents
  const { data: docsData, isLoading } = useQuery({
    queryKey: ['/api/kb'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/kb`);
      return response.json();
    },
  });

  const docs: KBDocument[] = docsData?.data || [];

  // Search documents
  const { data: searchResults } = useQuery({
    queryKey: ['/api/kb/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery) return null;
      const response = await fetch(
        `${API_BASE}/api/kb/search?q=${encodeURIComponent(searchQuery)}`
      );
      return response.json();
    },
    enabled: searchQuery.length > 2,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/api/kb/${id}`, {
        method: 'DELETE',
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Document deleted',
        description: 'KB document and embeddings removed.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/kb'] });
    },
    onError: () => {
      toast({
        title: 'Delete failed',
        description: 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Recompute embeddings mutation
  const recomputeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/api/kb/recompute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Embeddings recomputed',
        description: `Created ${data.chunksCreated} chunks and ${data.embeddingsCreated} embeddings.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/kb'] });
    },
    onError: () => {
      toast({
        title: 'Recompute failed',
        description: 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleEdit = (doc: KBDocument) => {
    setSelectedDoc(doc);
    setEditorOpen(true);
  };

  const handleNew = () => {
    setSelectedDoc(null);
    setEditorOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure? This will delete the document and all embeddings.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleRecompute = (id: string) => {
    if (confirm('Recompute embeddings? This may take a moment.')) {
      recomputeMutation.mutate(id);
    }
  };

  const filteredDocs = searchQuery && searchResults?.data
    ? searchResults.data
    : docs;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold">Knowledge Base Admin</h1>
          <p className="text-muted-foreground">
            Manage AI knowledge documents and embeddings
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/kb'] })}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleNew}>
            <Plus className="mr-2 h-4 w-4" />
            New Document
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{docs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Chunks</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {docs.reduce((sum, doc) => sum + doc.chunkCount, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Topics</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {new Set(docs.map(d => d.topic)).size}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {docs.length > 0
                ? new Date(docs[0].updatedAt).toLocaleDateString()
                : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search documents by title, topic, or content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Documents Table */}
      <KBTable
        documents={filteredDocs}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRecompute={handleRecompute}
      />

      {/* Editor Modal */}
      <KBEditorModal
        open={editorOpen}
        onOpenChange={setEditorOpen}
        document={selectedDoc}
        onSave={() => {
          queryClient.invalidateQueries({ queryKey: ['/api/kb'] });
          setEditorOpen(false);
        }}
      />
    </div>
  );
}

