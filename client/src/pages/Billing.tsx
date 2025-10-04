import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Calendar, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface BillingInfo {
  subscriptionTier?: string;
  subscriptionStatus?: string;
  subscriptionPeriodEnd?: Date | string;
  projectsLimit?: number;
  aiTokensLimit?: number;
  aiTokensUsed?: number;
  paymentHistory?: Array<{
    id: string;
    amount: number;
    status: string;
    plan: string;
    billingPeriod: string;
    createdAt: string;
  }>;
}

export default function Billing() {
  const { toast } = useToast();

  const { data: billingInfo, isLoading } = useQuery<BillingInfo>({
    queryKey: ['/api/billing/info'],
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to create portal session');
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to open billing portal",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" data-testid="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8" data-testid="heading-billing">Billing & Subscription</h1>

      <div className="grid gap-6">
        {/* Current Plan */}
        <Card data-testid="card-current-plan">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-lg capitalize" data-testid="text-tier">
                  {billingInfo?.subscriptionTier || 'Trial'}
                </p>
                <p className="text-sm text-muted-foreground" data-testid="text-status">
                  Status: <Badge variant={billingInfo?.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                    {billingInfo?.subscriptionStatus || 'trialing'}
                  </Badge>
                </p>
              </div>
              <Button
                onClick={() => portalMutation.mutate()}
                disabled={portalMutation.isPending}
                data-testid="button-manage-subscription"
              >
                {portalMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Manage Subscription'
                )}
              </Button>
            </div>

            {billingInfo?.subscriptionPeriodEnd && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span data-testid="text-period-end">
                  Renews on {format(new Date(billingInfo.subscriptionPeriodEnd), 'PPP')}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Projects Used</p>
                <p className="text-lg font-semibold" data-testid="text-projects-used">
                  {billingInfo?.projectsLimit === -1 ? 'Unlimited' : `${billingInfo?.projectsLimit || 0}`}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">AI Tokens</p>
                <p className="text-lg font-semibold" data-testid="text-tokens-used">
                  {billingInfo?.aiTokensUsed || 0} / {billingInfo?.aiTokensLimit === -1 ? '∞' : billingInfo?.aiTokensLimit || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card data-testid="card-payment-history">
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>View your recent transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {billingInfo?.paymentHistory && billingInfo.paymentHistory.length > 0 ? (
              <div className="space-y-3">
                {billingInfo.paymentHistory.map((payment: any) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                    data-testid={`payment-${payment.id}`}
                  >
                    <div className="flex items-center gap-3">
                      {payment.status === 'succeeded' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-destructive" />
                      )}
                      <div>
                        <p className="font-medium" data-testid={`payment-plan-${payment.id}`}>
                          {payment.plan} - {payment.billingPeriod}
                        </p>
                        <p className="text-sm text-muted-foreground" data-testid={`payment-date-${payment.id}`}>
                          {format(new Date(payment.createdAt), 'PPP')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold" data-testid={`payment-amount-${payment.id}`}>
                        €{(payment.amount / 100).toFixed(2)}
                      </p>
                      <Badge variant={payment.status === 'succeeded' ? 'default' : 'destructive'}>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-6" data-testid="text-no-payments">
                No payment history yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
