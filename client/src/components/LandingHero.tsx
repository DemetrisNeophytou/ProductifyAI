import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sparkles, Check } from "lucide-react";
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
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-sm mb-6">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-white">10x Faster Than Gumroad • 90-Second Setup • GPT-5 Powered</span>
        </div>

        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
          The Right Tool<br />
          Changes Everything
        </h1>
        
        <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-4 font-medium">
          ChatGPT is for everyday tasks. Productify AI is a specialized system built exclusively to create €100k+ digital product businesses.
        </p>
        
        <div className="flex items-center justify-center gap-6 mb-8">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">90 Seconds</p>
            <p className="text-sm text-white/70">Productify AI</p>
          </div>
          <div className="text-white/50">vs</div>
          <div className="text-center">
            <p className="text-3xl font-bold text-white/50 line-through">5-10 Hours</p>
            <p className="text-sm text-white/50">Gumroad + Tools</p>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 max-w-2xl mx-auto mb-12">
          <p className="text-lg text-white/90 italic mb-4">
            "Choose the wrong tool and you'll be swimming across the Atlantic.<br />
            Choose the right tool and you'll be in Manhattan before dinner."
          </p>
          <p className="text-sm text-white/70">
            Generic tools give generic results. Specialized tools eliminate the need for expertise entirely.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
          <Link href="/signup">
            <Button size="lg" className="h-14 px-10 text-lg font-semibold" data-testid="button-get-started">
              Start 3-Day Free Trial
            </Button>
          </Link>
          <Link href="/pricing">
            <Button 
              size="lg" 
              variant="outline" 
              className="h-14 px-10 text-lg font-semibold backdrop-blur-sm bg-white/10 border-white/20 text-white hover:bg-white/20" 
              data-testid="button-view-pricing"
            >
              See Plans & Pricing
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
          <div className="flex items-start gap-2 text-white/90">
            <Check className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
            <span className="text-sm">No expertise needed — AI guides you step by step</span>
          </div>
          <div className="flex items-start gap-2 text-white/90">
            <Check className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
            <span className="text-sm">Build finished products, not just ideas</span>
          </div>
          <div className="flex items-start gap-2 text-white/90">
            <Check className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
            <span className="text-sm">Complete roadmap: Idea → Launch → €100k/year</span>
          </div>
        </div>
      </div>
    </div>
  );
}
