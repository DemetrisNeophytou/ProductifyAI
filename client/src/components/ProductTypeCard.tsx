import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface ProductTypeCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
  onClick?: () => void;
}

export function ProductTypeCard({ icon: Icon, title, description, gradient, onClick }: ProductTypeCardProps) {
  return (
    <Card 
      className="p-6 hover-elevate active-elevate-2 cursor-pointer transition-all duration-200 group"
      onClick={onClick}
      data-testid={`card-product-type-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className={`h-16 w-16 rounded-xl ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        <Icon className="h-8 w-8 text-white" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Card>
  );
}
