"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Upload,
  Download,
  Filter,
  MoreHorizontal,
  Mail,
  Trash2,
  UserPlus,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Loader2,
  Sparkles,
  AlertCircle,
  Users,
} from "lucide-react";
import { useContacts, Contact } from "@/lib/hooks/use-contacts";
import { useEnrichment } from "@/lib/hooks/use-enrichment";
import { useToast } from "@/hooks/use-toast";

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: "New", color: "bg-slate-100 text-slate-700" },
  contacted: { label: "Contacted", color: "bg-blue-100 text-blue-700" },
  replied: { label: "Replied", color: "bg-green-100 text-green-700" },
  meeting: { label: "Meeting", color: "bg-purple-100 text-purple-700" },
  won: { label: "Won", color: "bg-emerald-100 text-emerald-700" },
  lost: { label: "Lost", color: "bg-red-100 text-red-700" },
};

export default function ContactsPage() {
  const { contacts, loading, error, addContact, deleteContact, deleteContacts, refresh } = useContacts();
  const { enrichContact, enrichBatch, loading: enrichLoading } = useEnrichment();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [enrichDialogOpen, setEnrichDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [isBulkEnriching, setIsBulkEnriching] = useState(false);
  const [importPreview, setImportPreview] = useState<Partial<Contact>[]>([]);
  const [autoEnrich, setAutoEnrich] = useState(true);
  
  // Form state
  const [newContact, setNewContact] = useState({
    first_name: "",
    last_name: "",
    email: "",
    company: "",
    title: "",
  });
  
  // Enrich form state
  const [enrichForm, setEnrichForm] = useState({
    first_name: "",
    last_name: "",
    domain: "",
  });

  const toggleContact = (id: string) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map((c) => c.id));
    }
  };

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      (contact.first_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (contact.last_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.company?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || contact.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleAddContact = async () => {
    // If no email but we have name + company, try to auto-enrich
    if (!newContact.email && autoEnrich && newContact.first_name && newContact.last_name && newContact.company) {
      setIsSubmitting(true);
      toast({ title: "Finding email...", description: "Auto-enriching contact" });
      
      const enrichResult = await enrichContact({
        first_name: newContact.first_name,
        last_name: newContact.last_name,
        company: newContact.company,
      });
      
      if (enrichResult?.email) {
        newContact.email = enrichResult.email;
        if (enrichResult.additionalData?.position) {
          newContact.title = enrichResult.additionalData.position;
        }
        toast({ title: "Email found!", description: enrichResult.email });
      } else {
        setIsSubmitting(false);
        toast({ title: "Error", description: "Could not find email. Please enter manually.", variant: "destructive" });
        return;
      }
    }
    
    if (!newContact.email) {
      toast({ title: "Error", description: "Email is required (or provide name + company for auto-find)", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    const result = await addContact(newContact);
    setIsSubmitting(false);
    
    if (result.success) {
      toast({ title: "Success", description: "Contact added successfully" });
      setAddDialogOpen(false);
      setNewContact({ first_name: "", last_name: "", email: "", company: "", title: "" });
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };
  
  const handleBulkEnrich = async () => {
    const toEnrich = contacts
      .filter((c) => selectedContacts.includes(c.id))
      .filter((c) => !c.email_verified && c.first_name && c.last_name && c.company)
      .map((c) => ({
        contact_id: c.id,
        first_name: c.first_name!,
        last_name: c.last_name!,
        company: c.company!,
      }));
    
    if (toEnrich.length === 0) {
      toast({ title: "No contacts to enrich", description: "Select contacts with name + company", variant: "destructive" });
      return;
    }
    
    setIsBulkEnriching(true);
    const result = await enrichBatch(toEnrich);
    setIsBulkEnriching(false);
    
    toast({ 
      title: "Enrichment complete", 
      description: `Found ${result.success} emails, ${result.failed} failed` 
    });
    refresh();
    setSelectedContacts([]);
  };

  const handleDeleteSelected = async () => {
    if (selectedContacts.length === 0) return;
    
    const result = await deleteContacts(selectedContacts);
    if (result.success) {
      toast({ title: "Success", description: `Deleted ${selectedContacts.length} contact(s)` });
      setSelectedContacts([]);
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter(Boolean);
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      
      const parsed: Partial<Contact>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());
        const contact: Partial<Contact> = { status: "new", tags: [], email_verified: false };
        
        headers.forEach((header, idx) => {
          const value = values[idx];
          if (header === "email") contact.email = value;
          else if (header === "first_name" || header === "firstname" || header === "first name") contact.first_name = value;
          else if (header === "last_name" || header === "lastname" || header === "last name") contact.last_name = value;
          else if (header === "company") contact.company = value;
          else if (header === "title" || header === "job_title" || header === "job title") contact.title = value;
        });
        
        if (contact.email) parsed.push(contact);
      }
      
      setImportPreview(parsed);
      setImportDialogOpen(true);
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImportConfirm = async () => {
    setIsSubmitting(true);
    let successCount = 0;
    
    for (const contact of importPreview) {
      const result = await addContact(contact);
      if (result.success) successCount++;
    }
    
    setIsSubmitting(false);
    toast({ title: "Import Complete", description: `Imported ${successCount} of ${importPreview.length} contacts` });
    setImportDialogOpen(false);
    setImportPreview([]);
  };

  const handleEnrichEmail = async () => {
    if (!enrichForm.first_name || !enrichForm.last_name || !enrichForm.domain) {
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
      return;
    }
    
    setIsEnriching(true);
    try {
      const res = await fetch("/api/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: enrichForm.first_name,
          last_name: enrichForm.last_name,
          domain: enrichForm.domain,
        }),
      });
      
      const data = await res.json();
      
      if (data.email) {
        // Add the found contact
        await addContact({
          email: data.email,
          first_name: enrichForm.first_name,
          last_name: enrichForm.last_name,
          company: enrichForm.domain,
          email_verified: data.verified || false,
        });
        
        toast({ title: "Email Found!", description: `Found: ${data.email}` });
        setEnrichDialogOpen(false);
        setEnrichForm({ first_name: "", last_name: "", domain: "" });
      } else {
        toast({ title: "Not Found", description: "Could not find email for this person", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to enrich contact", variant: "destructive" });
    } finally {
      setIsEnriching(false);
    }
  };

  const handleExport = () => {
    const headers = ["email", "first_name", "last_name", "company", "title", "status"];
    const rows = filteredContacts.map((c) => [
      c.email,
      c.first_name || "",
      c.last_name || "",
      c.company || "",
      c.title || "",
      c.status,
    ]);
    
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contacts.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-600">
        <AlertCircle className="h-6 w-6 mr-2" />
        Error loading contacts: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="text-slate-500">{contacts.length} total contacts</p>
        </div>
        <div className="flex gap-3">
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          {/* Find Email Dialog */}
          <Dialog open={enrichDialogOpen} onOpenChange={setEnrichDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Sparkles className="h-4 w-4 mr-2" />
                Find Email
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Find Email Address</DialogTitle>
                <DialogDescription>
                  Enter a name and company domain to find their email
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input
                      placeholder="John"
                      value={enrichForm.first_name}
                      onChange={(e) => setEnrichForm((f) => ({ ...f, first_name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      placeholder="Doe"
                      value={enrichForm.last_name}
                      onChange={(e) => setEnrichForm((f) => ({ ...f, last_name: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Company Domain</Label>
                  <Input
                    placeholder="acme.com"
                    value={enrichForm.domain}
                    onChange={(e) => setEnrichForm((f) => ({ ...f, domain: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEnrichDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEnrichEmail} disabled={isEnriching}>
                  {isEnriching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Find Email
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Add Contact Dialog */}
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Contact</DialogTitle>
                <DialogDescription>Add a new contact to your database</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First name</Label>
                    <Input
                      placeholder="John"
                      value={newContact.first_name}
                      onChange={(e) => setNewContact((c) => ({ ...c, first_name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last name</Label>
                    <Input
                      placeholder="Doe"
                      value={newContact.last_name}
                      onChange={(e) => setNewContact((c) => ({ ...c, last_name: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email {autoEnrich ? "(optional - will auto-find)" : "*"}</Label>
                  <Input
                    type="email"
                    placeholder="john@company.com"
                    value={newContact.email}
                    onChange={(e) => setNewContact((c) => ({ ...c, email: e.target.value }))}
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={autoEnrich}
                      onChange={(e) => setAutoEnrich(e.target.checked)}
                      className="rounded"
                    />
                    <Sparkles className="h-3 w-3 text-purple-500" />
                    Auto-find email from name + company
                  </label>
                </div>
                <div className="space-y-2">
                  <Label>Company {autoEnrich && !newContact.email ? "*" : ""}</Label>
                  <Input
                    placeholder="Acme Inc"
                    value={newContact.company}
                    onChange={(e) => setNewContact((c) => ({ ...c, company: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Job title</Label>
                  <Input
                    placeholder="CEO"
                    value={newContact.title}
                    onChange={(e) => setNewContact((c) => ({ ...c, title: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddContact} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Add Contact
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Import Preview Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Preview</DialogTitle>
            <DialogDescription>
              {importPreview.length} contacts found in CSV
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-64 overflow-auto border rounded">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importPreview.slice(0, 10).map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm">{c.email}</TableCell>
                    <TableCell className="text-sm">{c.first_name} {c.last_name}</TableCell>
                    <TableCell className="text-sm">{c.company}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {importPreview.length > 10 && (
              <p className="text-sm text-slate-500 p-2">
                ... and {importPreview.length - 10} more
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportConfirm} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Import {importPreview.length} Contacts
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filters and Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search contacts..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="replied">Replied</SelectItem>
            <SelectItem value="meeting">Meeting</SelectItem>
            <SelectItem value="won">Won</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={refresh}>
          Refresh
        </Button>
      </div>

      {/* Bulk Actions */}
      {selectedContacts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm text-blue-700">
            {selectedContacts.length} contact(s) selected
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleBulkEnrich} disabled={isBulkEnriching}>
              {isBulkEnriching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Find Emails
            </Button>
            <Button size="sm" variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              Add to Campaign
            </Button>
            <Button size="sm" variant="outline" className="text-red-600" onClick={handleDeleteSelected}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Contacts Table */}
      <div className="border rounded-lg bg-white">
        {filteredContacts.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium">No contacts yet</p>
            <p className="text-sm">Add your first contact or import from CSV</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Email Verified</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedContacts.includes(contact.id)}
                      onCheckedChange={() => toggleContact(contact.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {contact.first_name} {contact.last_name}
                      </p>
                      <p className="text-sm text-slate-500">{contact.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-sm">{contact.company || "-"}</p>
                        <p className="text-xs text-slate-500">{contact.title || ""}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusConfig[contact.status]?.color || statusConfig.new.color}>
                      {statusConfig[contact.status]?.label || "New"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {contact.email_verified ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm">Verified</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-slate-400">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">Pending</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {contact.tags?.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add to Campaign
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => deleteContact(contact.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing {filteredContacts.length} of {contacts.length} contacts
        </p>
      </div>
    </div>
  );
}
