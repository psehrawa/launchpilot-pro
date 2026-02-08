"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  GripVertical,
  Mail,
  Clock,
  Sparkles,
  Users,
  Save,
  Play,
} from "lucide-react";
import Link from "next/link";

interface SequenceStep {
  id: string;
  subject: string;
  body: string;
  delayDays: number;
}

const defaultStep: SequenceStep = {
  id: "1",
  subject: "",
  body: "",
  delayDays: 0,
};

const personalizationVars = [
  { var: "{{firstName}}", label: "First Name" },
  { var: "{{lastName}}", label: "Last Name" },
  { var: "{{company}}", label: "Company" },
  { var: "{{title}}", label: "Job Title" },
  { var: "{{domain}}", label: "Domain" },
];

export default function NewCampaignPage() {
  const router = useRouter();
  const [campaignName, setCampaignName] = useState("");
  const [steps, setSteps] = useState<SequenceStep[]>([{ ...defaultStep }]);
  const [activeStep, setActiveStep] = useState(0);

  const addStep = () => {
    const newStep: SequenceStep = {
      id: String(steps.length + 1),
      subject: "",
      body: "",
      delayDays: 3,
    };
    setSteps([...steps, newStep]);
    setActiveStep(steps.length);
  };

  const removeStep = (index: number) => {
    if (steps.length === 1) return;
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps);
    if (activeStep >= newSteps.length) {
      setActiveStep(newSteps.length - 1);
    }
  };

  const updateStep = (index: number, field: keyof SequenceStep, value: string | number) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById("emailBody") as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentBody = steps[activeStep].body;
      const newBody = currentBody.substring(0, start) + variable + currentBody.substring(end);
      updateStep(activeStep, "body", newBody);
    }
  };

  const generateWithAI = async () => {
    // Placeholder for AI generation
    const sampleBody = `Hi {{firstName}},

I noticed that {{company}} is doing great work in your space. I wanted to reach out because we've helped similar companies increase their outreach response rates by 3x.

Would you be open to a quick 15-minute call this week to explore if we could help {{company}} achieve similar results?

Best,
[Your Name]`;
    
    updateStep(activeStep, "subject", `Quick question for {{firstName}} at {{company}}`);
    updateStep(activeStep, "body", sampleBody);
  };

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
            <h1 className="text-2xl font-bold">Create Campaign</h1>
            <p className="text-slate-500">Build your email sequence</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button>
            <Play className="h-4 w-4 mr-2" />
            Launch Campaign
          </Button>
        </div>
      </div>

      {/* Campaign Name */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-2">
            <Label htmlFor="campaignName">Campaign Name</Label>
            <Input
              id="campaignName"
              placeholder="e.g., Q1 Outreach to D2C Brands"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sequence Steps Sidebar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Sequence Steps</h2>
            <Button variant="outline" size="sm" onClick={addStep}>
              <Plus className="h-4 w-4 mr-1" />
              Add Step
            </Button>
          </div>

          <div className="space-y-2">
            {steps.map((step, index) => (
              <Card
                key={step.id}
                className={`cursor-pointer transition-colors ${
                  activeStep === index
                    ? "border-blue-500 bg-blue-50"
                    : "hover:border-slate-300"
                }`}
                onClick={() => setActiveStep(index)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <GripVertical className="h-5 w-5 text-slate-300 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          Step {index + 1}
                        </Badge>
                        {index > 0 && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            +{step.delayDays}d
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate">
                        {step.subject || "No subject"}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {step.body
                          ? step.body.substring(0, 50) + "..."
                          : "No content yet"}
                      </p>
                    </div>
                    {steps.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeStep(index);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add Contacts Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Contacts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-3">
                No contacts added yet
              </p>
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Contacts
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Email Editor */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Step {activeStep + 1}
                  </CardTitle>
                  <CardDescription>
                    {activeStep === 0
                      ? "Initial email"
                      : `Follow-up after ${steps[activeStep].delayDays} days`}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={generateWithAI}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate with AI
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Delay (for follow-ups) */}
              {activeStep > 0 && (
                <div className="space-y-2">
                  <Label>Send after</Label>
                  <div className="flex items-center gap-2">
                    <Select
                      value={String(steps[activeStep].delayDays)}
                      onValueChange={(value) =>
                        updateStep(activeStep, "delayDays", parseInt(value))
                      }
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 7, 10, 14].map((days) => (
                          <SelectItem key={days} value={String(days)}>
                            {days}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-slate-500">
                      days after previous email (if no reply)
                    </span>
                  </div>
                </div>
              )}

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Quick question about {{company}}"
                  value={steps[activeStep].subject}
                  onChange={(e) => updateStep(activeStep, "subject", e.target.value)}
                />
              </div>

              {/* Personalization Variables */}
              <div className="space-y-2">
                <Label>Personalization Variables</Label>
                <div className="flex flex-wrap gap-2">
                  {personalizationVars.map((item) => (
                    <Badge
                      key={item.var}
                      variant="outline"
                      className="cursor-pointer hover:bg-blue-50 hover:border-blue-200"
                      onClick={() => insertVariable(item.var)}
                    >
                      {item.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Body */}
              <div className="space-y-2">
                <Label htmlFor="emailBody">Email Body</Label>
                <Textarea
                  id="emailBody"
                  placeholder="Write your email here... Use {{firstName}}, {{company}}, etc. for personalization"
                  value={steps[activeStep].body}
                  onChange={(e) => updateStep(activeStep, "body", e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>Preview</Label>
                <Card className="bg-slate-50">
                  <CardContent className="p-4">
                    <p className="font-semibold mb-2">
                      {steps[activeStep].subject
                        .replace(/\{\{firstName\}\}/g, "Sarah")
                        .replace(/\{\{lastName\}\}/g, "Chen")
                        .replace(/\{\{company\}\}/g, "TechStartup")
                        .replace(/\{\{title\}\}/g, "CEO")
                        .replace(/\{\{domain\}\}/g, "techstartup.com") ||
                        "(No subject)"}
                    </p>
                    <div className="text-sm whitespace-pre-wrap">
                      {steps[activeStep].body
                        .replace(/\{\{firstName\}\}/g, "Sarah")
                        .replace(/\{\{lastName\}\}/g, "Chen")
                        .replace(/\{\{company\}\}/g, "TechStartup")
                        .replace(/\{\{title\}\}/g, "CEO")
                        .replace(/\{\{domain\}\}/g, "techstartup.com") ||
                        "(No content)"}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
