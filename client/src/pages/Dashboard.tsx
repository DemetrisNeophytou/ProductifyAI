import { StatsCard } from "@/components/StatsCard";
import { ProductCard } from "@/components/ProductCard";
import { Sparkles, Download, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Dashboard() {
  const mockProducts = [
    { id: "1", title: "Marketing Email Template", type: "Email", createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    { id: "2", title: "Product Launch Blog Post", type: "Blog", createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) },
    { id: "3", title: "Social Media Graphics Pack", type: "Graphics", createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Welcome back!</h1>
          <p className="text-muted-foreground">Here's what's happening with your products today</p>
        </div>
        <Link href="/create">
          <Button data-testid="button-create-new">
            <Sparkles className="h-4 w-4 mr-2" />
            Create New Product
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          icon={Sparkles}
          label="Products Created"
          value="24"
          trend="+12% from last month"
        />
        <StatsCard
          icon={Download}
          label="Downloads"
          value="156"
          trend="+23% from last month"
        />
        <StatsCard
          icon={HardDrive}
          label="Storage Used"
          value="2.4 GB"
          trend="68% of 5 GB limit"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Recent Products</h2>
          <Link href="/products">
            <a className="text-sm text-primary hover:underline" data-testid="link-view-all">
              View all
            </a>
          </Link>
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
    </div>
  );
}
