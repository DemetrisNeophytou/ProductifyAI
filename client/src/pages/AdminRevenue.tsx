/**
 * Admin Revenue Analytics
 * Stripe subscriptions and marketplace commission tracking
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Users, Percent, Download, RefreshCw } from 'lucide-react';

export default function AdminRevenue() {
  const [range, setRange] = useState('30d');
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5050';

  // Fetch Stripe summary
  const { data: stripeData, refetch: refetchStripe } = useQuery({
    queryKey: ['/api/admin/revenue/stripe-summary', range],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/admin/revenue/stripe-summary?range=${range}`);
      return response.json();
    },
  });

  // Fetch commission data
  const { data: commissionsData, refetch: refetchCommissions } = useQuery({
    queryKey: ['/api/admin/revenue/commissions', range],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/admin/revenue/commissions?range=${range}`);
      return response.json();
    },
  });

  const stripe = stripeData?.data || {
    mrr: 0,
    arr: 0,
    activeSubscriptions: 0,
    planSplits: { plus: 0, pro: 0 },
  };

  const commissions = commissionsData?.data || {
    totalGMV: 0,
    totalCommission: 0,
    totalPayout: 0,
    orderCount: 0,
    avgCommissionRate: 0,
    topSellers: [],
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Revenue & Commissions</h2>
          <p className="text-muted-foreground">Stripe subscriptions and marketplace analytics</p>
        </div>
        <div className="flex gap-3">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchStripe();
              refetchCommissions();
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stripe Revenue Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(stripe.mrr * 100)}</div>
            <p className="text-xs text-muted-foreground mt-1">Monthly Recurring Revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ARR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(stripe.arr * 100)}</div>
            <p className="text-xs text-muted-foreground mt-1">Annual Run Rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stripe.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Plus: {stripe.planSplits?.plus || 0} | Pro: {stripe.planSplits?.pro || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Commission</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {commissions.avgCommissionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Marketplace average</p>
          </CardContent>
        </Card>
      </div>

      {/* Marketplace Commissions */}
      <Card>
        <CardHeader>
          <CardTitle>Marketplace Commissions</CardTitle>
          <CardDescription>Platform fees from marketplace sales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total GMV</p>
              <p className="text-2xl font-bold">{formatCurrency(commissions.totalGMV)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Platform Commission</p>
              <p className="text-2xl font-bold">{formatCurrency(commissions.totalCommission)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Seller Payouts</p>
              <p className="text-2xl font-bold">{formatCurrency(commissions.totalPayout)}</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            {commissions.orderCount} orders in selected period
          </p>

          {/* Commission Tiers Reference */}
          <div className="grid gap-3 md:grid-cols-3">
            <div className="border rounded-lg p-3">
              <Badge variant="outline" className="mb-2">Free Plan</Badge>
              <p className="text-2xl font-bold">7%</p>
              <p className="text-xs text-muted-foreground">Platform commission</p>
            </div>
            <div className="border rounded-lg p-3">
              <Badge variant="secondary" className="mb-2">Plus Plan</Badge>
              <p className="text-2xl font-bold">4%</p>
              <p className="text-xs text-muted-foreground">Platform commission</p>
            </div>
            <div className="border rounded-lg p-3">
              <Badge variant="default" className="mb-2">Pro Plan</Badge>
              <p className="text-2xl font-bold">1%</p>
              <p className="text-xs text-muted-foreground">Platform commission</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Sellers */}
      {commissions.topSellers?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Sellers</CardTitle>
            <CardDescription>By total payout (after commission)</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seller ID</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.topSellers.map((seller: any) => (
                  <TableRow key={seller.sellerId}>
                    <TableCell className="font-mono text-sm">
                      {seller.sellerId.slice(0, 8)}...
                    </TableCell>
                    <TableCell>{seller.count}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(seller.revenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {stripeData?.mock && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              ⚠️ Showing mock data. Connect Stripe API for live revenue analytics.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

