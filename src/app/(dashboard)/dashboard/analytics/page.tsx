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
  BarChart3,
  Calendar,
} from "lucide-react";

// Mock data for analytics
const overviewStats = [
  {
    name: "Total Emails Sent",
    value: "12,847",
    change: "+23.5%",
    trend: "up",
    icon: Mail,
    description: "Last 30 days",
  },
  {
    name: "Average Open Rate",
    value: "42.3%",
    change: "+2.1%",
    trend: "up",
    icon: MousePointerClick,
    description: "Industry avg: 21.5%",
  },
  {
    name: "Reply Rate",
    value: "8.7%",
    change: "-0.5%",
    trend: "down",
    icon: MessageSquare,
    description: "Industry avg: 3.2%",
  },
  {
    name: "Meetings Booked",
    value: "47",
    change: "+12",
    trend: "up",
    icon: Calendar,
    description: "From cold outreach",
  },
];

const campaignPerformance = [
  {
    name: "Q1 Outreach",
    sent: 4500,
    opened: 1890,
    clicked: 423,
    replied: 234,
    openRate: 42.0,
    replyRate: 5.2,
  },
  {
    name: "Product Launch",
    sent: 3200,
    opened: 1472,
    clicked: 320,
    replied: 189,
    openRate: 46.0,
    replyRate: 5.9,
  },
  {
    name: "Follow-up Sequence",
    sent: 2100,
    opened: 756,
    clicked: 145,
    replied: 98,
    openRate: 36.0,
    replyRate: 4.7,
  },
  {
    name: "Cold Outreach v2",
    sent: 1800,
    opened: 846,
    clicked: 201,
    replied: 156,
    openRate: 47.0,
    replyRate: 8.7,
  },
];

const topPerformingEmails = [
  {
    subject: "Quick question about {{company}}",
    openRate: 52.3,
    replyRate: 9.8,
    campaign: "Q1 Outreach",
  },
  {
    subject: "Saw your recent announcement",
    openRate: 48.7,
    replyRate: 7.2,
    campaign: "Product Launch",
  },
  {
    subject: "Following up on my last email",
    openRate: 41.2,
    replyRate: 12.3,
    campaign: "Follow-up Sequence",
  },
];

const dailyStats = [
  { day: "Mon", sent: 245, opened: 103, replied: 12 },
  { day: "Tue", sent: 312, opened: 134, replied: 18 },
  { day: "Wed", sent: 287, opened: 121, replied: 15 },
  { day: "Thu", sent: 356, opened: 167, replied: 23 },
  { day: "Fri", sent: 298, opened: 125, replied: 14 },
  { day: "Sat", sent: 45, opened: 18, replied: 2 },
  { day: "Sun", sent: 23, opened: 9, replied: 1 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-slate-500">Track your outreach performance</p>
        </div>
        <Select defaultValue="30d">
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewStats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-blue-600" />
                </div>
                <Badge
                  variant={stat.trend === "up" ? "default" : "destructive"}
                  className="flex items-center gap-1"
                >
                  {stat.trend === "up" ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {stat.change}
                </Badge>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.name}</p>
              <p className="text-xs text-slate-400 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Daily Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Daily Activity
            </CardTitle>
            <CardDescription>Emails sent and engagement this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dailyStats.map((day) => (
                <div key={day.day} className="flex items-center gap-4">
                  <span className="w-8 text-sm text-slate-500">{day.day}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <div
                      className="h-6 bg-blue-500 rounded"
                      style={{ width: `${(day.sent / 400) * 100}%` }}
                    />
                    <span className="text-sm">{day.sent}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm">
              <span className="flex items-center gap-2">
                <div className="h-3 w-3 bg-blue-500 rounded" />
                Sent
              </span>
              <span className="flex items-center gap-2">
                <div className="h-3 w-3 bg-green-500 rounded" />
                Opened
              </span>
              <span className="flex items-center gap-2">
                <div className="h-3 w-3 bg-purple-500 rounded" />
                Replied
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Emails */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Performing Emails
            </CardTitle>
            <CardDescription>Highest engagement subject lines</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformingEmails.map((email, index) => (
                <div
                  key={email.subject}
                  className="p-3 border rounded-lg hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-sm">{email.subject}</p>
                        <p className="text-xs text-slate-500">{email.campaign}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">
                        {email.replyRate}% reply
                      </p>
                      <p className="text-xs text-slate-500">{email.openRate}% open</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Campaign Performance
          </CardTitle>
          <CardDescription>Detailed breakdown by campaign</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-slate-500">Campaign</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-500">Sent</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-500">Opened</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-500">Open Rate</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-500">Replied</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-500">Reply Rate</th>
                </tr>
              </thead>
              <tbody>
                {campaignPerformance.map((campaign) => (
                  <tr key={campaign.name} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium">{campaign.name}</td>
                    <td className="py-3 px-4 text-right">{campaign.sent.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">{campaign.opened.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">
                      <Badge
                        variant={campaign.openRate >= 40 ? "default" : "secondary"}
                      >
                        {campaign.openRate}%
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">{campaign.replied}</td>
                    <td className="py-3 px-4 text-right">
                      <Badge
                        variant={campaign.replyRate >= 5 ? "default" : "secondary"}
                        className={campaign.replyRate >= 5 ? "bg-green-100 text-green-700" : ""}
                      >
                        {campaign.replyRate}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
