import { ProductTypeCard } from "../ProductTypeCard";
import { FileText } from "lucide-react";

export default function ProductTypeCardExample() {
  return (
    <div className="p-8">
      <ProductTypeCard
        icon={FileText}
        title="Text Content"
        description="Generate blog posts, articles, and written content"
        gradient="bg-gradient-to-br from-primary to-primary/70"
        onClick={() => console.log("Text Content clicked")}
      />
    </div>
  );
}
