"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  ArrowLeft,
  Plus,
  Trash2,
  Play,
  Pause,
  Mail,
  Clock,
  Users,
  Loader2,
  GripVertical,
  Send,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Campaign {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

interface SequenceStep {
  id: string;
  campaign_id: string;
  step_number: number;
  subject: string;
  body: string;
  delay_days: number;
}

interface Contact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const campaignId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [steps, setSteps] = useState<SequenceStep[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [addStepOpen, setAddStepOpen] = useState(false);
  const [addContactsOpen, setAddContactsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [newStep, setNewStep] = useState({
    subject: "",
    body: "",
    delay_days: 0,
  });

  const supabase = createClient();

  useEffect(() => {
    const loadCampaign = async () => {
      // Load campaign
      const { data: campaignData } = await supabase
        .from("lp_campaigns")
        .select("*")
        .eq("id", campaignId)
        .single();

      if (campaignData) {
        setCampaign(campaignData);
      }

      // Load steps
      const { data: stepsData } = await supabase
        .from("lp_sequence_steps")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("step_number", { ascending: true });

      if (stepsData) {
        setSteps(stepsData);
      }

      // Load available contacts
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: membership } = await supabase
          .from("lp_org_members")
          .select("org_id")
          .eq("user_id", user.id)
          .limit(1)
          .single();

        if (membership) {
          const { data: contactsData } = await supabase
            .from("lp_contacts")
            .select("id, email, first_name, last_name")
            .eq("org_id", membership.org_id)
            .eq("status", "new")
            .limit(100);

          if (contactsData) {
            setContacts(contactsData);
          }
        }
      }

      setLoading(false);
    };

    loadCampaign();
  }, [campaignId, supabase]);

  const handleAddStep = async () => {
    if (!newStep.subject || !newStep.body) {
      toast({ title: "Error", description: "Subject and body are required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const stepNumber = steps.length + 1;

    const { data, error } = await supabase
      .from("lp_sequence_steps")
      .insert([{
        campaign_id: campaignId,
        step_number: stepNumber,
        subject: newStep.subject,
        body: newStep.body,
        delay_days: newStep.delay_days,
      }])
      .select()
      .single();

    setIsSubmitting(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (data) {
      setSteps([...steps, data]);
      setAddStepOpen(false);
      setNewStep({ subject: "", body: "", delay_days: 0 });
      toast({ title: "Success", description: "Step added" });
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    const { error } = await supabase
      .from("lp_sequence_steps")
      .delete()
      .eq("id", stepId);

    if (!error) {
      setSteps(steps.filter((s) => s.id !== stepId));
      toast({ title: "Success", description: "Step deleted" });
    }
  };

  const handleStatusToggle = async () => {
    if (!campaign) return;
    const newStatus = campaign.status === "active" ? "paused" : "active";

    const { error } = await supabase
      .from("lp_campaigns")
      .update({ status: newStatus })
      .eq("id", campaignId);

    if (!error) {
      setCampaign({ ...campaign, status: newStatus });
      toast({ title: "Success", description: `Campaign ${newStatus}` });
    }
  };

  const handleSendToContacts = async () => {
    if (selectedContacts.length === 0) {
      toast({ title: "Error", description: "Select at least one contact", variant: "destructive" });
      return;
    }

    if (steps.length === 0) {
      toast({ title: "Error", description: "Add at least one email step first", variant: "destructive" });
      return;
    }

    setIsSending(true);

    try {
      const res = await fetch("/api/campaigns/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: campaignId,
          contact_ids: selectedContacts,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast({ title: "Success", description: `Sent to ${data.sent} contacts` });
        setAddContactsOpen(false);
        setSelectedContacts([]);
        
        // Update contact statuses locally
        setContacts(contacts.filter((c) => !selectedContacts.includes(c.id)));
      } else {
        toast({ title: "Error", description: data.error || "Failed to send", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to send emails", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Campaign not found</p>
        <Link href="/dashboard/campaigns">
          <Button variant="link">Back to campaigns</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/campaigns">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{campaign.name}</h1>
              <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                {campaign.status}
              </Badge>
            </div>
            <p className="text-slate-500">
              {steps.length} step{steps.length !== 1 && "s"} · Created {new Date(campaign.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={addContactsOpen} onOpenChange={setAddContactsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Add Contacts
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Send Campaign</DialogTitle>
                <DialogDescription>
                  Select contacts to send this sequence to
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-64 overflow-auto border rounded">
                {contacts.length === 0 ? (
                  <p className="p-4 text-center text-slate-500">No new contacts available</p>
                ) : (
                  <div className="divide-y">
                    {contacts.map((contact) => (
                      <label
                        key={contact.id}
                        className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedContacts.includes(contact.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedContacts([...selectedContacts, contact.id]);
                            } else {
                              setSelectedContacts(selectedContacts.filter((id) => id !== contact.id));
                            }
                          }}
                          className="rounded"
                        />
                        <div>
                          <p className="text-sm font-medium">
                            {contact.first_name} {contact.last_name}
                          </p>
                          <p className="text-xs text-slate-500">{contact.email}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddContactsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendToContacts} disabled={isSending || selectedContacts.length === 0}>
                  {isSending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  <Send className="h-4 w-4 mr-2" />
                  Send to {selectedContacts.length} Contact{selectedContacts.length !== 1 && "s"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button onClick={handleStatusToggle}>
            {campaign.status === "active" ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Activate
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Sequence Steps */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Email Sequence</CardTitle>
            <CardDescription>Emails will be sent in order with delays</CardDescription>
          </div>
          <Dialog open={addStepOpen} onOpenChange={setAddStepOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Step
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Email Step</DialogTitle>
                <DialogDescription>
                  Create a new email in your sequence
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Delay (days after previous step)</Label>
                  <Select
                    value={String(newStep.delay_days)}
                    onValueChange={(v) => setNewStep({ ...newStep, delay_days: parseInt(v) })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Immediately</SelectItem>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="2">2 days</SelectItem>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="5">5 days</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subject Line</Label>
                  <Input
                    placeholder="Re: Quick question about {{company}}"
                    value={newStep.subject}
                    onChange={(e) => setNewStep({ ...newStep, subject: e.target.value })}
                  />
                  <p className="text-xs text-slate-500">
                    Use {"{{first_name}}"}, {"{{company}}"}, {"{{title}}"} for personalization
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Email Body</Label>
                  <Textarea
                    placeholder="Hi {{first_name}},&#10;&#10;I wanted to follow up..."
                    rows={8}
                    value={newStep.body}
                    onChange={(e) => setNewStep({ ...newStep, body: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddStepOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddStep} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Add Step
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {steps.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Mail className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 mb-2">No email steps yet</p>
              <Button variant="outline" onClick={() => setAddStepOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Step
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-center gap-2 text-slate-400">
                    <GripVertical className="h-4 w-4" />
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium text-sm">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {step.delay_days > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {step.delay_days} day{step.delay_days > 1 && "s"} later
                        </Badge>
                      )}
                      {step.delay_days === 0 && index === 0 && (
                        <Badge variant="outline" className="text-xs">
                          Sent immediately
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium truncate">{step.subject}</p>
                    <p className="text-sm text-slate-500 line-clamp-2 mt-1">{step.body}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-red-600"
                    onClick={() => handleDeleteStep(step.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Placeholder */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-slate-500">Recipients</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-slate-500">Sent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-slate-500">Opened</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-slate-500">Replied</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
