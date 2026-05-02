import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { useListCampaigns, getListCampaignsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Target, Users, MapPin, Calendar, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

export default function Campaigns() {
  const { activeWorkspaceId } = useAuth();
  const { data: campaigns, isLoading } = useListCampaigns({ workspaceId: activeWorkspaceId });

  return (
    <SidebarLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground mt-1">Manage and track your marketing campaigns.</p>
        </div>
        <Link href="/campaigns/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4 mt-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] w-full rounded-xl" />
          ))}
        </div>
      ) : campaigns?.length === 0 ? (
        <Card className="mt-6 flex flex-col items-center justify-center py-12">
          <CardHeader>
            <CardTitle className="text-xl">No campaigns found</CardTitle>
            <CardDescription>Create your first campaign to start generating content.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4 mt-6">
          {campaigns?.map((campaign) => (
            <Card key={campaign.id} className="hover:bg-muted/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{campaign.name}</h3>
                      <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                        {campaign.status}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Target className="h-4 w-4" />
                        <span className="capitalize">{campaign.objective}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        <span className="max-w-[150px] truncate" title={campaign.audience}>{campaign.audience}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        <span className="max-w-[150px] truncate" title={campaign.geography}>{campaign.geography}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(campaign.startDate), 'MMM d, yyyy')} - {format(new Date(campaign.endDate), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {campaign.channels.map((channel, i) => (
                        <Badge key={i} variant="outline" className="capitalize text-xs font-normal">
                          {channel}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end shrink-0">
                    <Link href={`/campaigns/${campaign.id}`}>
                      <Button variant="ghost">
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </SidebarLayout>
  );
}
