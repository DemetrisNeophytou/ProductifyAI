import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Find Your Profitable Niche",
    description: "AI analyzes your interests and experience, then finds 5 validated niches with €10k-€100k revenue potential. No guessing.",
    outcome: "Data-backed opportunities in 5 minutes"
  },
  {
    number: "02",
    title: "Build Your Product (No Expertise Required)",
    description: "AI guides you step-by-step to create complete digital products. eBooks, courses, templates, memberships — the AI builds it with you.",
    outcome: "Ready-to-sell product in 7-14 days"
  },
  {
    number: "03",
    title: "Design Your Monetization System",
    description: "AI creates your pricing strategy, irresistible offer, bonuses, upsells, and sales funnel. Everything optimized for maximum profit.",
    outcome: "€47-€497 products ready to launch"
  },
  {
    number: "04",
    title: "Launch & Scale to €100k/Year",
    description: "AI gives you a complete launch roadmap: sales pages, email sequences, traffic strategies. Even without an audience, you can start selling.",
    outcome: "€10k-€50k in first 30 days, scale to €100k+"
  }
];

export function HowItWorks() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            From Zero to €100k/Year<br />
            in 4 Steps
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A structured, outcome-driven process. Not vague advice — exact steps to build a profitable digital product business.
          </p>
        </div>

        <div className="space-y-8">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="relative"
              data-testid={`step-${index}`}
            >
              <div className="flex flex-col md:flex-row gap-6 items-start bg-card border rounded-2xl p-8 hover-elevate">
                <div className="flex-shrink-0">
                  <Badge variant="outline" className="text-2xl px-6 py-2 font-bold text-primary border-primary">
                    {step.number}
                  </Badge>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground text-lg mb-4">{step.description}</p>
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <ArrowRight className="h-4 w-4" />
                    <span className="text-sm">{step.outcome}</span>
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="flex justify-center my-4">
                  <div className="h-8 w-0.5 bg-border" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 max-w-3xl mx-auto">
            <p className="text-lg font-semibold mb-2">Remember:</p>
            <p className="text-2xl font-bold mb-4">
              "With the right tools, you can create digital products without being an expert."
            </p>
            <p className="text-muted-foreground">
              Productify AI is the specialized tool that eliminates the need for expertise entirely. 
              Just follow the system, and the AI handles the complexity.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
