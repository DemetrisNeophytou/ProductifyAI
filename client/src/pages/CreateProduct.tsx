import { useState } from "react";
import { ProductTypeCard } from "@/components/ProductTypeCard";
import { CreateProductForm } from "@/components/CreateProductForm";
import { FileText, Image, Mail, MessageSquare, Code, Palette } from "lucide-react";

const productTypes = [
  {
    icon: FileText,
    title: "Text Content",
    description: "Generate blog posts, articles, and written content",
    gradient: "bg-gradient-to-br from-primary to-primary/70"
  },
  {
    icon: Image,
    title: "Graphics",
    description: "Create stunning visuals and design assets",
    gradient: "bg-gradient-to-br from-chart-2 to-chart-2/70"
  },
  {
    icon: Mail,
    title: "Email Templates",
    description: "Design professional email campaigns",
    gradient: "bg-gradient-to-br from-chart-3 to-chart-3/70"
  },
  {
    icon: MessageSquare,
    title: "Social Media",
    description: "Craft engaging social media posts",
    gradient: "bg-gradient-to-br from-chart-4 to-chart-4/70"
  },
  {
    icon: Code,
    title: "Code Templates",
    description: "Generate code snippets and templates",
    gradient: "bg-gradient-to-br from-chart-5 to-chart-5/70"
  },
  {
    icon: Palette,
    title: "Marketing Copy",
    description: "Write compelling marketing materials",
    gradient: "bg-gradient-to-br from-destructive to-destructive/70"
  }
];

export default function CreateProduct() {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {!selectedType ? (
        <>
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              What would you like to create?
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose a product type to get started with AI-powered generation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {productTypes.map((type) => (
              <ProductTypeCard
                key={type.title}
                {...type}
                onClick={() => setSelectedType(type.title)}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => setSelectedType(null)}
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-back"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-3xl font-bold">Create {selectedType}</h1>
              <p className="text-muted-foreground">Configure your AI-powered product generation</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <CreateProductForm />
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Preview</h3>
              <div className="aspect-video bg-muted rounded-xl flex items-center justify-center border-2 border-dashed">
                <p className="text-muted-foreground">Generated content will appear here</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
