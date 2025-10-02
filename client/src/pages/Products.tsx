import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

export default function Products() {
  const mockProducts = [
    { id: "1", title: "Marketing Email Template", type: "Email", createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    { id: "2", title: "Product Launch Blog Post", type: "Blog", createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) },
    { id: "3", title: "Social Media Graphics Pack", type: "Graphics", createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
    { id: "4", title: "Landing Page Copy", type: "Marketing", createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { id: "5", title: "Newsletter Template", type: "Email", createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    { id: "6", title: "Product Description Set", type: "Content", createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
  ];

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
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]" data-testid="select-filter-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="blog">Blog</SelectItem>
            <SelectItem value="graphics">Graphics</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="recent">
          <SelectTrigger className="w-[180px]" data-testid="select-sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="name">Name A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockProducts.map((product) => (
          <ProductCard
            key={product.id}
            {...product}
            onEdit={() => console.log("Edit", product.id)}
            onDownload={() => console.log("Download", product.id)}
            onDelete={() => console.log("Delete", product.id)}
          />
        ))}
      </div>
    </div>
  );
}
