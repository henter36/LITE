import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { useListCampaigns } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Target, Calendar, ArrowRight, Megaphone, EyeOff } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

const STATUS_COLOR: Record<string, string> = {
  active: "default",
  approved: "default",
  draft: "secondary",
  completed: "secondary",
  archived: "outline",
};

export default function Campaigns() {
  const { activeWorkspaceId, user } = useAuth();
  const isViewer = user?.role === "viewer";
  const { data: campaigns, isLoading } = useListCampaigns({ workspaceId: activeWorkspaceId });

  return (
    <SidebarLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground mt-2 text-base">
            Plan and manage your marketing campaigns.
          </p>
        </div>
        {!isViewer && (
          <Link href="/campaigns/new">
            <Button size="lg">
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
          </Link>
        )}
      </div>

      {/* Viewer read-only indicator */}
      {isViewer && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground border rounded-lg px-4 py-2.5 bg-muted/20">
          <EyeOff className="h-4 w-4 shrink-0" />
          <span>
            <span className="font-medium text-foreground">Read-only access.</span>{" "}
            You can view campaigns but cannot create or edit them. Ask an Admin to make changes.
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : campaigns?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Megaphone className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-xl font-semibold mb-2">No campaigns yet</p>
            <p className="text-muted-foreground mb-6 max-w-sm">
              A campaign is where everything starts — brief, content, approval, and tracking in one
              place.
            </p>
            {!isViewer && (
              <Link href="/campaigns/new">
                <Button size="lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first campaign
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns?.map((campaign) => (
            <Card key={campaign.id} className="hover:bg-muted/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Megaphone className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-lg leading-tight">{campaign.name}</h3>
                        <Badge
                          variant={(STATUS_COLOR[campaign.status] ?? "secondary") as "default" | "secondary" | "outline" | "destructive"}
                          className="capitalize"
                        >
                          {campaign.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Target className="h-3.5 w-3.5" />
                          <span className="capitalize">{campaign.objective}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(campaign.startDate), "MMM d")} –{" "}
                          {format(new Date(campaign.endDate), "MMM d, yyyy")}
                        </span>
                      </div>
                      {campaign.channels.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {campaign.channels.map((ch) => (
                            <Badge
                              key={ch}
                              variant="outline"
                              className="capitalize text-xs font-normal"
                            >
                              {ch}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <Link href={`/campaigns/${campaign.id}`}>
                    <Button variant="outline" size="sm" className="shrink-0">
                      Open
                      <ArrowRight className="ml-2 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </SidebarLayout>
  );
}
