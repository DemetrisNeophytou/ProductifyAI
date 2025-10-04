import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp, Loader2 } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string;
  rating: number;
  content: string;
  revenueGenerated?: number;
  productType?: string;
  featured: number;
}

export default function SuccessStories() {
  const { data: testimonials, isLoading } = useQuery<Testimonial[]>({
    queryKey: ['/api/testimonials'],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" data-testid="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4" data-testid="heading-success-stories">
          Success Stories
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          See how creators are building €100k+ businesses with Productify AI
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials && testimonials.length > 0 ? (
          testimonials.map((testimonial: any) => (
            <Card key={testimonial.id} className="hover-elevate" data-testid={`card-testimonial-${testimonial.id}`}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4 mb-4">
                  <Avatar data-testid={`avatar-${testimonial.id}`}>
                    <AvatarImage src={testimonial.avatarUrl} alt={testimonial.name} />
                    <AvatarFallback>{testimonial.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold" data-testid={`name-${testimonial.id}`}>{testimonial.name}</p>
                    {testimonial.role && (
                      <p className="text-sm text-muted-foreground" data-testid={`role-${testimonial.id}`}>
                        {testimonial.role}
                      </p>
                    )}
                  </div>
                  {testimonial.featured === 1 && (
                    <Badge variant="default" data-testid={`badge-featured-${testimonial.id}`}>Featured</Badge>
                  )}
                </div>

                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>

                <p className="text-sm mb-4" data-testid={`content-${testimonial.id}`}>
                  {testimonial.content}
                </p>

                {testimonial.revenueGenerated && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-3 border-t">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span data-testid={`revenue-${testimonial.id}`}>
                      €{(testimonial.revenueGenerated / 100).toLocaleString()} generated
                    </span>
                  </div>
                )}

                {testimonial.productType && (
                  <Badge variant="secondary" className="mt-2" data-testid={`product-type-${testimonial.id}`}>
                    {testimonial.productType}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground" data-testid="text-no-testimonials">
              No success stories yet. Be the first to share yours!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
