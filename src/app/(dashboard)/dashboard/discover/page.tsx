"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Building2,
  Users,
  Loader2,
  Download,
  Plus,
  Globe,
  Sparkles,
  Rocket,
  Code,
  MessageSquare,
  Github,
  Twitter,
  Mail,
  ExternalLink,
  Zap,
  RefreshCw,
} from "lucide-react";
import { useContacts } from "@/lib/hooks/use-contacts";
import { useToast } from "@/hooks/use-toast";

interface Lead {
  name: string;
  email?: string;
  company?: string;
  title?: string;
  source: string;
  url?: string;
  username?: string;
  followers?: number;
  karma?: number;
  twitter?: string;
  website?: string;
}

export default function DiscoverPage() {
  const { addContact, refresh: refreshContacts } = useContacts();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isAutoDiscovering, setIsAutoDiscovering] = useState(false);
  const [activeSource, setActiveSource] = useState("domain");
  
  // Search states
  const [domain, setDomain] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [githubType, setGithubType] = useState("stargazers");
  const [twitterUser, setTwitterUser] = useState("");
  const [twitterType, setTwitterType] = useState("followers");
  const [subreddit, setSubreddit] = useState("");
  const [hnQuery, setHnQuery] = useState("Show HN");

  const sources = [
    { id: "domain", name: "Domain Search", icon: Building2, description: "Find emails at a company" },
    { id: "github", name: "GitHub", icon: Github, description: "Repo stargazers & contributors" },
    { id: "twitter", name: "Twitter/X", icon: Twitter, description: "Followers of accounts" },
    { id: "reddit", name: "Reddit", icon: MessageSquare, description: "Subreddit posters" },
    { id: "hackernews", name: "Hacker News", icon: Code, description: "Show HN posters" },
    { id: "producthunt", name: "Product Hunt", icon: Rocket, description: "Recent makers" },
  ];

  const handleSearch = async () => {
    setLoading(true);
    setLeads([]);
    
    try {
      let endpoint = "";
      let body = {};

      switch (activeSource) {
        case "domain":
          endpoint = "/api/discover/domain";
          body = { domain };
          break;
        case "github":
          endpoint = "/api/discover/github";
          body = { repo: githubRepo, type: githubType };
          break;
        case "twitter":
          endpoint = "/api/discover/twitter";
          body = { username: twitterUser, type: twitterType };
          break;
        case "reddit":
          endpoint = "/api/discover/reddit";
          body = { subreddit };
          break;
        case "hackernews":
          endpoint = "/api/discover/hackernews";
          body = { query: hnQuery };
          break;
        case "producthunt":
          endpoint = "/api/discover/producthunt";
          body = { days: 7 };
          break;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.error) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      } else if (data.leads) {
        setLeads(data.leads);
        if (data.demo) {
          toast({ 
            title: "Demo Mode", 
            description: data.note || "Add API key for real results",
          });
        } else {
          toast({ title: "Success", description: `Found ${data.leads.length} leads` });
        }
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to search", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleLead = (key: string) => {
    setSelectedLeads((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads.map((_, i) => String(i)));
    }
  };

  const handleImportSelected = async () => {
    const toImport = leads.filter((_, i) => selectedLeads.includes(String(i)));
    if (toImport.length === 0) return;
    
    setIsImporting(true);
    let count = 0;
    
    for (const lead of toImport) {
      const nameParts = lead.name.split(" ");
      const result = await addContact({
        email: lead.email || `${lead.username || lead.name.toLowerCase().replace(/\s/g, "")}@placeholder.com`,
        first_name: nameParts[0],
        last_name: nameParts.slice(1).join(" "),
        company: lead.company,
        title: lead.title,
      });
      if (result.success) count++;
    }
    
    setIsImporting(false);
    toast({ title: "Imported", description: `Added ${count} contacts` });
    setSelectedLeads([]);
  };

  const handleExportCSV = () => {
    const headers = ["name", "email", "company", "title", "source", "url", "followers"];
    const rows = leads.map((l) => [
      l.name,
      l.email || "",
      l.company || "",
      l.title || "",
      l.source,
      l.url || "",
      l.followers || "",
    ]);
    
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${activeSource}.csv`;
    a.click();
  };

  const renderSearchForm = () => {
    switch (activeSource) {
      case "domain":
        return (
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Company Domain</Label>
              <Input
                placeholder="stripe.com, notion.so"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
          </div>
        );
      
      case "github":
        return (
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Repository (owner/repo)</Label>
              <Input
                placeholder="vercel/next.js"
                value={githubRepo}
                onChange={(e) => setGithubRepo(e.target.value)}
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={githubType} onValueChange={setGithubType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stargazers">Stargazers</SelectItem>
                  <SelectItem value="contributors">Contributors</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      
      case "twitter":
        return (
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Twitter Handle</Label>
              <Input
                placeholder="elonmusk (without @)"
                value={twitterUser}
                onChange={(e) => setTwitterUser(e.target.value)}
              />
            </div>
            <div>
              <Label>Get their</Label>
              <Select value={twitterType} onValueChange={setTwitterType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="followers">Followers</SelectItem>
                  <SelectItem value="following">Following</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      
      case "reddit":
        return (
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Subreddit</Label>
              <Input
                placeholder="SaaS, startups, entrepreneur"
                value={subreddit}
                onChange={(e) => setSubreddit(e.target.value)}
              />
            </div>
          </div>
        );
      
      case "hackernews":
        return (
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Search Query</Label>
              <Input
                placeholder="Show HN, Launch HN, YC"
                value={hnQuery}
                onChange={(e) => setHnQuery(e.target.value)}
              />
            </div>
          </div>
        );
      
      case "producthunt":
        return (
          <div>
            <p className="text-sm text-slate-500">
              Fetches makers who launched products in the last 7 days
            </p>
          </div>
        );
    }
  };

  const handleAutoDiscover = async () => {
    setIsAutoDiscovering(true);
    
    try {
      const res = await fetch("/api/discover/auto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sources: ["hackernews", "reddit"],
          limit: 30,
          auto_enrich: true,
        }),
      });

      const data = await res.json();

      if (data.error) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      } else {
        toast({ 
          title: "Auto-Discovery Complete!", 
          description: `Found ${data.found} leads, added ${data.inserted} new contacts` 
        });
        refreshContacts();
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to auto-discover", variant: "destructive" });
    } finally {
      setIsAutoDiscovering(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Discover Leads</h1>
          <p className="text-slate-500">Find prospects from multiple sources</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAutoDiscover} disabled={isAutoDiscovering} className="bg-gradient-to-r from-purple-600 to-blue-600">
            {isAutoDiscovering ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Auto-Discover Now
          </Button>
        </div>
      </div>
      
      {/* Manual search results actions */}
      {leads.length > 0 && (
        <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={handleImportSelected} disabled={selectedLeads.length === 0 || isImporting}>
              {isImporting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <Plus className="h-4 w-4 mr-2" />
              Import {selectedLeads.length || ""} Selected
            </Button>
          </div>
        )}
      </div>

      {/* Source Selection */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {sources.map((source) => (
          <Card
            key={source.id}
            className={`cursor-pointer transition-all hover:border-blue-300 ${
              activeSource === source.id ? "border-blue-500 bg-blue-50" : ""
            }`}
            onClick={() => {
              setActiveSource(source.id);
              setLeads([]);
              setSelectedLeads([]);
            }}
          >
            <CardContent className="p-4 text-center">
              <source.icon className={`h-6 w-6 mx-auto mb-2 ${
                activeSource === source.id ? "text-blue-600" : "text-slate-400"
              }`} />
              <p className="text-sm font-medium">{source.name}</p>
              <p className="text-xs text-slate-500 mt-1">{source.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search Form */}
      <Card>
        <CardContent className="pt-6">
          {renderSearchForm()}
          <Button 
            className="mt-4" 
            onClick={handleSearch} 
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
            Search
          </Button>
        </CardContent>
      </Card>

      {/* Results Table */}
      {leads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Results ({leads.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedLeads.length === leads.length && leads.length > 0}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email / Handle</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Info</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Checkbox
                        checked={selectedLeads.includes(String(i))}
                        onCheckedChange={() => toggleLead(String(i))}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>
                      {lead.email ? (
                        <span className="text-sm">{lead.email}</span>
                      ) : lead.username ? (
                        <span className="text-sm text-slate-500">@{lead.username}</span>
                      ) : (
                        <Badge variant="outline" className="text-xs">No email</Badge>
                      )}
                    </TableCell>
                    <TableCell>{lead.company || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        {lead.followers && (
                          <span>{lead.followers.toLocaleString()} followers</span>
                        )}
                        {lead.karma && (
                          <span>{lead.karma.toLocaleString()} karma</span>
                        )}
                        {lead.twitter && (
                          <Badge variant="outline">@{lead.twitter}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{lead.source}</Badge>
                    </TableCell>
                    <TableCell>
                      {lead.url && (
                        <a href={lead.url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {leads.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">Select a source and search to find leads</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
