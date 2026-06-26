import React, { useState } from "react";
import { useParams, Link } from "wouter";
import { 
  useProGetLead, 
  getProGetLeadQueryKey,
  useProUpdateLeadStatus,
  useProAddLeadNote,
  LeadStatus 
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  ArrowLeft, Mail, Phone, MapPin, Calendar, 
  Activity, ExternalLink, Send, CheckCircle2, Wrench
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const statusColors: Record<LeadStatus, string> = {
  New: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  Accepted: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  Contacted: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  Quoted: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  Completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  Closed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: lead, isLoading } = useProGetLead(id, { 
    query: { 
      enabled: !!id, 
      queryKey: getProGetLeadQueryKey(id) 
    } 
  });

  const updateStatusMutation = useProUpdateLeadStatus();
  const addNoteMutation = useProAddLeadNote();
  const [newNote, setNewNote] = useState("");

  const handleStatusChange = async (status: LeadStatus) => {
    try {
      await updateStatusMutation.mutateAsync({
        id,
        data: { status }
      });
      queryClient.invalidateQueries({ queryKey: getProGetLeadQueryKey(id) });
      queryClient.invalidateQueries({ queryKey: ["proListLeads"] });
      toast({
        title: "Status updated",
        description: `Lead status changed to ${status}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update lead status.",
        variant: "destructive",
      });
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      await addNoteMutation.mutateAsync({
        id,
        data: { note: newNote.trim() }
      });
      setNewNote("");
      queryClient.invalidateQueries({ queryKey: getProGetLeadQueryKey(id) });
      toast({
        title: "Note added",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add note.",
        variant: "destructive",
      });
    }
  };

  if (isLoading || !lead) {
    return (
      <Layout>
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 h-64 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <Link href="/leads">
          <a className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-4 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Leads
          </a>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{lead.name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-muted-foreground text-sm">
              <span className="flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                Received {format(new Date(lead.createdAt), "MMM d, yyyy h:mm a")}
              </span>
              {lead.serviceType && (
                <span className="flex items-center font-medium text-primary">
                  <Wrench className="mr-1 h-4 w-4" />
                  {lead.serviceType}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-[180px]">
              <Select value={lead.status} onValueChange={(v) => handleStatusChange(v as LeadStatus)}>
                <SelectTrigger className={`border-0 ${statusColors[lead.status]}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(LeadStatus).map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <a href={`mailto:${lead.email}`} className="text-primary hover:underline">{lead.email}</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      {lead.phone ? (
                        <a href={`tel:${lead.phone}`} className="text-primary hover:underline">{lead.phone}</a>
                      ) : (
                        <span className="text-muted-foreground">Not provided</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Address</p>
                      <p>{lead.address || "No street address"}</p>
                      <p>ZIP: {lead.zipCode}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {lead.notes && (
                <>
                  <Separator className="my-6" />
                  <div>
                    <h4 className="text-sm font-medium mb-2">Customer Request Notes</h4>
                    <div className="bg-muted/50 p-4 rounded-md text-sm whitespace-pre-wrap">
                      {lead.notes}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Internal Notes</CardTitle>
              <CardDescription>Visible only to your team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                {lead.leadNotes && lead.leadNotes.length > 0 ? (
                  <div className="space-y-4">
                    {lead.leadNotes.map((note) => (
                      <div key={note.id} className="bg-muted p-3 rounded-lg border">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-medium">Team Member</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(note.createdAt), "MMM d, h:mm a")}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic text-center py-4 border rounded-lg border-dashed">
                    No notes added yet.
                  </p>
                )}
              </div>
              
              <div className="flex flex-col gap-2">
                <Textarea 
                  placeholder="Add a new note about this lead..." 
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                />
                <Button 
                  className="self-end" 
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || addNoteMutation.isPending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {addNoteMutation.isPending ? "Adding..." : "Add Note"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Lead Insights */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-card">
                <Activity className={`w-10 h-10 mb-2 ${lead.leadScore > 75 ? 'text-green-500' : lead.leadScore > 40 ? 'text-yellow-500' : 'text-orange-500'}`} />
                <div className="text-4xl font-bold mb-1">{lead.leadScore}</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Quality Score</div>
                <p className="text-xs text-center text-muted-foreground mt-3">
                  Score based on location match, provided details, and engagement.
                </p>
              </div>

              {lead.diagnosisId && (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Has Lawn Diagnosis</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        This homeowner has completed an AI lawn diagnosis in the LawnRX app.
                      </p>
                      {/* Normally would link to shared diagnosis view, placeholder for now */}
                      <Button variant="outline" size="sm" className="w-full text-xs" disabled>
                        <ExternalLink className="h-3 w-3 mr-2" />
                        View Diagnosis (Coming soon)
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
