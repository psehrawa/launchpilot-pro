"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Mail,
  Eye,
  MousePointer,
  MessageSquare,
  TrendingUp,
  RefreshCw,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface EmailStats {
  total: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  open_rate: string;
  click_rate: string;
  reply_rate: string;
}

interface Email {
  id: string;
  to_email: string;
  subject: string;
  status: string;
  sent_at: string;
  opened_at: string | null;
  clicked_at: string | null;
  replied_at: string | null;
  open_count: number;
}

export default function OutreachPage() {
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/campaigns/stats?days=${days}`);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setEmails(data.emails || []);
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStats();
  }, [days]);

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Outreach Dashboard</h1>
          <p className="text-slate-500">Track your cold email campaigns</p>
        </div>
        <div className="flex gap-2">
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="border rounded-md px-3 py-2"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <Button variant="outline" onClick={loadStats} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Sent</p>
                <p className="text-3xl font-bold">{stats?.total || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Send className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Opened</p>
                <p className="text-3xl font-bold">{stats?.opened || 0}</p>
                <p className="text-xs text-green-600">{stats?.open_rate || 0}% rate</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Clicked</p>
                <p className="text-3xl font-bold">{stats?.clicked || 0}</p>
                <p className="text-xs text-purple-600">{stats?.click_rate || 0}% rate</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <MousePointer className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Replied</p>
                <p className="text-3xl font-bold">{stats?.replied || 0}</p>
                <p className="text-xs text-orange-600">{stats?.reply_rate || 0}% rate</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <MessageSquare className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Emails</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>To</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Opens</TableHead>
                <TableHead>Clicked</TableHead>
                <TableHead>Replied</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emails.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                    No emails sent yet. Use the send script to start tracking.
                  </TableCell>
                </TableRow>
              ) : (
                emails.map((email) => (
                  <TableRow key={email.id}>
                    <TableCell className="font-medium">{email.to_email}</TableCell>
                    <TableCell className="max-w-xs truncate">{email.subject}</TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {formatDate(email.sent_at)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          email.status === "sent"
                            ? "bg-blue-100 text-blue-700"
                            : email.status === "bounced"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }
                      >
                        {email.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {email.opened_at ? (
                        <span className="flex items-center text-green-600">
                          <Eye className="h-4 w-4 mr-1" />
                          {email.open_count || 1}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {email.clicked_at ? (
                        <CheckCircle2 className="h-4 w-4 text-purple-600" />
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {email.replied_at ? (
                        <CheckCircle2 className="h-4 w-4 text-orange-600" />
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Send Tracked Email (CLI)</h3>
            <code className="text-sm bg-slate-100 p-2 rounded block overflow-x-auto">
              python scripts/send_with_tracking.py --to email@company.com --subject "Hi" --body "Message"
            </code>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Batch Send from CSV</h3>
            <code className="text-sm bg-slate-100 p-2 rounded block overflow-x-auto">
              python scripts/send_with_tracking.py --csv contacts.csv --subject "Hi &#123;&#123;company&#125;&#125;" --body-file template.txt
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
