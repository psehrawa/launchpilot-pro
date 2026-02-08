"use client";

import { useState } from "react";
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
} from "lucide-react";

// Mock data
const contacts = [
  {
    id: "1",
    firstName: "Sarah",
    lastName: "Chen",
    email: "sarah@techstartup.com",
    company: "TechStartup Inc",
    title: "CEO",
    status: "replied",
    emailVerified: true,
    tags: ["hot-lead", "decision-maker"],
    lastContacted: "2 days ago",
  },
  {
    id: "2",
    firstName: "Mike",
    lastName: "Johnson",
    email: "mike@acme.co",
    company: "Acme Corp",
    title: "VP Sales",
    status: "contacted",
    emailVerified: true,
    tags: ["enterprise"],
    lastContacted: "1 week ago",
  },
  {
    id: "3",
    firstName: "Priya",
    lastName: "Sharma",
    email: "priya@saasco.com",
    company: "SaaS Co",
    title: "Head of Growth",
    status: "meeting",
    emailVerified: true,
    tags: ["hot-lead", "saas"],
    lastContacted: "3 days ago",
  },
  {
    id: "4",
    firstName: "John",
    lastName: "Doe",
    email: "john@startup.io",
    company: "Startup.io",
    title: "Founder",
    status: "new",
    emailVerified: false,
    tags: ["startup"],
    lastContacted: null,
  },
  {
    id: "5",
    firstName: "Emily",
    lastName: "Williams",
    email: "emily@bigco.com",
    company: "Big Co",
    title: "Marketing Director",
    status: "lost",
    emailVerified: true,
    tags: ["enterprise", "marketing"],
    lastContacted: "2 weeks ago",
  },
];

const statusConfig = {
  new: { label: "New", color: "bg-slate-100 text-slate-700" },
  contacted: { label: "Contacted", color: "bg-blue-100 text-blue-700" },
  replied: { label: "Replied", color: "bg-green-100 text-green-700" },
  meeting: { label: "Meeting", color: "bg-purple-100 text-purple-700" },
  won: { label: "Won", color: "bg-emerald-100 text-emerald-700" },
  lost: { label: "Lost", color: "bg-red-100 text-red-700" },
};

export default function ContactsPage() {
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleContact = (id: string) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts.map((c) => c.id));
    }
  };

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="text-slate-500">{contacts.length} total contacts</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Contact</DialogTitle>
                <DialogDescription>
                  Add a new contact to your database
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input id="firstName" placeholder="John" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input id="lastName" placeholder="Doe" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="john@company.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" placeholder="Acme Inc" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Job title</Label>
                  <Input id="title" placeholder="CEO" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline">Cancel</Button>
                <Button>Add Contact</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

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
        <Select defaultValue="all">
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
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          More Filters
        </Button>
      </div>

      {/* Bulk Actions */}
      {selectedContacts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm text-blue-700">
            {selectedContacts.length} contact(s) selected
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              Add to Campaign
            </Button>
            <Button size="sm" variant="outline">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Tags
            </Button>
            <Button size="sm" variant="outline" className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Contacts Table */}
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedContacts.length === contacts.length}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Email Verified</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Last Contacted</TableHead>
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
                      {contact.firstName} {contact.lastName}
                    </p>
                    <p className="text-sm text-slate-500">{contact.email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-sm">{contact.company}</p>
                      <p className="text-xs text-slate-500">{contact.title}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      statusConfig[contact.status as keyof typeof statusConfig]
                        ?.color
                    }
                  >
                    {
                      statusConfig[contact.status as keyof typeof statusConfig]
                        ?.label
                    }
                  </Badge>
                </TableCell>
                <TableCell>
                  {contact.emailVerified ? (
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
                    {contact.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-slate-500">
                  {contact.lastContacted || "Never"}
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
                      <DropdownMenuItem className="text-red-600">
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
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing {filteredContacts.length} of {contacts.length} contacts
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm">
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
