"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Loader2,
  CheckCircle2,
  XCircle,
  Download,
  UserPlus,
  Sparkles,
  Globe,
} from "lucide-react";

interface EnrichmentResult {
  domain: string;
  success: boolean;
  email?: string;
  verified?: boolean;
  error?: string;
}

export default function FindLeadsPage() {
  const [domains, setDomains] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<EnrichmentResult[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  const handleEnrich = async () => {
    const domainList = domains
      .split(/[\n,]/)
      .map((d) => d.trim())
      .filter((d) => d && d.includes("."));

    if (domainList.length === 0) {
      alert("Please enter at least one domain");
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      const res = await fetch("/api/enrich/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domains: domainList }),
      });
      const data = await res.json();

      if (data.results) {
        setResults(data.results);
        // Auto-select successful ones
        setSelected(
          data.results
            .filter((r: EnrichmentResult) => r.success)
            .map((r: EnrichmentResult) => r.email!)
        );
      }
    } catch (error) {
      alert("Error during enrichment");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToContacts = async () => {
    const toAdd = results.filter((r) => r.success && selected.includes(r.email!));

    for (const result of toAdd) {
      await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: result.email,
          company: result.domain.replace(/\.(com|co|io|org|net)$/, ""),
          email_verified: result.verified,
          tags: ["enriched"],
        }),
      });
    }

    alert(`Added ${toAdd.length} contacts!`);
  };

  const handleExport = () => {
    const successful = results.filter((r) => r.success);
    const csv = [
      "email,domain,verified",
      ...successful.map((r) => `${r.email},${r.domain},${r.verified}`),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "enriched_leads.csv";
    a.click();
  };

  const successCount = results.filter((r) => r.success).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Find Leads</h1>
        <p className="text-slate-500">
          Enter company domains to find verified email addresses
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Enter Domains
            </CardTitle>
            <CardDescription>
              One domain per line, or comma-separated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domains">Company Domains</Label>
              <Textarea
                id="domains"
                placeholder="example.com
acme.io
startup.co"
                value={domains}
                onChange={(e) => setDomains(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
            <p className="text-xs text-slate-500">
              {domains.split(/[\n,]/).filter((d) => d.trim()).length} domains
              entered
            </p>
            <Button
              onClick={handleEnrich}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Finding emails...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Find Emails
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">How it works</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• We search multiple email databases</li>
                <li>• Each email is verified for deliverability</li>
                <li>• Only valid emails are returned</li>
                <li>• Results are saved to your contacts</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Best practices</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Use company domains, not personal emails</li>
                <li>• Batch up to 50 domains at once</li>
                <li>• Verified emails have higher deliverability</li>
              </ul>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Free tier:</strong> 50 enrichments/month
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Results</CardTitle>
                <CardDescription>
                  Found {successCount} of {results.length} emails
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleExport}
                  disabled={successCount === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  onClick={handleAddToContacts}
                  disabled={selected.length === 0}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add {selected.length} to Contacts
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selected.length === successCount}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelected(
                            results
                              .filter((r) => r.success)
                              .map((r) => r.email!)
                          );
                        } else {
                          setSelected([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {result.success && (
                        <Checkbox
                          checked={selected.includes(result.email!)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelected([...selected, result.email!]);
                            } else {
                              setSelected(
                                selected.filter((e) => e !== result.email)
                              );
                            }
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{result.domain}</TableCell>
                    <TableCell>
                      {result.success ? (
                        <span className="font-mono text-sm">{result.email}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {result.success ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          {result.verified ? (
                            <Badge className="bg-green-100 text-green-700">
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Found</Badge>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-500">
                          <XCircle className="h-4 w-4" />
                          <span className="text-sm">{result.error}</span>
                        </div>
                      )}
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
