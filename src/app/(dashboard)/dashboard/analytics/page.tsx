"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  MousePointerClick,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Users,
  Loader2,
} from "lucide-react";
import { useStats } from "@/lib/hooks/use-stats";
import { useCampaigns } from "@/lib/hooks/use-campaigns";

export default function AnalyticsPage() {
  const { stats, loading: statsLoading } = useStats();
  const { campaigns, loading: campaignsLoading } = useCampaigns();

  const loading = statsLoading || campaignsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-slate-500">Track your email performance</p>
        </div>
        <Select defaultValue="30d">
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <Badge variant="default" className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12%
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">{stats.emailsSent.toLocaleString()}</p>
              <p className="text-sm text-slate-500">Emails Sent</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                <MousePointerClick className="h-5 w-5 text-green-600" />
              </div>
              <Badge variant="default" className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                +5%
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">{stats.openRate}%</p>
              <p className="text-sm text-slate-500">Open Rate</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-purple-600" />
              </div>
              <Badge variant="destructive" className="text-xs">
                <TrendingDown className="h-3 w-3 mr-1" />
                -2%
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">{stats.replyRate}%</p>
              <p className="text-sm text-slate-500">Reply Rate</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <Badge variant="default" className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8%
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">{stats.totalContacts.toLocaleString()}</p>
              <p className="text-sm text-slate-500">Total Contacts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Placeholder */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Email Performance Over Time</CardTitle>
            <CardDescription>Opens, clicks, and replies by day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg text-slate-400">
              {stats.emailsSent === 0 ? (
                <div className="text-center">
                  <Mail className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <p>No email data yet</p>
                  <p className="text-sm">Start sending emails to see analytics</p>
                </div>
              ) : (
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <p>Chart coming soon</p>
                  <p className="text-sm">Recharts integration pending</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
            <CardDescription>Compare your active campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg text-slate-400">
              {campaigns.length === 0 ? (
                <div className="text-center">
                  <Mail className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <p>No campaigns yet</p>
                  <p className="text-sm">Create a campaign to see performance</p>
                </div>
              ) : (
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <p>Chart coming soon</p>
                  <p className="text-sm">Recharts integration pending</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Breakdown</CardTitle>
          <CardDescription>Detailed metrics for each campaign</CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>No campaigns to display</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium text-slate-600">Campaign</th>
                    <th className="text-left p-3 font-medium text-slate-600">Status</th>
                    <th className="text-right p-3 font-medium text-slate-600">Sent</th>
                    <th className="text-right p-3 font-medium text-slate-600">Opened</th>
                    <th className="text-right p-3 font-medium text-slate-600">Replied</th>
                    <th className="text-right p-3 font-medium text-slate-600">Open Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="border-b hover:bg-slate-50">
                      <td className="p-3 font-medium">{campaign.name}</td>
                      <td className="p-3">
                        <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                          {campaign.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">0</td>
                      <td className="p-3 text-right">0</td>
                      <td className="p-3 text-right">0</td>
                      <td className="p-3 text-right">0%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
