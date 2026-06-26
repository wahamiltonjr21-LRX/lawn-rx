import React from "react";
import { Link } from "wouter";
import { useProListLeads, LeadStatus } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MapPin, Activity, CalendarIcon, Inbox } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<LeadStatus, string> = {
  New: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  Accepted: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  Contacted: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  Quoted: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  Completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  Closed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

export default function Leads() {
  const { data: leads, isLoading } = useProListLeads({ query: { queryKey: ["proListLeads"] } });
  const [filterStatus, setFilterStatus] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");

  const filteredLeads = React.useMemo(() => {
    if (!leads) return [];
    return leads.filter((lead) => {
      const matchStatus = filterStatus === "all" || lead.status === filterStatus;
      const matchSearch = lead.name.toLowerCase().includes(search.toLowerCase()) || 
                          lead.zipCode.includes(search);
      return matchStatus && matchSearch;
    });
  }, [leads, filterStatus, search]);

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads Dashboard</h1>
          <p className="text-muted-foreground">Manage and track your incoming requests.</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or ZIP code..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search"
            />
          </div>
          <div className="w-full sm:w-[200px]">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger data-testid="select-status-filter">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.values(LeadStatus).map((status) => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse h-32"></Card>
          ))}
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-card border-dashed">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No leads found</h3>
          <p className="text-muted-foreground mt-1 max-w-sm">
            {search || filterStatus !== "all" 
              ? "No leads match your current filters. Try adjusting your search."
              : "You don't have any leads yet. When homeowners in your ZIP codes request help, they'll appear here."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredLeads.map((lead) => (
            <Link key={lead.id} href={`/leads/${lead.id}`}>
              <a className="block group">
                <Card className="transition-all hover:border-primary/50 hover:shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                              {lead.name}
                            </h3>
                            <div className="flex items-center text-sm text-muted-foreground mt-1 space-x-4">
                              <span className="flex items-center">
                                <MapPin className="w-3.5 h-3.5 mr-1" />
                                {lead.zipCode}
                              </span>
                              <span className="flex items-center">
                                <CalendarIcon className="w-3.5 h-3.5 mr-1" />
                                {format(new Date(lead.createdAt), "MMM d, yyyy")}
                              </span>
                            </div>
                          </div>
                          <Badge variant="secondary" className={`${statusColors[lead.status]} border-0`}>
                            {lead.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Lead Score</span>
                        <div className="flex items-center">
                          <Activity className={`w-5 h-5 mr-2 ${lead.leadScore > 75 ? 'text-green-500' : lead.leadScore > 40 ? 'text-yellow-500' : 'text-orange-500'}`} />
                          <span className="text-2xl font-bold">{lead.leadScore}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </a>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}
