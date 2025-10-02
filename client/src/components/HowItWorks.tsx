import { Badge } from "@/components/ui/badge";

const steps = [
  {
    number: "01",
    title: "Choose Your Product Type",
    description: "Select from templates, content, graphics, or marketing materials to get started"
  },
  {
    number: "02",
    title: "Customize with AI",
    description: "Describe what you need and adjust parameters to fine-tune the AI generation"
  },
  {
    number: "03",
    title: "Generate Instantly",
    description: "Our AI processes your request and creates a professional product in seconds"
  },
  {
    number: "04",
    title: "Download & Use",
    description: "Export your creation in your preferred format and start using it immediately"
  }
];

export function HowItWorks() {
  return (
    <section className="py-24 px-6 bg-card/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How it works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Create professional digital products in four simple steps
          </p>
        </div>

        <div className="space-y-12">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 items-center`}
              data-testid={`step-${index}`}
            >
              <div className="flex-1">
                <Badge variant="outline" className="mb-4 text-lg px-4 py-1">
                  {step.number}
                </Badge>
                <h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-lg">{step.description}</p>
              </div>
              <div className="flex-1 w-full">
                <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
                  <span className="text-muted-foreground">Step {step.number} Preview</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
