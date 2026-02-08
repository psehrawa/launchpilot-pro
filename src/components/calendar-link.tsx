"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Copy, Check, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CalendarLinkProps {
  onInsert?: (link: string, text: string) => void;
}

export function CalendarLink({ onInsert }: CalendarLinkProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [provider, setProvider] = useState("calendly");
  const [link, setLink] = useState("");
  const [displayText, setDisplayText] = useState("Book a time that works for you");

  // Load saved link from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("calendarLink");
    if (saved) {
      const parsed = JSON.parse(saved);
      setProvider(parsed.provider || "calendly");
      setLink(parsed.link || "");
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("calendarLink", JSON.stringify({ provider, link }));
    toast({ title: "Saved", description: "Calendar link saved" });
  };

  const getFormattedLink = () => {
    if (!link) return "";
    
    // Ensure proper URL format
    let url = link;
    if (!url.startsWith("http")) {
      if (provider === "calendly") {
        url = `https://calendly.com/${link}`;
      } else if (provider === "cal") {
        url = `https://cal.com/${link}`;
      }
    }
    
    return url;
  };

  const handleCopy = () => {
    const formattedLink = getFormattedLink();
    const text = `[${displayText}](${formattedLink})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    if (onInsert) {
      const formattedLink = getFormattedLink();
      onInsert(formattedLink, displayText);
      setOpen(false);
    }
  };

  const previewText = `
Here's my calendar if you'd like to book a time:
${getFormattedLink()}

Or just reply to this email and we can find a time.`.trim();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Calendar className="h-4 w-4 mr-2" />
          Add Calendar Link
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Calendar Booking Link
          </DialogTitle>
          <DialogDescription>
            Add your booking link to make scheduling easy
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="calendly">Calendly</SelectItem>
                <SelectItem value="cal">Cal.com</SelectItem>
                <SelectItem value="hubspot">HubSpot Meetings</SelectItem>
                <SelectItem value="custom">Custom URL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              {provider === "calendly" && "Calendly Username or URL"}
              {provider === "cal" && "Cal.com Username or URL"}
              {provider === "hubspot" && "HubSpot Meetings URL"}
              {provider === "custom" && "Full Booking URL"}
            </Label>
            <Input
              placeholder={
                provider === "calendly" ? "yourname or calendly.com/yourname/30min" :
                provider === "cal" ? "yourname or cal.com/yourname" :
                "https://..."
              }
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Display Text</Label>
            <Input
              placeholder="Book a time that works for you"
              value={displayText}
              onChange={(e) => setDisplayText(e.target.value)}
            />
          </div>

          {link && (
            <div className="p-4 bg-slate-50 rounded-lg">
              <Label className="text-xs text-slate-500">Preview</Label>
              <pre className="text-sm whitespace-pre-wrap mt-2 font-sans">
                {previewText}
              </pre>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleSave}>
            Save Link
          </Button>
          <Button variant="outline" onClick={handleCopy} disabled={!link}>
            {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
            Copy
          </Button>
          {link && (
            <a href={getFormattedLink()} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">
                <ExternalLink className="h-4 w-4 mr-1" />
                Test
              </Button>
            </a>
          )}
          {onInsert && (
            <Button onClick={handleInsert} disabled={!link}>
              Insert in Email
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
