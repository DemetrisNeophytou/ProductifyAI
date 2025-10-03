import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Target, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export function WelcomeDialog() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = (open: boolean) => {
    if (!open) {
      localStorage.setItem('hasSeenWelcome', 'true');
    }
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl" data-testid="dialog-welcome">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <Badge variant="secondary" data-testid="badge-trial-active">3-Day Trial Active</Badge>
          </div>
          <DialogTitle className="text-3xl" data-testid="heading-welcome">
            Welcome to Productify AI
          </DialogTitle>
          <DialogDescription className="text-base text-foreground pt-2" data-testid="text-welcome-description">
            Your mission: Generate €100,000+ per year from digital products — even with zero experience.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-muted/50 border rounded-lg p-4">
            <p className="text-sm font-semibold mb-2 text-foreground">You don't need to be an expert.</p>
            <p className="text-sm text-muted-foreground">
              Our AI Monetization Coach guides you step-by-step to create and sell digital products. 
              You'll learn exactly how to price, position, and launch products that generate real revenue.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-1 text-sm">1. Start with Your First Product</h4>
                <p className="text-sm text-muted-foreground">
                  Create an eBook, course, or workbook. Our AI helps you build professional content in minutes.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-1 text-sm">2. Learn Pricing & Launch Strategies</h4>
                <p className="text-sm text-muted-foreground">
                  Get specific monetization strategies: How to price at €47, €97, or €197 for maximum profit.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-1 text-sm">3. Scale to €100k+</h4>
                <p className="text-sm text-muted-foreground">
                  Build a product portfolio, create funnels, and implement systems to reach €100,000+ per year.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 border-primary/20 border rounded-lg p-4">
            <p className="text-sm font-semibold mb-1 text-foreground">Your 3-Day Trial Includes:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Full access to AI content generation</li>
              <li>• Professional PDF/DOCX exports with your branding</li>
              <li>• Monetization coaching & revenue strategies</li>
              <li>• No credit card required</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Link href="/projects/new">
            <Button className="w-full" size="lg" onClick={() => handleClose(false)} data-testid="button-create-first-product">
              Create Your First Product
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/ai-coach">
            <Button variant="outline" className="w-full" onClick={() => handleClose(false)} data-testid="button-talk-to-coach">
              Talk to Your AI Coach
            </Button>
          </Link>
          <Button variant="ghost" className="w-full" onClick={() => handleClose(false)} data-testid="button-skip-welcome">
            Skip for now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
