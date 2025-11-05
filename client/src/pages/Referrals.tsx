import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Users, DollarSign, Gift, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReferralCode {
  id: string;
  code: string;
  referredCount: number;
  rewardEarned: number;
  active: number;
}

interface ReferralConversion {
  id: string;
  status: string;
  rewardAmount: number;
  createdAt: string;
}

export default function Referrals() {
  const { toast } = useToast();

  const { data: referralCode, isLoading: loadingCode } = useQuery<ReferralCode>({
    queryKey: ['/api/referrals/my-code'],
  });

  const { data: conversions, isLoading: loadingConversions } = useQuery<ReferralConversion[]>({
    queryKey: ['/api/referrals/conversions'],
  });

  const copyReferralLink = () => {
    if (referralCode?.code) {
      const link = `${window.location.origin}/?ref=${referralCode.code}`;
      navigator.clipboard.writeText(link);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
    }
  };

  if (loadingCode || loadingConversions) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" data-testid="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8" data-testid="heading-referrals">Refer & Earn</h1>

      <div className="grid gap-6 mb-8">
        {/* Referral Code */}
        <Card data-testid="card-referral-code">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Your Referral Code
            </CardTitle>
            <CardDescription>
              Share your code and earn 20% commission on all referrals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 p-3 bg-muted rounded-md font-mono text-lg" data-testid="text-referral-code">
                {referralCode?.code || 'Loading...'}
              </div>
              <Button onClick={copyReferralLink} data-testid="button-copy-link">
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div>
                <p className="text-sm text-muted-foreground">Referrals</p>
                <p className="text-2xl font-bold" data-testid="text-referred-count">
                  {referralCode?.referredCount || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Earned</p>
                <p className="text-2xl font-bold" data-testid="text-reward-earned">
                  €{((referralCode?.rewardEarned || 0) / 100).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={referralCode?.active === 1 ? 'default' : 'secondary'} data-testid="badge-status">
                  {referralCode?.active === 1 ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral Stats */}
        <Card data-testid="card-conversions">
          <CardHeader>
            <CardTitle>Your Referrals</CardTitle>
            <CardDescription>Track your successful referrals</CardDescription>
          </CardHeader>
          <CardContent>
            {conversions && conversions.length > 0 ? (
              <div className="space-y-3">
                {conversions.map((conversion: any) => (
                  <div
                    key={conversion.id}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                    data-testid={`conversion-${conversion.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium" data-testid={`conversion-status-${conversion.id}`}>
                          {conversion.status}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(conversion.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold" data-testid={`conversion-reward-${conversion.id}`}>
                        €{((conversion.rewardAmount || 0) / 100).toFixed(2)}
                      </p>
                      <Badge variant={conversion.status === 'converted' ? 'default' : 'secondary'}>
                        {conversion.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-6" data-testid="text-no-conversions">
                No referrals yet. Start sharing your code!
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-primary/5">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">How it works</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Share your referral link with friends and followers</li>
            <li>They sign up and subscribe to any plan</li>
            <li>You earn 20% commission on their subscription</li>
            <li>Get paid monthly for active referrals</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
