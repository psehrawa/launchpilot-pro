"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  User,
  Building2,
  Key,
  Mail,
  Link2,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
} from "lucide-react";

const apiKeys = [
  {
    id: "1",
    name: "Production API Key",
    prefix: "lp_live_",
    lastUsed: "2 hours ago",
    createdAt: "Jan 15, 2026",
  },
  {
    id: "2",
    name: "Development Key",
    prefix: "lp_test_",
    lastUsed: "Never",
    createdAt: "Feb 1, 2026",
  },
];

const connectedAccounts = [
  {
    id: "1",
    provider: "Gmail",
    email: "parshant@gmail.com",
    status: "connected",
    isDefault: true,
  },
];

const enrichmentProviders = [
  { name: "Hunter.io", configured: true, creditsUsed: 15, creditsTotal: 25 },
  { name: "Snov.io", configured: false, creditsUsed: 0, creditsTotal: 50 },
  { name: "Clearout", configured: true, creditsUsed: 45, creditsTotal: 100 },
];

export default function SettingsPage() {
  const [showKey, setShowKey] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-slate-500">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="email">Email Settings</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Settings
              </CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" defaultValue="Parshant Sehrawat" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="parshant@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue="pst">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pst">Pacific Time (PST)</SelectItem>
                      <SelectItem value="est">Eastern Time (EST)</SelectItem>
                      <SelectItem value="utc">UTC</SelectItem>
                      <SelectItem value="ist">India Standard Time (IST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Team Members
                  </CardTitle>
                  <CardDescription>
                    Manage who has access to your workspace
                  </CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Invite Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite Team Member</DialogTitle>
                      <DialogDescription>
                        Send an invitation to join your workspace
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="inviteEmail">Email address</Label>
                        <Input id="inviteEmail" type="email" placeholder="colleague@company.com" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select defaultValue="member">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button variant="outline">Cancel</Button>
                      <Button>Send Invitation</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center font-medium text-blue-600">
                      PS
                    </div>
                    <div>
                      <p className="font-medium">Parshant Sehrawat</p>
                      <p className="text-sm text-slate-500">parshant@example.com</p>
                    </div>
                  </div>
                  <Badge>Owner</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    API Keys
                  </CardTitle>
                  <CardDescription>
                    Manage your API keys for programmatic access
                  </CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create API Key</DialogTitle>
                      <DialogDescription>
                        Create a new API key for your integrations
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="keyName">Key name</Label>
                        <Input id="keyName" placeholder="e.g., Production API" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button variant="outline">Cancel</Button>
                      <Button>Create Key</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{key.name}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <code className="text-sm bg-slate-100 px-2 py-1 rounded">
                          {showKey === key.id
                            ? `${key.prefix}xxxxxxxxxxxxxxxxxxxx`
                            : `${key.prefix}••••••••••••`}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowKey(showKey === key.id ? null : key.id)}
                        >
                          {showKey === key.id ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Created {key.createdAt} • Last used {key.lastUsed}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <div className="space-y-6">
            {/* Enrichment Providers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  Email Enrichment Providers
                </CardTitle>
                <CardDescription>
                  Connect your email finding and verification services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {enrichmentProviders.map((provider) => (
                    <div
                      key={provider.name}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        {provider.configured ? (
                          <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <Check className="h-5 w-5 text-green-600" />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                            <AlertCircle className="h-5 w-5 text-slate-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{provider.name}</p>
                          <p className="text-sm text-slate-500">
                            {provider.configured
                              ? `${provider.creditsUsed}/${provider.creditsTotal} credits used`
                              : "Not configured"}
                          </p>
                        </div>
                      </div>
                      <Button variant={provider.configured ? "outline" : "default"}>
                        {provider.configured ? "Configure" : "Connect"}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Connected Email Accounts */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Connected Email Accounts
                    </CardTitle>
                    <CardDescription>
                      Email accounts used for sending campaigns
                    </CardDescription>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Connect Account
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {connectedAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                          <Mail className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{account.provider}</p>
                            {account.isDefault && (
                              <Badge variant="secondary">Default</Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-500">{account.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-700">Connected</Badge>
                        <Button variant="ghost" size="icon" className="text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Email Settings Tab */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Settings
              </CardTitle>
              <CardDescription>
                Configure your email sending preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name</Label>
                  <Input id="fromName" defaultValue="Parshant Sehrawat" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="replyTo">Reply-To Email</Label>
                  <Input id="replyTo" type="email" defaultValue="parshant@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dailyLimit">Daily Sending Limit</Label>
                  <Select defaultValue="100">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">50 emails/day</SelectItem>
                      <SelectItem value="100">100 emails/day</SelectItem>
                      <SelectItem value="200">200 emails/day</SelectItem>
                      <SelectItem value="500">500 emails/day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trackOpens">Open Tracking</Label>
                  <Select defaultValue="enabled">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enabled">Enabled</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
