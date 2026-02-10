"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  Inbox,
  Star,
  Archive,
  Trash2,
  Reply,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
  Mail,
  ThumbsUp,
  ThumbsDown,
  Calendar,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EmailThread {
  id: string;
  contact: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    company: string | null;
  };
  campaign: {
    id: string;
    name: string;
  };
  lastEmail: {
    subject: string;
    status: string;
    sent_at: string;
  };
  events: {
    opened: boolean;
    clicked: boolean;
    replied: boolean;
  };
  replyType?: "positive" | "negative" | "neutral" | "meeting";
}

export default function InboxPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<EmailThread | null>(null);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const supabase = createClient();

  useEffect(() => {
    loadThreads();
  }, []);

  const loadThreads = async () => {
    setLoading(true);
    try {
      // Get emails with contact and campaign info
      const { data: emails, error } = await supabase
        .from("lp_emails_sent")
        .select(`
          id,
          subject,
          status,
          sent_at,
          tracking_id,
          contact:lp_contacts(id, email, first_name, last_name, company),
          campaign:lp_campaigns(id, name)
        `)
        .order("sent_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get events for each email
      const emailIds = emails?.map((e) => e.id) || [];
      const { data: events } = await supabase
        .from("lp_email_events")
        .select("email_id, event_type")
        .in("email_id", emailIds);

      // Build threads
      const threadMap = new Map<string, EmailThread>();

      for (const email of emails || []) {
        // Handle Supabase join returning arrays
        const contact = Array.isArray(email.contact) ? email.contact[0] : email.contact;
        const campaign = Array.isArray(email.campaign) ? email.campaign[0] : email.campaign;
        
        if (!contact) continue;

        const contactId = contact.id;
        const emailEvents = events?.filter((e) => e.email_id === email.id) || [];

        if (!threadMap.has(contactId)) {
          threadMap.set(contactId, {
            id: email.id,
            contact: contact,
            campaign: campaign || { id: "", name: "Unknown" },
            lastEmail: {
              subject: email.subject || "",
              status: email.status,
              sent_at: email.sent_at,
            },
            events: {
              opened: emailEvents.some((e) => e.event_type === "opened"),
              clicked: emailEvents.some((e) => e.event_type === "clicked"),
              replied: emailEvents.some((e) => e.event_type === "replied"),
            },
          });
        }
      }

      setThreads(Array.from(threadMap.values()));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const markAsReplied = async (thread: EmailThread, replyType: EmailThread["replyType"]) => {
    try {
      // Add replied event
      await supabase.from("lp_email_events").insert([{
        email_id: thread.id,
        event_type: "replied",
        metadata: { replyType },
      }]);

      // Update contact status
      const newStatus = replyType === "meeting" ? "meeting" 
        : replyType === "positive" ? "replied"
        : replyType === "negative" ? "lost"
        : "replied";

      await supabase
        .from("lp_contacts")
        .update({ status: newStatus })
        .eq("id", thread.contact.id);

      toast({ title: "Updated", description: `Marked as ${replyType}` });
      loadThreads();
    } catch (err) {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
    }
  };

  const filteredThreads = threads.filter((thread) => {
    // Apply filter
    if (filter === "opened" && !thread.events.opened) return false;
    if (filter === "replied" && !thread.events.replied) return false;
    if (filter === "no-response" && (thread.events.opened || thread.events.replied)) return false;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesEmail = thread.contact.email.toLowerCase().includes(query);
      const matchesName = `${thread.contact.first_name} ${thread.contact.last_name}`.toLowerCase().includes(query);
      const matchesCompany = thread.contact.company?.toLowerCase().includes(query);
      if (!matchesEmail && !matchesName && !matchesCompany) return false;
    }

    return true;
  });

  const stats = {
    total: threads.length,
    opened: threads.filter((t) => t.events.opened).length,
    replied: threads.filter((t) => t.events.replied).length,
    noResponse: threads.filter((t) => !t.events.opened && !t.events.replied).length,
  };

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
          <h1 className="text-2xl font-bold">Inbox</h1>
          <p className="text-slate-500">Track responses to your campaigns</p>
        </div>
        <Button variant="outline" onClick={loadThreads}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:border-blue-300" onClick={() => setFilter("all")}>
          <CardContent className="p-4 text-center">
            <Mail className="h-6 w-6 mx-auto mb-2 text-slate-400" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-slate-500">Total Sent</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-blue-300" onClick={() => setFilter("opened")}>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{stats.opened}</p>
            <p className="text-xs text-slate-500">Opened</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-blue-300" onClick={() => setFilter("replied")}>
          <CardContent className="p-4 text-center">
            <Reply className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{stats.replied}</p>
            <p className="text-xs text-slate-500">Replied</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-blue-300" onClick={() => setFilter("no-response")}>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-orange-500" />
            <p className="text-2xl font-bold">{stats.noResponse}</p>
            <p className="text-xs text-slate-500">No Response</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, email, or company..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {["all", "opened", "replied", "no-response"].map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : f === "no-response" ? "No Response" : f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Thread List */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {filter === "all" ? "All Conversations" : `${filter.charAt(0).toUpperCase() + filter.slice(1)}`}
              <Badge variant="secondary" className="ml-2">{filteredThreads.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Inbox className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>No conversations yet</p>
              </div>
            ) : (
              <div className="divide-y max-h-[600px] overflow-auto">
                {filteredThreads.map((thread) => (
                  <div
                    key={thread.id}
                    className={`p-4 hover:bg-slate-50 cursor-pointer ${
                      selectedThread?.id === thread.id ? "bg-blue-50" : ""
                    }`}
                    onClick={() => setSelectedThread(thread)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarFallback className="text-xs">
                          {(thread.contact.first_name?.[0] || "") + (thread.contact.last_name?.[0] || "")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">
                            {thread.contact.first_name} {thread.contact.last_name}
                          </p>
                          {thread.events.replied && (
                            <Badge className="bg-green-100 text-green-700 text-xs">Replied</Badge>
                          )}
                          {thread.events.opened && !thread.events.replied && (
                            <Badge className="bg-blue-100 text-blue-700 text-xs">Opened</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 truncate">{thread.contact.email}</p>
                        <p className="text-xs text-slate-400 mt-1 truncate">{thread.lastEmail.subject}</p>
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {new Date(thread.lastEmail.sent_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail View */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversation Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedThread ? (
              <div className="space-y-6">
                {/* Contact Info */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {(selectedThread.contact.first_name?.[0] || "") + (selectedThread.contact.last_name?.[0] || "")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">
                      {selectedThread.contact.first_name} {selectedThread.contact.last_name}
                    </p>
                    <p className="text-sm text-slate-500">{selectedThread.contact.email}</p>
                    {selectedThread.contact.company && (
                      <p className="text-sm text-slate-400">{selectedThread.contact.company}</p>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="flex gap-2">
                  {selectedThread.events.opened && (
                    <Badge variant="outline" className="text-blue-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Opened
                    </Badge>
                  )}
                  {selectedThread.events.clicked && (
                    <Badge variant="outline" className="text-purple-600">
                      Clicked Link
                    </Badge>
                  )}
                  {selectedThread.events.replied && (
                    <Badge variant="outline" className="text-green-600">
                      <Reply className="h-3 w-3 mr-1" />
                      Replied
                    </Badge>
                  )}
                </div>

                {/* Campaign */}
                <div className="text-sm">
                  <span className="text-slate-500">Campaign: </span>
                  <span className="font-medium">{selectedThread.campaign.name}</span>
                </div>

                {/* Last Email */}
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="font-medium mb-2">{selectedThread.lastEmail.subject}</p>
                  <p className="text-xs text-slate-500">
                    Sent {new Date(selectedThread.lastEmail.sent_at).toLocaleString()}
                  </p>
                </div>

                {/* Reply Actions */}
                {!selectedThread.events.replied && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Did they reply?</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600"
                        onClick={() => markAsReplied(selectedThread, "positive")}
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        Positive
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-600"
                        onClick={() => markAsReplied(selectedThread, "meeting")}
                      >
                        <Calendar className="h-4 w-4 mr-1" />
                        Booked Meeting
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-orange-600"
                        onClick={() => markAsReplied(selectedThread, "neutral")}
                      >
                        Maybe Later
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600"
                        onClick={() => markAsReplied(selectedThread, "negative")}
                      >
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        Not Interested
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Inbox className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>Select a conversation to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
