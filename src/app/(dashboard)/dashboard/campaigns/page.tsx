"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  MoreHorizontal,
  Play,
  Pause,
  Copy,
  Trash2,
  Mail,
  MousePointerClick,
  MessageSquare,
  Users,
  Calendar,
  ArrowRight,
} from "lucide-react";

const campaigns = [
  {
    id: "1",
    name: "Q1 Outreach",
    status: "active",
    steps: 3,
    contacts: 450,
    sent: 1247,
    opened: 523,
    openRate: 41.9,
    replied: 67,
    replyRate: 5.4,
    createdAt: "Jan 15, 2026",
  },
  {
    id: "2",
    name: "Product Launch Announcement",
    status: "active",
    steps: 4,
    contacts: 1200,
    sent: 3456,
    opened: 1589,
    openRate: 46.0,
    replied: 234,
    replyRate: 6.8,
    createdAt: "Jan 28, 2026",
  },
  {
    id: "3",
    name: "Follow-up Sequence",
    status: "paused",
    steps: 2,
    contacts: 89,
    sent: 145,
    opened: 52,
    openRate: 35.9,
    replied: 12,
    replyRate: 8.3,
    createdAt: "Feb 1, 2026",
  },
  {
    id: "4",
    name: "Cold Outreach - D2C Brands",
    status: "draft",
    steps: 3,
    contacts: 0,
    sent: 0,
    opened: 0,
    openRate: 0,
    replied: 0,
    replyRate: 0,
    createdAt: "Feb 5, 2026",
  },
];

const statusConfig = {
  active: { label: "Active", color: "bg-green-100 text-green-700", icon: Play },
  paused: { label: "Paused", color: "bg-yellow-100 text-yellow-700", icon: Pause },
  draft: { label: "Draft", color: "bg-slate-100 text-slate-700", icon: null },
  completed: { label: "Completed", color: "bg-blue-100 text-blue-700", icon: null },
};

export default function CampaignsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [newCampaignName, setNewCampaignName] = useState("");

  const filteredCampaigns = campaigns.filter((campaign) =>
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-slate-500">{campaigns.length} total campaigns</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Start a new email sequence to reach your contacts
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="campaignName">Campaign name</Label>
                <Input
                  id="campaignName"
                  placeholder="e.g., Q1 Outreach"
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline">Cancel</Button>
              <Link href="/dashboard/campaigns/new">
                <Button>Create Campaign</Button>
              </Link>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search campaigns..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Campaign Cards */}
      <div className="grid gap-4">
        {filteredCampaigns.map((campaign) => {
          const status = statusConfig[campaign.status as keyof typeof statusConfig];
          return (
            <Card key={campaign.id} className="hover:border-blue-200 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Link 
                        href={`/dashboard/campaigns/${campaign.id}`}
                        className="text-lg font-semibold hover:text-blue-600"
                      >
                        {campaign.name}
                      </Link>
                      <Badge className={status.color}>{status.label}</Badge>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {campaign.steps} steps
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {campaign.contacts} contacts
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {campaign.createdAt}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {campaign.status === "active" && (
                      <Button variant="outline" size="sm">
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </Button>
                    )}
                    {campaign.status === "paused" && (
                      <Button variant="outline" size="sm">
                        <Play className="h-4 w-4 mr-1" />
                        Resume
                      </Button>
                    )}
                    {campaign.status === "draft" && (
                      <Button size="sm">
                        <Play className="h-4 w-4 mr-1" />
                        Launch
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Stats */}
                {campaign.sent > 0 && (
                  <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t">
                    <div>
                      <p className="text-2xl font-semibold">{campaign.sent.toLocaleString()}</p>
                      <p className="text-sm text-slate-500">Emails Sent</p>
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">
                        {campaign.opened.toLocaleString()}
                        <span className="text-sm font-normal text-slate-500 ml-1">
                          ({campaign.openRate}%)
                        </span>
                      </p>
                      <p className="text-sm text-slate-500 flex items-center gap-1">
                        <MousePointerClick className="h-3 w-3" />
                        Opened
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">
                        {campaign.replied}
                        <span className="text-sm font-normal text-slate-500 ml-1">
                          ({campaign.replyRate}%)
                        </span>
                      </p>
                      <p className="text-sm text-slate-500 flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        Replied
                      </p>
                    </div>
                    <div className="flex items-center justify-end">
                      <Link href={`/dashboard/campaigns/${campaign.id}`}>
                        <Button variant="ghost" size="sm">
                          View Details
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredCampaigns.length === 0 && (
        <Card className="p-12 text-center">
          <Mail className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
          <p className="text-slate-500 mb-4">
            {searchQuery
              ? "Try a different search term"
              : "Create your first campaign to start reaching out"}
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </Card>
      )}
    </div>
  );
}
