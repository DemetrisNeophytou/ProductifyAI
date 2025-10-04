import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { User, CreditCard, Activity, Shield, HelpCircle, Sparkles, ExternalLink } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface User {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  subscriptionTier?: string;
  subscriptionPeriodEnd?: string;
  trialEndDate?: string;
  stripeCustomerId?: string;
}

interface Usage {
  aiTokensUsed?: number;
  aiTokensLimit?: number;
  projectsUsed?: number;
  projectsLimit?: number;
  tier?: string;
}

export default function Settings() {
  const { toast } = useToast();

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const { data: usage, isLoading: usageLoading } = useQuery<Usage>({
    queryKey: ["/api/usage"],
  });

  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ["/api/subscription/status"],
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/subscription/portal", {
        method: "POST",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to open billing portal");
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case "pro":
        return "default";
      case "plus":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getTierLabel = (tier?: string) => {
    if (!tier) return "Trial";
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  const getTrialDaysLeft = () => {
    if (!user?.trialEndDate) return null;
    const daysLeft = Math.ceil((new Date(user.trialEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 ? daysLeft : 0;
  };

  const formatDate = (date?: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="container max-w-6xl p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-settings">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account and subscription</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card data-testid="card-account">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>Account</CardTitle>
            </div>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {userLoading ? (
              <>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm" data-testid="text-user-email">{user?.email || "Not available"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="text-sm" data-testid="text-user-name">
                    {user?.firstName && user?.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : "Not set"}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-subscription">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <CardTitle>Subscription</CardTitle>
            </div>
            <CardDescription>Manage your subscription plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subLoading ? (
              <>
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-full" />
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant={getTierBadgeVariant(usage?.tier || "trial")} data-testid="badge-subscription-tier">
                    {getTierLabel(usage?.tier)}
                  </Badge>
                  {usage?.tier === "trial" && getTrialDaysLeft() !== null && (
                    <span className="text-sm text-muted-foreground" data-testid="text-trial-days">
                      {getTrialDaysLeft()} days left
                    </span>
                  )}
                </div>
                
                {user?.subscriptionPeriodEnd && usage?.tier !== "trial" && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Next renewal</p>
                    <p className="text-sm" data-testid="text-renewal-date">
                      {formatDate(user.subscriptionPeriodEnd)}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {usage?.tier === "trial" && (
                    <Button
                      size="sm"
                      onClick={() => (window.location.href = "/pricing")}
                      data-testid="button-upgrade"
                    >
                      Upgrade to Plus or Pro
                    </Button>
                  )}
                  {usage?.tier !== "trial" && user?.stripeCustomerId && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => portalMutation.mutate()}
                      disabled={portalMutation.isPending}
                      data-testid="button-billing-portal"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {portalMutation.isPending ? "Opening..." : "Manage Subscription"}
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-usage">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle>Usage</CardTitle>
            </div>
            <CardDescription>Track your resource usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {usageLoading ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">AI Tokens</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-ai-tokens-usage">
                      {usage?.aiTokensUsed?.toLocaleString() || 0} / {usage?.aiTokensLimit === -1 ? "Unlimited" : (usage?.aiTokensLimit?.toLocaleString() || "0")}
                    </p>
                  </div>
                  <Progress 
                    value={usage?.aiTokensLimit === -1 ? 0 : ((usage?.aiTokensUsed || 0) / (usage?.aiTokensLimit || 1)) * 100} 
                    className="h-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Projects</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-projects-usage">
                      {usage?.projectsUsed || 0} / {usage?.projectsLimit === -1 ? "Unlimited" : (usage?.projectsLimit || 0)}
                    </p>
                  </div>
                  <Progress 
                    value={usage?.projectsLimit === -1 ? 0 : ((usage?.projectsUsed || 0) / (usage?.projectsLimit || 1)) * 100} 
                    className="h-2"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-ai-coach">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>AI Coach</CardTitle>
            </div>
            <CardDescription>Productify Coach AI powered by GPT-4o</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              Get personalized guidance on creating and monetizing digital products with our AI coach powered by the latest OpenAI technology.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => (window.location.href = "/ai-coach")}
              data-testid="button-go-to-coach"
            >
              Go to AI Coach
            </Button>
          </CardContent>
        </Card>

        <Card data-testid="card-security">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Security</CardTitle>
            </div>
            <CardDescription>API keys and security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Connected Services</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">OpenAI API</span>
                  <Badge variant="outline" className="text-xs">
                    Configured
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Stripe Payments</span>
                  <Badge variant="outline" className="text-xs">
                    Active
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-support">
          <CardHeader>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              <CardTitle>Support</CardTitle>
            </div>
            <CardDescription>Get help and resources</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              Need assistance? Visit our community or contact support for help with your digital product creation journey.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => (window.location.href = "/community")}
                data-testid="button-community"
              >
                Community
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => (window.location.href = "/help")}
                data-testid="button-help"
              >
                Help Center
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
