import { useEffect } from "react";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import type { Project } from "@shared/schema";

export default function Products() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: products = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/projects/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete product.",
        variant: "destructive",
      });
    },
  });

  if (authLoading || !isAuthenticated) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">My Products</h1>
        <p className="text-muted-foreground">Manage and organize your AI-generated products</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-10"
            data-testid="input-search-products"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading products...</p>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No products found. Create your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              title={product.title}
              type={product.type}
              createdAt={new Date(product.createdAt!)}
              onEdit={() => window.location.href = `/projects/${product.id}`}
              onDownload={() => {
                toast({
                  title: "Export",
                  description: "Open project to export as PDF/DOCX",
                });
              }}
              onDelete={() => deleteMutation.mutate(product.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
