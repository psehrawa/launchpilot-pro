"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Mail,
  MousePointerClick,
  MessageSquare,
  TrendingUp,
  ArrowUpRight,
  Plus,
  Search,
  Send,
  Loader2,
  Upload,
} from "lucide-react";
import { useStats } from "@/lib/hooks/use-stats";
import { useCampaigns } from "@/lib/hooks/use-campaigns";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const { stats, loading: statsLoading } = useStats();
  const { campaigns, loading: campaignsLoading } = useCampaigns();
  const [userName, setUserName] = useState("there");

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const name = user.user_metadata?.full_name || 
                    user.user_metadata?.name ||
                    user.email?.split("@")[0] || 
                    "there";
        setUserName(name.split(" ")[0]); // First name only
      }
    };
    getUser();
  }, []);

  const statCards = [
    {
      name: "Total Contacts",
      value: stats.totalContacts.toLocaleString(),
      change: "+12.5%",
      changeType: "positive" as const,
      icon: Users,
    },
    {
      name: "Emails Sent",
      value: stats.emailsSent.toLocaleString(),
      change: "+8.2%",
      changeType: "positive" as const,
      icon: Mail,
    },
    {
      name: "Open Rate",
      value: `${stats.openRate}%`,
      change: "+2.1%",
      changeType: "positive" as const,
      icon: MousePointerClick,
    },
    {
      name: "Reply Rate",
      value: `${stats.replyRate}%`,
      change: "-0.5%",
      changeType: "negative" as const,
      icon: MessageSquare,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-slate-500">Welcome back, {userName}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/contacts">
            <Button variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Find Leads
            </Button>
          </Link>
          <Link href="/dashboard/campaigns/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-blue-600" />
                </div>
                {statsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                ) : (
                  <Badge
                    variant={stat.changeType === "positive" ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {stat.change}
                  </Badge>
                )}
              </div>
              <div className="mt-4">
                {statsLoading ? (
                  <div className="h-8 w-20 bg-slate-200 animate-pulse rounded" />
                ) : (
                  <p className="text-2xl font-bold">{stat.value}</p>
                )}
                <p className="text-sm text-slate-500">{stat.name}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Contacts by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contacts by Status</CardTitle>
            <CardDescription>Breakdown of your contact pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 bg-slate-100 animate-pulse rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(stats.contactsByStatus).length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Users className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p>No contacts yet</p>
                    <Link href="/dashboard/contacts">
                      <Button variant="link" className="mt-2">
                        Add your first contact
                      </Button>
                    </Link>
                  </div>
                ) : (
                  Object.entries(stats.contactsByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-3 w-3 rounded-full ${
                            status === "new"
                              ? "bg-slate-400"
                              : status === "contacted"
                              ? "bg-blue-500"
                              : status === "replied"
                              ? "bg-green-500"
                              : status === "meeting"
                              ? "bg-purple-500"
                              : status === "won"
                              ? "bg-emerald-500"
                              : "bg-red-500"
                          }`}
                        />
                        <span className="capitalize">{status}</span>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))
                )}
              </div>
            )}
            <Link href="/dashboard/contacts">
              <Button variant="ghost" className="w-full mt-4">
                View all contacts
                <ArrowUpRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Active Campaigns */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Campaigns</CardTitle>
            <CardDescription>Your email sequences</CardDescription>
          </CardHeader>
          <CardContent>
            {campaignsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Mail className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p>No campaigns yet</p>
                <Link href="/dashboard/campaigns/new">
                  <Button variant="link" className="mt-2">
                    Create your first campaign
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.slice(0, 3).map((campaign) => (
                  <div
                    key={campaign.id}
                    className="p-4 border rounded-lg hover:border-blue-200 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{campaign.name}</span>
                      <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      Created {new Date(campaign.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <Link href="/dashboard/campaigns">
              <Button variant="ghost" className="w-full mt-4">
                View all campaigns
                <ArrowUpRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/dashboard/contacts">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 w-full">
                <Upload className="h-5 w-5" />
                <span>Import Contacts</span>
              </Button>
            </Link>
            <Link href="/dashboard/contacts">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 w-full">
                <Search className="h-5 w-5" />
                <span>Find Emails</span>
              </Button>
            </Link>
            <Link href="/dashboard/campaigns/new">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 w-full">
                <Send className="h-5 w-5" />
                <span>New Campaign</span>
              </Button>
            </Link>
            <Link href="/dashboard/analytics">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 w-full">
                <TrendingUp className="h-5 w-5" />
                <span>View Analytics</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
