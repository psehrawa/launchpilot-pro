"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sparkles, Loader2, Copy, Check, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AIEmailWriterProps {
  lead?: {
    first_name?: string;
    last_name?: string;
    name?: string;
    email?: string;
    company?: string;
    title?: string;
    source?: string;
  };
  onInsert?: (subject: string, body: string) => void;
}

export function AIEmailWriter({ lead, onInsert }: AIEmailWriterProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [tone, setTone] = useState("professional");
  const [goal, setGoal] = useState("book_call");
  const [context, setContext] = useState("");
  
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [generatedSubject, setGeneratedSubject] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    
    try {
      const res = await fetch("/api/ai/write-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead: lead || { name: "there", company: "their company" },
          context,
          tone,
          goal,
        }),
      });

      const data = await res.json();

      if (data.error) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      } else {
        setGeneratedEmail(data.email);
        setGeneratedSubject(data.subject);
        
        if (data.provider === "template") {
          toast({ 
            title: "Note", 
            description: "Add GROQ_API_KEY or OPENAI_API_KEY for AI-generated emails",
          });
        }
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to generate email", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${generatedSubject}\n\n${generatedEmail}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied", description: "Email copied to clipboard" });
  };

  const handleInsert = () => {
    if (onInsert) {
      onInsert(generatedSubject, generatedEmail);
      setOpen(false);
      toast({ title: "Inserted", description: "Email added to your campaign" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Sparkles className="h-4 w-4 mr-2" />
          AI Write
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI Email Writer
          </DialogTitle>
          <DialogDescription>
            Generate a personalized cold email
            {lead?.first_name && ` for ${lead.first_name}`}
            {lead?.company && ` at ${lead.company}`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="direct">Direct</SelectItem>
                  <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Goal</Label>
              <Select value={goal} onValueChange={setGoal}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="book_call">Book a Call</SelectItem>
                  <SelectItem value="get_reply">Get a Reply</SelectItem>
                  <SelectItem value="share_resource">Share a Resource</SelectItem>
                  <SelectItem value="intro_request">Ask for Intro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Additional Context (optional)</Label>
            <Textarea
              placeholder="E.g., They recently raised funding, launched a new product, posted about X on Twitter..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={2}
            />
          </div>

          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generate Email
          </Button>

          {generatedEmail && (
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
              <div>
                <Label className="text-xs text-slate-500">Subject</Label>
                <p className="font-medium">{generatedSubject}</p>
              </div>
              <div>
                <Label className="text-xs text-slate-500">Body</Label>
                <pre className="text-sm whitespace-pre-wrap font-sans mt-1">
                  {generatedEmail}
                </pre>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleGenerate}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Regenerate
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
                {onInsert && (
                  <Button size="sm" onClick={handleInsert}>
                    Use This Email
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
