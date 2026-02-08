"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Building2,
  Key,
  CreditCard,
  Bell,
  Loader2,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  
  const [profile, setProfile] = useState({
    name: "",
    email: "",
  });
  
  const [org, setOrg] = useState({
    name: "",
    plan: "free",
  });
  
  const [apiKeys, setApiKeys] = useState({
    hunter: "",
    snov: "",
    clearout: "",
    sendgrid: "",
  });

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setProfile({
          name: user.user_metadata?.full_name || user.user_metadata?.name || "",
          email: user.email || "",
        });

        // Get org
        const { data: membership } = await supabase
          .from("lp_org_members")
          .select("org_id, lp_organizations(name, plan)")
          .eq("user_id", user.id)
          .limit(1)
          .single();

        if (membership?.lp_organizations) {
          const orgData = membership.lp_organizations as any;
          setOrg({
            name: orgData.name || "",
            plan: orgData.plan || "free",
          });
        }
      }
      setLoading(false);
    };

    loadData();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    const supabase = createClient();
    
    const { error } = await supabase.auth.updateUser({
      data: { full_name: profile.name }
    });

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Profile updated" });
    }
  };

  const toggleShowKey = (key: string) => {
    setShowApiKeys((prev) => ({ ...prev, [key]: !prev[key] }));
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
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-slate-500">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="organization" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={profile.email} disabled className="bg-slate-50" />
                <p className="text-xs text-slate-500">Email cannot be changed</p>
              </div>
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization Tab */}
        <TabsContent value="organization">
          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
              <CardDescription>Your workspace settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Organization Name</Label>
                <Input
                  value={org.name}
                  onChange={(e) => setOrg((o) => ({ ...o, name: e.target.value }))}
                  placeholder="Your company name"
                />
              </div>
              <div className="space-y-2">
                <Label>Current Plan</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-sm capitalize">
                    {org.plan}
                  </Badge>
                  <Button variant="link" className="text-blue-600 p-0 h-auto">
                    Upgrade
                  </Button>
                </div>
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api-keys">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email Enrichment APIs</CardTitle>
                <CardDescription>
                  Connect email finder and verification services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Hunter */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Hunter.io API Key</Label>
                    <a
                      href="https://hunter.io/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 flex items-center gap-1 hover:underline"
                    >
                      Get API Key <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showApiKeys.hunter ? "text" : "password"}
                        value={apiKeys.hunter}
                        onChange={(e) => setApiKeys((k) => ({ ...k, hunter: e.target.value }))}
                        placeholder="Enter your Hunter API key"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2"
                        onClick={() => toggleShowKey("hunter")}
                      >
                        {showApiKeys.hunter ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button variant="outline">Test</Button>
                  </div>
                  <p className="text-xs text-slate-500">25 free searches/month</p>
                </div>

                {/* Snov */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Snov.io API Key</Label>
                    <a
                      href="https://app.snov.io/integrations/api"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 flex items-center gap-1 hover:underline"
                    >
                      Get API Key <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showApiKeys.snov ? "text" : "password"}
                        value={apiKeys.snov}
                        onChange={(e) => setApiKeys((k) => ({ ...k, snov: e.target.value }))}
                        placeholder="Enter your Snov API key"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2"
                        onClick={() => toggleShowKey("snov")}
                      >
                        {showApiKeys.snov ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button variant="outline">Test</Button>
                  </div>
                  <p className="text-xs text-slate-500">50 free credits on trial</p>
                </div>

                {/* Clearout */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Clearout API Key</Label>
                    <a
                      href="https://app.clearout.io/settings/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 flex items-center gap-1 hover:underline"
                    >
                      Get API Key <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showApiKeys.clearout ? "text" : "password"}
                        value={apiKeys.clearout}
                        onChange={(e) => setApiKeys((k) => ({ ...k, clearout: e.target.value }))}
                        placeholder="Enter your Clearout API key"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2"
                        onClick={() => toggleShowKey("clearout")}
                      >
                        {showApiKeys.clearout ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button variant="outline">Test</Button>
                  </div>
                  <p className="text-xs text-slate-500">100 free verifications</p>
                </div>

                <Button className="w-full">
                  <Check className="h-4 w-4 mr-2" />
                  Save API Keys
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Email Sending</CardTitle>
                <CardDescription>
                  Configure your email delivery service
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>SendGrid API Key</Label>
                    <a
                      href="https://app.sendgrid.com/settings/api_keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 flex items-center gap-1 hover:underline"
                    >
                      Get API Key <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showApiKeys.sendgrid ? "text" : "password"}
                        value={apiKeys.sendgrid}
                        onChange={(e) => setApiKeys((k) => ({ ...k, sendgrid: e.target.value }))}
                        placeholder="Enter your SendGrid API key"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2"
                        onClick={() => toggleShowKey("sendgrid")}
                      >
                        {showApiKeys.sendgrid ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button variant="outline">Test</Button>
                  </div>
                  <p className="text-xs text-slate-500">100 free emails/day</p>
                </div>

                <Button className="w-full">
                  <Check className="h-4 w-4 mr-2" />
                  Save Email Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing</CardTitle>
              <CardDescription>Manage your subscription and payments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 border rounded-lg bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Current Plan</span>
                  <Badge variant="secondary" className="capitalize">{org.plan}</Badge>
                </div>
                <p className="text-sm text-slate-500">
                  {org.plan === "free" 
                    ? "You're on the free plan. Upgrade to unlock more features."
                    : `You're on the ${org.plan} plan.`}
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <Card className={org.plan === "free" ? "border-blue-500" : ""}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-1">Starter</h3>
                    <p className="text-2xl font-bold mb-2">$19<span className="text-sm font-normal text-slate-500">/mo</span></p>
                    <ul className="text-sm space-y-1 text-slate-600">
                      <li>• 500 contacts</li>
                      <li>• 1,000 emails/mo</li>
                      <li>• Basic sequences</li>
                    </ul>
                    <Button className="w-full mt-4" variant={org.plan === "starter" ? "secondary" : "default"}>
                      {org.plan === "starter" ? "Current Plan" : "Upgrade"}
                    </Button>
                  </CardContent>
                </Card>

                <Card className={org.plan === "growth" ? "border-blue-500" : ""}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-1">Growth</h3>
                    <p className="text-2xl font-bold mb-2">$49<span className="text-sm font-normal text-slate-500">/mo</span></p>
                    <ul className="text-sm space-y-1 text-slate-600">
                      <li>• 5,000 contacts</li>
                      <li>• 10,000 emails/mo</li>
                      <li>• Advanced analytics</li>
                    </ul>
                    <Button className="w-full mt-4" variant={org.plan === "growth" ? "secondary" : "default"}>
                      {org.plan === "growth" ? "Current Plan" : "Upgrade"}
                    </Button>
                  </CardContent>
                </Card>

                <Card className={org.plan === "scale" ? "border-blue-500" : ""}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-1">Scale</h3>
                    <p className="text-2xl font-bold mb-2">$99<span className="text-sm font-normal text-slate-500">/mo</span></p>
                    <ul className="text-sm space-y-1 text-slate-600">
                      <li>• Unlimited contacts</li>
                      <li>• 50,000 emails/mo</li>
                      <li>• API access</li>
                    </ul>
                    <Button className="w-full mt-4" variant={org.plan === "scale" ? "secondary" : "default"}>
                      {org.plan === "scale" ? "Current Plan" : "Upgrade"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
