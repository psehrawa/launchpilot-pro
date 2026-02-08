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
} from "lucide-react";
import { useContacts } from "@/lib/hooks/use-contacts";
import { useToast } from "@/hooks/use-toast";

interface Lead {
  name: string;
  email?: string;
  company: string;
  title?: string;
  source: string;
  url?: string;
}

export default function DiscoverPage() {
  const { addContact } = useContacts();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  
  // Domain search
  const [domain, setDomain] = useState("");
  
  // Product Hunt
  const [phDays, setPhDays] = useState("7");
  
  // Hacker News
  const [hnQuery, setHnQuery] = useState("Show HN");

  const handleDomainSearch = async () => {
    if (!domain) return;
    setLoading(true);
    
    try {
      const res = await fetch("/api/discover/domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      
      const data = await res.json();
      
      if (data.leads) {
        setLeads(data.leads);
        toast({ title: "Success", description: `Found ${data.leads.length} contacts` });
      } else {
        toast({ title: "No results", description: data.error || "No emails found", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to search domain", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleProductHuntScrape = async () => {
    setLoading(true);
    
    try {
      const res = await fetch("/api/discover/producthunt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: parseInt(phDays) }),
      });
      
      const data = await res.json();
      
      if (data.leads) {
        setLeads(data.leads);
        toast({ title: "Success", description: `Found ${data.leads.length} makers` });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to fetch", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleHNScrape = async () => {
    setLoading(true);
    
    try {
      const res = await fetch("/api/discover/hackernews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: hnQuery }),
      });
      
      const data = await res.json();
      
      if (data.leads) {
        setLeads(data.leads);
        toast({ title: "Success", description: `Found ${data.leads.length} posters` });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to fetch", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleLead = (email: string) => {
    setSelectedLeads((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const toggleAll = () => {
    const withEmails = leads.filter((l) => l.email);
    if (selectedLeads.length === withEmails.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(withEmails.map((l) => l.email!));
    }
  };

  const handleImportSelected = async () => {
    const toImport = leads.filter((l) => l.email && selectedLeads.includes(l.email));
    if (toImport.length === 0) return;
    
    setIsImporting(true);
    let count = 0;
    
    for (const lead of toImport) {
      const nameParts = lead.name.split(" ");
      const result = await addContact({
        email: lead.email!,
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
    const headers = ["name", "email", "company", "title", "source"];
    const rows = leads.map((l) => [
      l.name,
      l.email || "",
      l.company,
      l.title || "",
      l.source,
    ]);
    
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads.csv";
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Discover Leads</h1>
          <p className="text-slate-500">Find new prospects from multiple sources</p>
        </div>
        {leads.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={handleImportSelected} disabled={selectedLeads.length === 0 || isImporting}>
              {isImporting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <Plus className="h-4 w-4 mr-2" />
              Import {selectedLeads.length} Selected
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="domain" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="domain" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Domain Search
          </TabsTrigger>
          <TabsTrigger value="producthunt" className="flex items-center gap-2">
            <Rocket className="h-4 w-4" />
            Product Hunt
          </TabsTrigger>
          <TabsTrigger value="hackernews" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Hacker News
          </TabsTrigger>
          <TabsTrigger value="linkedin" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            LinkedIn Import
          </TabsTrigger>
        </TabsList>

        {/* Domain Search */}
        <TabsContent value="domain">
          <Card>
            <CardHeader>
              <CardTitle>Domain Search</CardTitle>
              <CardDescription>
                Find all email addresses at a company domain (uses Hunter.io)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Company Domain</Label>
                  <Input
                    placeholder="stripe.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleDomainSearch()}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleDomainSearch} disabled={loading || !domain}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                    Search
                  </Button>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Requires Hunter.io API key in Settings → API Keys
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Hunt */}
        <TabsContent value="producthunt">
          <Card>
            <CardHeader>
              <CardTitle>Product Hunt Makers</CardTitle>
              <CardDescription>
                Find founders who recently launched products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div>
                  <Label>Last N Days</Label>
                  <Input
                    type="number"
                    value={phDays}
                    onChange={(e) => setPhDays(e.target.value)}
                    className="w-24"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleProductHuntScrape} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Rocket className="h-4 w-4 mr-2" />}
                    Fetch Makers
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hacker News */}
        <TabsContent value="hackernews">
          <Card>
            <CardHeader>
              <CardTitle>Hacker News</CardTitle>
              <CardDescription>
                Find people posting "Show HN" or launching projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Search Query</Label>
                  <Input
                    placeholder="Show HN"
                    value={hnQuery}
                    onChange={(e) => setHnQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleHNScrape} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Code className="h-4 w-4 mr-2" />}
                    Search HN
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LinkedIn Import */}
        <TabsContent value="linkedin">
          <Card>
            <CardHeader>
              <CardTitle>LinkedIn Import</CardTitle>
              <CardDescription>
                Import contacts from LinkedIn Sales Navigator export
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500 mb-4">
                  Export your LinkedIn connections or Sales Navigator list as CSV, then import
                </p>
                <Button variant="outline" onClick={() => {
                  // Trigger file input on contacts page
                  window.location.href = "/dashboard/contacts";
                }}>
                  Go to Import
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
                      checked={selectedLeads.length === leads.filter((l) => l.email).length && leads.filter((l) => l.email).length > 0}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      {lead.email && (
                        <Checkbox
                          checked={selectedLeads.includes(lead.email)}
                          onCheckedChange={() => toggleLead(lead.email!)}
                        />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>
                      {lead.email ? (
                        <span className="text-sm">{lead.email}</span>
                      ) : (
                        <Badge variant="outline" className="text-xs">No email</Badge>
                      )}
                    </TableCell>
                    <TableCell>{lead.company}</TableCell>
                    <TableCell>{lead.title || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{lead.source}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
