"use client";

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
} from "lucide-react";

const stats = [
  {
    name: "Total Contacts",
    value: "1,247",
    change: "+12.5%",
    changeType: "positive",
    icon: Users,
  },
  {
    name: "Emails Sent",
    value: "3,892",
    change: "+8.2%",
    changeType: "positive",
    icon: Mail,
  },
  {
    name: "Open Rate",
    value: "42.3%",
    change: "+2.1%",
    changeType: "positive",
    icon: MousePointerClick,
  },
  {
    name: "Reply Rate",
    value: "8.7%",
    change: "-0.5%",
    changeType: "negative",
    icon: MessageSquare,
  },
];

const recentActivity = [
  {
    id: 1,
    type: "reply",
    contact: "Sarah Chen",
    email: "sarah@techstartup.com",
    campaign: "Q1 Outreach",
    time: "2 minutes ago",
  },
  {
    id: 2,
    type: "opened",
    contact: "Mike Johnson",
    email: "mike@acme.co",
    campaign: "Product Launch",
    time: "15 minutes ago",
  },
  {
    id: 3,
    type: "clicked",
    contact: "Priya Sharma",
    email: "priya@saasco.com",
    campaign: "Q1 Outreach",
    time: "1 hour ago",
  },
  {
    id: 4,
    type: "bounced",
    contact: "John Doe",
    email: "john@invalid.com",
    campaign: "Cold Outreach",
    time: "2 hours ago",
  },
];

const activeCampaigns = [
  {
    id: 1,
    name: "Q1 Outreach",
    status: "active",
    sent: 450,
    opened: 189,
    replied: 23,
  },
  {
    id: 2,
    name: "Product Launch",
    status: "active",
    sent: 1200,
    opened: 504,
    replied: 67,
  },
  {
    id: 3,
    name: "Follow-up Sequence",
    status: "paused",
    sent: 89,
    opened: 34,
    replied: 8,
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-slate-500">Welcome back, Parshant</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Search className="h-4 w-4 mr-2" />
            Find Leads
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-blue-600" />
                </div>
                <Badge
                  variant={stat.changeType === "positive" ? "default" : "destructive"}
                  className="text-xs"
                >
                  {stat.change}
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.name}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Latest email interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        activity.type === "reply"
                          ? "bg-green-500"
                          : activity.type === "opened"
                          ? "bg-blue-500"
                          : activity.type === "clicked"
                          ? "bg-purple-500"
                          : "bg-red-500"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium">{activity.contact}</p>
                      <p className="text-xs text-slate-500">
                        {activity.type === "reply" && "Replied to "}
                        {activity.type === "opened" && "Opened email from "}
                        {activity.type === "clicked" && "Clicked link in "}
                        {activity.type === "bounced" && "Email bounced from "}
                        {activity.campaign}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">{activity.time}</span>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4">
              View all activity
              <ArrowUpRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Active Campaigns */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Campaigns</CardTitle>
            <CardDescription>Your running email sequences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="p-4 border rounded-lg hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{campaign.name}</span>
                      <Badge
                        variant={campaign.status === "active" ? "default" : "secondary"}
                      >
                        {campaign.status}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-lg font-semibold">{campaign.sent}</p>
                      <p className="text-xs text-slate-500">Sent</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{campaign.opened}</p>
                      <p className="text-xs text-slate-500">Opened</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{campaign.replied}</p>
                      <p className="text-xs text-slate-500">Replied</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4">
              View all campaigns
              <ArrowUpRight className="h-4 w-4 ml-2" />
            </Button>
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
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <Users className="h-5 w-5" />
              <span>Import Contacts</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <Search className="h-5 w-5" />
              <span>Find Emails</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <Send className="h-5 w-5" />
              <span>New Campaign</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <TrendingUp className="h-5 w-5" />
              <span>View Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
