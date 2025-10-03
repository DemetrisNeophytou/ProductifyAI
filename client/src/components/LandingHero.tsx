import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sparkles, Play } from "lucide-react";
import heroImage from "@assets/generated_images/AI_hero_background_image_31119e7f.png";

export function LandingHero() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm mb-8">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-white">€100k+ Digital Product Monetization Coach</span>
        </div>

        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 tracking-tight">
          Build Your €100k+<br />Digital Product Business
        </h1>
        
        <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-4">
          Create and sell digital products that generate €100,000+ per year
        </p>
        
        <p className="text-lg text-white/80 max-w-2xl mx-auto mb-12">
          No experience needed. Our AI Monetization Coach guides you step-by-step from idea to launch, with proven pricing strategies and sales systems.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <Link href="/signup">
            <Button size="lg" className="h-12 px-8 text-base" data-testid="button-get-started">
              Start 3-Day Free Trial
            </Button>
          </Link>
          <Link href="/pricing">
            <Button 
              size="lg" 
              variant="outline" 
              className="h-12 px-8 text-base backdrop-blur-sm bg-white/10 border-white/20 text-white hover:bg-white/20" 
              data-testid="button-view-pricing"
            >
              View Pricing
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-center gap-2 text-white/70">
          <span className="text-sm">3-Day Free Trial</span>
          <span className="text-white/40">•</span>
          <span className="text-sm">No Credit Card Required</span>
          <span className="text-white/40">•</span>
          <span className="text-sm">Cancel Anytime</span>
        </div>
      </div>
    </div>
  );
}
