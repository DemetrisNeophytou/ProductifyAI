import { Target, Rocket, DollarSign, Users, BookOpen, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Target,
    title: "Idea Validation",
    description: "AI finds 5 profitable niches with proven buyer demand. No guessing. Data-backed opportunities only.",
    outcome: "€10k-€100k revenue potential per niche"
  },
  {
    icon: BookOpen,
    title: "Product Builder",
    description: "Step-by-step AI guidance to create complete digital products (eBooks, courses, templates) without expertise.",
    outcome: "Ready-to-sell products in days, not months"
  },
  {
    icon: DollarSign,
    title: "Monetization System",
    description: "AI designs your pricing strategy, irresistible offers, bonuses, and upsells that maximize revenue.",
    outcome: "€47-€497 products optimized for profit"
  },
  {
    icon: Rocket,
    title: "Launch Planner",
    description: "Complete execution roadmap from product → funnel → launch → first sales, even without an audience.",
    outcome: "€10k-€50k in first 30 days"
  },
  {
    icon: TrendingUp,
    title: "Sales Funnels",
    description: "AI builds high-converting funnels with sales pages, email sequences, and upsell paths.",
    outcome: "Automated systems that sell 24/7"
  },
  {
    icon: Users,
    title: "No-Audience Growth",
    description: "Proven strategies to get sales without existing followers (SEO, paid ads, partnerships, communities).",
    outcome: "Start earning from day one"
  }
];

export function FeatureSection() {
  return (
    <section className="py-24 px-6 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <span className="text-sm font-semibold text-primary">Why Specialized Tools Win</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Basic AI Gives Advice.<br />
            Productify AI Builds Your Business.
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Every feature is designed for one outcome: transform complete beginners into profitable digital product creators
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="p-6 hover-elevate"
              data-testid={`card-feature-${index}`}
            >
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>
              <div className="pt-3 border-t">
                <p className="text-xs font-semibold text-primary">{feature.outcome}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-card border rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">The Specialized Advantage</h3>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div>
                <h4 className="font-semibold text-muted-foreground mb-3">Generic AI Tools:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Gives general advice</li>
                  <li>• You still need to figure out HOW</li>
                  <li>• No execution roadmap</li>
                  <li>• No proven monetization systems</li>
                  <li>• Requires expertise to implement</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-primary mb-3">Productify AI (Specialized):</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Builds complete products for you</li>
                  <li>• Step-by-step execution plans</li>
                  <li>• Day-by-day launch roadmaps</li>
                  <li>• Proven €100k+ monetization systems</li>
                  <li>• No expertise needed — AI does the work</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
