import { SidebarLayout } from "@/components/layout/sidebar-layout";
import {
  useListMetrics,
  useGetChannelComparison,
  useListCampaigns,
  getListMetricsQueryKey,
  getGetChannelComparisonQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import { Download, FileText } from "lucide-react";
import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Reports() {
  const { activeWorkspaceId } = useAuth();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("all");

  const { data: campaigns } = useListCampaigns({ workspaceId: activeWorkspaceId });

  const campaignFilter = selectedCampaignId !== "all" ? parseInt(selectedCampaignId, 10) : undefined;
  const metricsParams = campaignFilter ? { campaignId: campaignFilter } : {};

  const { data: metrics, isLoading: isMetricsLoading } = useListMetrics(metricsParams, {
    query: {
      enabled: !!activeWorkspaceId,
      queryKey: getListMetricsQueryKey(metricsParams),
    },
  });

  const { data: comparison, isLoading: isComparisonLoading } = useGetChannelComparison(
    { workspaceId: activeWorkspaceId },
    {
      query: {
        enabled: !!activeWorkspaceId,
        queryKey: getGetChannelComparisonQueryKey({ workspaceId: activeWorkspaceId }),
      },
    }
  );

  const handleExportPDF = () => {
    if (!metrics || metrics.length === 0) return;
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(18);
    doc.text("Performance Report", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Marketing OS Lite  ·  Generated ${new Date().toLocaleDateString()}`, 14, 28);
    doc.setTextColor(0);
    autoTable(doc, {
      startY: 36,
      head: [["Date", "Platform", "Spend", "Impressions", "Clicks", "CTR", "CPC", "Conversions"]],
      body: metrics.slice(0, 200).map((m) => [
        m.date.split("T")[0],
        m.platform.charAt(0).toUpperCase() + m.platform.slice(1),
        `$${m.spend.toLocaleString()}`,
        m.impressions.toLocaleString(),
        m.clicks.toLocaleString(),
        `${(m.ctr * 100).toFixed(2)}%`,
        `$${m.cpc.toFixed(2)}`,
        String(m.conversions),
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [99, 79, 237], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 248, 255] },
    });
    doc.save("performance-report.pdf");
  };

  const handleExportCSV = () => {
    if (!metrics || metrics.length === 0) return;
    const headers = ["Date", "Campaign ID", "Platform", "Spend", "Impressions", "Clicks", "CTR", "CPC", "Conversions"];
    const rows = metrics.map((m) => [
      m.date.split("T")[0],
      m.campaignId,
      m.platform,
      m.spend,
      m.impressions,
      m.clicks,
      m.ctr,
      m.cpc,
      m.conversions,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "demo-metrics-export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <SidebarLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Performance</h1>
          <p className="text-muted-foreground mt-2 text-base">Demo metrics across your campaigns and channels.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by campaign" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              {campaigns?.map((c) => (
                <SelectItem key={c.id} value={c.id.toString()}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleExportPDF}
            disabled={!metrics || metrics.length === 0}
            className="shrink-0"
          >
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={!metrics || metrics.length === 0}
            className="shrink-0"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Channel Comparison</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          {isComparisonLoading ? (
            <Skeleton className="h-full w-full" />
          ) : !comparison || comparison.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              No data available yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparison} margin={{ top: 10, right: 20, left: 0, bottom: 0 }} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="platform"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
                />
                <YAxis
                  yAxisId="left"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  cursor={{ fill: "hsl(var(--muted))" }}
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
        <CardHeader className="pb-4">
          <CardTitle>Daily Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {isMetricsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !metrics || metrics.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg bg-muted/20 text-sm">
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
                  {metrics.slice(0, 50).map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium whitespace-nowrap">{row.date.split("T")[0]}</TableCell>
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
