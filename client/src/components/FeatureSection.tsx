import { Wand2, Zap, Download, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Wand2,
    title: "AI-Powered Generation",
    description: "Advanced AI models create professional-quality digital products tailored to your needs in seconds"
  },
  {
    icon: Zap,
    title: "Instant Results",
    description: "No more waiting. Get your digital products generated and ready to use in real-time"
  },
  {
    icon: Download,
    title: "Easy Export",
    description: "Download your creations in multiple formats. Use them anywhere, anytime"
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your data and creations are encrypted and secure. We never share your information"
  }
];

export function FeatureSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything you need to create
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to help you build professional digital products effortlessly
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="p-6 hover-elevate transition-all duration-200"
              data-testid={`card-feature-${index}`}
            >
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
