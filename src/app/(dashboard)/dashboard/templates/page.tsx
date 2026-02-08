"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Copy,
  Trash2,
  MoreHorizontal,
  Star,
  Mail,
  Sparkles,
  Loader2,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Built-in templates
const builtInTemplates = [
  {
    id: "cold-intro",
    name: "Cold Introduction",
    category: "cold",
    subject: "Quick question about {{company}}",
    body: `Hi {{first_name}},

I noticed you're working on {{company}} and thought I'd reach out.

I'm building [Your Product] which helps [target audience] with [problem you solve].

Would you be open to a quick 15-min call this week to see if it might be useful for you?

Best,
[Your name]`,
    tags: ["cold", "intro", "meeting"],
  },
  {
    id: "follow-up-1",
    name: "First Follow-up",
    category: "followup",
    subject: "Re: Quick question about {{company}}",
    body: `Hi {{first_name}},

Just wanted to follow up on my previous email.

I know you're busy, so I'll keep this short - would love to get 15 minutes on your calendar to show you how [Your Product] could help {{company}}.

If this isn't a priority right now, just let me know and I'll check back in a few months.

Best,
[Your name]`,
    tags: ["followup", "polite"],
  },
  {
    id: "follow-up-2",
    name: "Second Follow-up",
    category: "followup",
    subject: "Re: Quick question about {{company}}",
    body: `Hi {{first_name}},

I wanted to try one more time before closing the loop.

I've helped companies like [Similar Company 1] and [Similar Company 2] achieve [specific result].

If you're interested in learning more, I'd be happy to share a quick case study.

If now isn't the right time, no worries - just reply "not now" and I'll stop reaching out.

Best,
[Your name]`,
    tags: ["followup", "breakup"],
  },
  {
    id: "value-add",
    name: "Value-First Approach",
    category: "cold",
    subject: "Idea for {{company}}",
    body: `Hi {{first_name}},

I was researching {{company}} and had a few ideas that might help with [specific challenge].

[Share 1-2 specific, actionable insights]

I've helped other [industry] companies implement similar strategies. Happy to share more if you're interested.

Best,
[Your name]`,
    tags: ["cold", "value", "research"],
  },
  {
    id: "referral",
    name: "Referral Request",
    category: "referral",
    subject: "Who should I talk to at {{company}}?",
    body: `Hi {{first_name}},

I'm trying to connect with the right person at {{company}} who handles [area].

I help [target audience] with [problem] and thought {{company}} might benefit.

Would you be able to point me in the right direction?

Thanks in advance,
[Your name]`,
    tags: ["referral", "intro"],
  },
  {
    id: "social-proof",
    name: "Social Proof",
    category: "cold",
    subject: "How [Similar Company] achieved [result]",
    body: `Hi {{first_name}},

I recently helped [Similar Company] achieve [specific result] in [timeframe].

Given {{company}}'s focus on [area], I thought you might find their approach interesting.

Would you like me to share the case study?

Best,
[Your name]`,
    tags: ["cold", "case-study", "social-proof"],
  },
  {
    id: "product-launch",
    name: "Product Launch",
    category: "announcement",
    subject: "We just launched something new",
    body: `Hi {{first_name}},

I wanted to personally let you know that we just launched [New Feature/Product].

It helps [target audience] to [benefit] by [how it works].

As someone who [connection/relevance], I thought you'd want to know first.

[CTA - try it free / book a demo / learn more]

Best,
[Your name]`,
    tags: ["launch", "announcement", "product"],
  },
  {
    id: "warm-intro",
    name: "Warm Introduction",
    category: "warm",
    subject: "[Mutual Connection] suggested I reach out",
    body: `Hi {{first_name}},

[Mutual Connection] mentioned that you might be interested in learning about [Your Product].

We help [target audience] with [problem], and [Mutual Connection] thought there might be a fit for {{company}}.

Would you have 15 minutes this week for a quick intro call?

Best,
[Your name]`,
    tags: ["warm", "referral", "mutual"],
  },
];

export default function TemplatesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState(builtInTemplates);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    subject: "",
    body: "",
    category: "cold",
  });

  const categories = [
    { id: "all", name: "All Templates" },
    { id: "cold", name: "Cold Outreach" },
    { id: "followup", name: "Follow-ups" },
    { id: "warm", name: "Warm Intros" },
    { id: "announcement", name: "Announcements" },
    { id: "referral", name: "Referrals" },
    { id: "custom", name: "My Templates" },
  ];

  const filteredTemplates = activeCategory === "all" 
    ? templates 
    : templates.filter((t) => t.category === activeCategory);

  const handleCopy = (template: typeof builtInTemplates[0]) => {
    const text = `Subject: ${template.subject}\n\n${template.body}`;
    navigator.clipboard.writeText(text);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Copied", description: "Template copied to clipboard" });
  };

  const handleCreate = () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.body) {
      toast({ title: "Error", description: "All fields required", variant: "destructive" });
      return;
    }

    const template = {
      id: `custom-${Date.now()}`,
      name: newTemplate.name,
      subject: newTemplate.subject,
      body: newTemplate.body,
      category: "custom",
      tags: ["custom"],
    };

    setTemplates([template, ...templates]);
    setCreateOpen(false);
    setNewTemplate({ name: "", subject: "", body: "", category: "cold" });
    toast({ title: "Created", description: "Template saved" });
  };

  const handleDelete = (id: string) => {
    setTemplates(templates.filter((t) => t.id !== id));
    toast({ title: "Deleted", description: "Template removed" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Email Templates</h1>
          <p className="text-slate-500">Battle-tested templates for cold outreach</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Template</DialogTitle>
              <DialogDescription>
                Create a reusable email template
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input
                  placeholder="My Cold Email v1"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Subject Line</Label>
                <Input
                  placeholder="Quick question about {{company}}"
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email Body</Label>
                <Textarea
                  rows={10}
                  placeholder="Hi {{first_name}}..."
                  value={newTemplate.body}
                  onChange={(e) => setNewTemplate({ ...newTemplate, body: e.target.value })}
                />
                <p className="text-xs text-slate-500">
                  Variables: {"{{first_name}}"}, {"{{last_name}}"}, {"{{company}}"}, {"{{title}}"}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>
                Save Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={activeCategory === cat.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:border-blue-200 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {template.subject}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleCopy(template)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </DropdownMenuItem>
                    {template.category === "custom" && (
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="text-xs text-slate-600 whitespace-pre-wrap line-clamp-4 font-sans">
                {template.body}
              </pre>
              <div className="flex items-center justify-between mt-4">
                <div className="flex gap-1">
                  {template.tags?.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleCopy(template)}
                >
                  {copiedId === template.id ? (
                    <Check className="h-4 w-4 mr-1" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1" />
                  )}
                  {copiedId === template.id ? "Copied" : "Copy"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tips Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            Cold Email Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-700 space-y-2">
          <p>• <strong>Subject lines:</strong> Keep under 50 chars, personalize with company name</p>
          <p>• <strong>First line:</strong> Reference something specific about them (not generic)</p>
          <p>• <strong>Body:</strong> Focus on their problem, not your features</p>
          <p>• <strong>CTA:</strong> One clear ask - book a call, reply, or check a link</p>
          <p>• <strong>Length:</strong> Under 100 words. Busy people skim.</p>
          <p>• <strong>Follow-ups:</strong> 3-5 touchpoints spaced 3-5 days apart</p>
        </CardContent>
      </Card>
    </div>
  );
}
