import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { 
  useListMetrics, 
  useGetChannelComparison,
  useListCampaigns,
  getListMetricsQueryKey,
  getGetChannelComparisonQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { Download } from "lucide-react";
import { useState } from "react";

export default function Reports() {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("all");
  
  const { data: campaigns } = useListCampaigns({ workspaceId: 1 });
  
  const campaignFilter = selectedCampaignId !== "all" ? parseInt(selectedCampaignId, 10) : undefined;
  
  const { data: metrics, isLoading: isMetricsLoading } = useListMetrics(
    campaignFilter ? { campaignId: campaignFilter } : {},
    { query: { enabled: true, queryKey: getListMetricsQueryKey(campaignFilter ? { campaignId: campaignFilter } : {}) } }
  );

  const { data: comparison, isLoading: isComparisonLoading } = useGetChannelComparison(
    { workspaceId: 1 },
    { query: { enabled: true, queryKey: getGetChannelComparisonQueryKey({ workspaceId: 1 }) } }
  );

  const handleExportCSV = () => {
    if (!metrics || metrics.length === 0) return;
    
    // Basic client-side CSV generation
    const headers = ["Date", "Campaign ID", "Platform", "Spend", "Impressions", "Clicks", "CTR", "CPC", "Conversions"];
    const rows = metrics.map(m => [
      m.date.split('T')[0],
      m.campaignId,
      m.platform,
      m.spend,
      m.impressions,
      m.clicks,
      m.ctr,
      m.cpc,
      m.conversions
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `marketing-metrics-export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <SidebarLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Reports</h1>
          <p className="text-muted-foreground mt-1">Analyze your multi-channel marketing performance.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by campaign" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              {campaigns?.map(c => (
                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={handleExportCSV} disabled={!metrics || metrics.length === 0} className="shrink-0">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Channel Comparison</CardTitle>
          <CardDescription>Aggregate performance by platform</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          {isComparisonLoading ? (
            <Skeleton className="h-full w-full" />
          ) : !comparison || comparison.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparison} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="platform" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} className="capitalize" />
                <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  cursor={{ fill: 'hsl(var(--muted))' }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="impressions" name="Impressions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="clicks" name="Clicks" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="conversions" name="Conversions" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Metrics</CardTitle>
          <CardDescription>Daily breakdown of advertising data</CardDescription>
        </CardHeader>
        <CardContent>
          {isMetricsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : metrics?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg bg-muted/20">
              No metrics available for the selected filters.
            </div>
          ) : (
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead className="text-right">Spend</TableHead>
                    <TableHead className="text-right">Impressions</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead className="text-right">CPC</TableHead>
                    <TableHead className="text-right">Conversions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics?.slice(0, 50).map((row) => ( // limit to 50 for MVP UI
                    <TableRow key={row.id}>
                      <TableCell className="font-medium whitespace-nowrap">{row.date.split('T')[0]}</TableCell>
                      <TableCell className="capitalize">{row.platform}</TableCell>
                      <TableCell className="text-right">${row.spend.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{row.impressions.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{row.clicks.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{(row.ctr * 100).toFixed(2)}%</TableCell>
                      <TableCell className="text-right">${row.cpc.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">{row.conversions}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </SidebarLayout>
  );
}
