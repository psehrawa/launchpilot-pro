"use client";

import { useState, useEffect, useCallback } from "react";
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
  BarChart3,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useStats } from "@/lib/hooks/use-stats";

interface TimeSeriesData {
  date: string;
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
}

interface CampaignStat {
  id: string;
  name: string;
  status: string;
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  openRate: number;
  replyRate: number;
  clickRate: number;
}

export default function AnalyticsPage() {
  const { stats, loading: statsLoading } = useStats();
  const [timeRange, setTimeRange] = useState("30d");
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([]);
  const [campaignStats, setCampaignStats] = useState<CampaignStat[]>([]);
  const [chartsLoading, setChartsLoading] = useState(true);

  const fetchTimeSeriesData = useCallback(async () => {
    setChartsLoading(true);
    try {
      const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 365;
      const res = await fetch(`/api/stats/timeseries?days=${days}`);
      const data = await res.json();
      
      if (data.success) {
        // Format dates for display
        const formatted = data.timeSeries.map((d: TimeSeriesData) => ({
          ...d,
          date: new Date(d.date).toLocaleDateString("en-US", { 
            month: "short", 
            day: "numeric" 
          }),
        }));
        setTimeSeries(formatted);
        setCampaignStats(data.campaignStats || []);
      }
    } catch (err) {
      console.error("Failed to fetch time series:", err);
    } finally {
      setChartsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchTimeSeriesData();
  }, [fetchTimeSeriesData]);

  const loading = statsLoading || chartsLoading;

  if (loading && timeSeries.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Calculate trend (compare last 7 days to previous 7)
  const calculateTrend = (metric: keyof TimeSeriesData) => {
    if (timeSeries.length < 14) return { value: 0, positive: true };
    const recent = timeSeries.slice(-7).reduce((sum, d) => sum + (d[metric] as number || 0), 0);
    const previous = timeSeries.slice(-14, -7).reduce((sum, d) => sum + (d[metric] as number || 0), 0);
    if (previous === 0) return { value: 0, positive: true };
    const change = Math.round(((recent - previous) / previous) * 100);
    return { value: Math.abs(change), positive: change >= 0 };
  };

  const sentTrend = calculateTrend("sent");
  const openTrend = calculateTrend("opened");
  const replyTrend = calculateTrend("replied");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-slate-500">Track your email performance</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
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
              <Badge variant={sentTrend.positive ? "default" : "destructive"} className="text-xs">
                {sentTrend.positive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {sentTrend.value}%
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
              <Badge variant={openTrend.positive ? "default" : "destructive"} className="text-xs">
                {openTrend.positive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {openTrend.value}%
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
              <Badge variant={replyTrend.positive ? "default" : "destructive"} className="text-xs">
                {replyTrend.positive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {replyTrend.value}%
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
                Active
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">{stats.totalContacts.toLocaleString()}</p>
              <p className="text-sm text-slate-500">Total Contacts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Email Performance Over Time</CardTitle>
            <CardDescription>Opens, clicks, and replies by day</CardDescription>
          </CardHeader>
          <CardContent>
            {timeSeries.length === 0 || stats.emailsSent === 0 ? (
              <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg text-slate-400">
                <div className="text-center">
                  <Mail className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <p>No email data yet</p>
                  <p className="text-sm">Start sending emails to see analytics</p>
                </div>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: "#e5e7eb" }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: "#e5e7eb" }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: "8px", 
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="sent" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={false}
                      name="Sent"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="opened" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      dot={false}
                      name="Opened"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="replied" 
                      stroke="#a855f7" 
                      strokeWidth={2}
                      dot={false}
                      name="Replied"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="clicked" 
                      stroke="#f97316" 
                      strokeWidth={2}
                      dot={false}
                      name="Clicked"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
            <CardDescription>Compare your campaign metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {campaignStats.length === 0 ? (
              <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg text-slate-400">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <p>No campaigns yet</p>
                  <p className="text-sm">Create a campaign to see performance</p>
                </div>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={campaignStats.slice(0, 5)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      width={100}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: "8px", 
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                      }}
                    />
                    <Legend />
                    <Bar dataKey="sent" fill="#3b82f6" name="Sent" />
                    <Bar dataKey="opened" fill="#22c55e" name="Opened" />
                    <Bar dataKey="replied" fill="#a855f7" name="Replied" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
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
          {campaignStats.length === 0 ? (
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
                    <th className="text-right p-3 font-medium text-slate-600">Clicked</th>
                    <th className="text-right p-3 font-medium text-slate-600">Replied</th>
                    <th className="text-right p-3 font-medium text-slate-600">Open Rate</th>
                    <th className="text-right p-3 font-medium text-slate-600">Reply Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignStats.map((campaign) => (
                    <tr key={campaign.id} className="border-b hover:bg-slate-50">
                      <td className="p-3 font-medium">{campaign.name}</td>
                      <td className="p-3">
                        <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                          {campaign.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">{campaign.sent}</td>
                      <td className="p-3 text-right">{campaign.opened}</td>
                      <td className="p-3 text-right">{campaign.clicked}</td>
                      <td className="p-3 text-right">{campaign.replied}</td>
                      <td className="p-3 text-right">
                        <span className={campaign.openRate >= 20 ? "text-green-600" : ""}>
                          {campaign.openRate}%
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span className={campaign.replyRate >= 5 ? "text-green-600" : ""}>
                          {campaign.replyRate}%
                        </span>
                      </td>
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
