/**
 * Admin Users Management
 * View, search, and manage all ProductifyAI users
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Users,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Copy,
  Crown,
  Gift,
  Zap,
  Shield,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface User {
  id: string;
  emailMasked: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  plan: string;
  subscriptionStatus: string;
  stripeCustomerId: string | null;
  commissionRate: number;
  createdAt: string;
  aiTokensUsed: number;
  credits: number;
}

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const [planFilter, setPlanFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5050';

  // Fetch users list
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['/api/admin/users', page, planFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        plan: planFilter,
        search,
      });
      const response = await fetch(`${API_BASE}/api/admin/users?${params}`);
      return response.json();
    },
  });

  // Fetch user details when drawer opens
  const { data: userDetailsData } = useQuery({
    queryKey: ['/api/admin/users', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return null;
      const response = await fetch(`${API_BASE}/api/admin/users/${selectedUserId}`);
      return response.json();
    },
    enabled: !!selectedUserId,
  });

  // Change plan mutation
  const changePlanMutation = useMutation({
    mutationFn: async ({ userId, plan }: { userId: string; plan: string }) => {
      const response = await fetch(`${API_BASE}/api/admin/users/${userId}/plan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Plan updated', description: 'User plan changed successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
  });

  // Change role mutation
  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await fetch(`${API_BASE}/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Role updated', description: 'User role changed successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
  });

  const users: User[] = usersData?.data?.users || [];
  const pagination = usersData?.data?.pagination || { page: 1, totalPages: 1, total: 0 };
  const userDetails = userDetailsData?.data;

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'pro':
        return <Crown className="h-4 w-4 text-purple-500" />;
      case 'plus':
        return <Zap className="h-4 w-4 text-blue-500" />;
      default:
        return <Gift className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPlanBadge = (plan: string) => {
    const variants: Record<string, any> = {
      pro: 'default',
      plus: 'secondary',
      free: 'outline',
    };
    return (
      <Badge variant={variants[plan] || 'outline'} className="gap-1">
        {getPlanIcon(plan)}
        {plan.toUpperCase()}
      </Badge>
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Copied to clipboard' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">Manage users, plans, and roles</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline">
            <Users className="mr-1 h-3 w-3" />
            {pagination.total} total
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-40">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="plus">Plus</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>AI Usage</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow
                  key={user.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedUserId(user.id)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : 'Unnamed User'}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.emailMasked}</p>
                    </div>
                  </TableCell>
                  <TableCell>{getPlanBadge(user.plan)}</TableCell>
                  <TableCell>
                    {user.role === 'admin' ? (
                      <Badge variant="default" className="gap-1">
                        <Shield className="h-3 w-3" />
                        Admin
                      </Badge>
                    ) : (
                      <Badge variant="outline">User</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.subscriptionStatus === 'active'
                          ? 'default'
                          : user.subscriptionStatus === 'trialing'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {user.subscriptionStatus || 'inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{user.commissionRate}%</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.aiTokensUsed?.toLocaleString() || 0} tokens
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === pagination.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* User Details Drawer */}
      <Sheet open={!!selectedUserId} onOpenChange={(open) => !open && setSelectedUserId(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>User Details</SheetTitle>
            <SheetDescription>Complete user profile and analytics</SheetDescription>
          </SheetHeader>

          {userDetails && (
            <div className="mt-6 space-y-6">
              {/* User Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Name</span>
                    <span className="text-sm font-medium">
                      {userDetails.user.firstName} {userDetails.user.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono">{userDetails.user.email}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(userDetails.user.email)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">User ID</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono">{userDetails.user.id.slice(0, 8)}...</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(userDetails.user.id)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Plan & Role Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Access Control</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Plan</label>
                    <Select
                      value={userDetails.user.plan}
                      onValueChange={(plan) =>
                        changePlanMutation.mutate({ userId: userDetails.user.id, plan })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free (7% commission)</SelectItem>
                        <SelectItem value="plus">Plus (4% commission)</SelectItem>
                        <SelectItem value="pro">Pro (1% commission)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role</label>
                    <Select
                      value={userDetails.user.role || 'user'}
                      onValueChange={(role) =>
                        changeRoleMutation.mutate({ userId: userDetails.user.id, role })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* AI Usage */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">AI Usage (Last 30 Days)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Requests</span>
                    <span className="text-lg font-bold">
                      {userDetails.usage?.totalRequests || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Tokens</span>
                    <span className="text-lg font-bold">
                      {userDetails.usage?.totalTokens?.toLocaleString() || 0}
                    </span>
                  </div>
                  {userDetails.usage?.last30Days?.slice(0, 5).map((record: any) => (
                    <div key={record.id} className="text-xs border-t pt-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{record.feature}</span>
                        <span>{(record.tokensIn || 0) + (record.tokensOut || 0)} tokens</span>
                      </div>
                      <div className="text-muted-foreground">
                        {new Date(record.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Community Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Community Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Recent messages: {userDetails.community?.messageCount || 0}
                  </p>
                  {userDetails.community?.recentMessages?.slice(0, 3).map((msg: any) => (
                    <div key={msg.id} className="text-xs border-t pt-2 mb-2">
                      <p className="text-muted-foreground line-clamp-2">{msg.content}</p>
                      <span className="text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Orders */}
              {(userDetails.orders?.asBuyer?.length > 0 || userDetails.orders?.asSeller?.length > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Orders</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {userDetails.orders.asBuyer?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">As Buyer</p>
                        <p className="text-xs text-muted-foreground">
                          {userDetails.orders.asBuyer.length} orders
                        </p>
                      </div>
                    )}
                    {userDetails.orders.asSeller?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">As Seller</p>
                        <p className="text-xs text-muted-foreground">
                          {userDetails.orders.asSeller.length} sales
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

