import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { 
  useListConnections, 
  useCreateConnection, 
  useDeleteConnection, 
  useSyncConnection,
  getListConnectionsQueryKey
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Activity, RefreshCw, Unplug, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const PLATFORMS = [
  { id: "instagram", name: "Instagram / Meta Ads", color: "bg-pink-600" },
  { id: "snapchat", name: "Snapchat Ads", color: "bg-yellow-400" },
  { id: "youtube", name: "YouTube / Google Ads", color: "bg-red-600" },
  { id: "x", name: "X (Twitter) Ads", color: "bg-neutral-800 dark:bg-neutral-200 dark:text-black" },
] as const;

const connectSchema = z.object({
  accountName: z.string().min(1, "Account name is required"),
});

export default function Connections() {
  const { activeWorkspaceId } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  const { data: connections, isLoading } = useListConnections({ workspaceId: activeWorkspaceId }, {
    query: { enabled: !!activeWorkspaceId, queryKey: getListConnectionsQueryKey({ workspaceId: activeWorkspaceId }) }
  });

  const createConnection = useCreateConnection();
  const deleteConnection = useDeleteConnection();
  const syncConnection = useSyncConnection();

  const form = useForm<z.infer<typeof connectSchema>>({
    resolver: zodResolver(connectSchema),
    defaultValues: { accountName: "" },
  });

  const onConnect = (data: z.infer<typeof connectSchema>) => {
    if (!connectingPlatform) return;
    
    createConnection.mutate({ 
      data: { workspaceId: activeWorkspaceId, platform: connectingPlatform as any, accountName: data.accountName } 
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListConnectionsQueryKey({ workspaceId: activeWorkspaceId }) });
        setConnectingPlatform(null);
        form.reset();
        toast({ title: "Mock account connected successfully" });
      }
    });
  };

  const handleDisconnect = (id: number) => {
    deleteConnection.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListConnectionsQueryKey({ workspaceId: activeWorkspaceId }) });
        toast({ title: "Account disconnected" });
      }
    });
  };

  const handleSync = (id: number) => {
    syncConnection.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListConnectionsQueryKey({ workspaceId: activeWorkspaceId }) });
        toast({ title: "Sync initiated", description: "Mock data is being updated." });
      }
    });
  };

  return (
    <SidebarLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Ad Platforms</h1>
        <p className="text-muted-foreground mt-1">Connect your advertising accounts to sync metrics.</p>
      </div>

      <Alert className="mb-8 border-amber-500/50 bg-amber-500/10">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800 dark:text-amber-500">Mock Integration Mode</AlertTitle>
        <AlertDescription className="text-amber-700/80 dark:text-amber-500/80">
          This is an MVP environment. Connecting an account will not authenticate with real APIs or pull real live data. 
          Metrics shown are simulated for demonstration purposes.
        </AlertDescription>
      </Alert>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[250px] w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {PLATFORMS.map((platform) => {
            const connection = connections?.find(c => c.platform === platform.id);
            
            return (
              <Card key={platform.id} className={`overflow-hidden border-2 ${connection ? 'border-primary/20' : 'border-border'}`}>
                <div className={`h-2 w-full ${platform.color}`} />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{platform.name}</CardTitle>
                    {connection ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Connected</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Not Connected</Badge>
                    )}
                  </div>
                  {connection && (
                    <CardDescription>Account: <span className="font-medium text-foreground">{connection.accountName}</span></CardDescription>
                  )}
                </CardHeader>
                
                <CardContent>
                  {connection ? (
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-muted rounded-lg p-3">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Spend</p>
                        <p className="font-bold text-lg">${connection.mockSpend.toLocaleString()}</p>
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Impressions</p>
                        <p className="font-bold text-lg">{(connection.mockImpressions / 1000).toFixed(1)}k</p>
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Clicks</p>
                        <p className="font-bold text-lg">{connection.mockClicks.toLocaleString()}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[84px] flex items-center justify-center border border-dashed rounded-lg bg-muted/20 text-sm text-muted-foreground">
                      Connect to sync campaign metrics
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="bg-muted/30 border-t p-4 flex justify-between items-center">
                  {connection ? (
                    <>
                      <span className="text-xs text-muted-foreground">
                        {connection.lastSyncAt ? `Synced ${formatDistanceToNow(new Date(connection.lastSyncAt))} ago` : 'Never synced'}
                      </span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleDisconnect(connection.id)} disabled={deleteConnection.isPending}>
                          <Unplug className="h-4 w-4 mr-2" />
                          Disconnect
                        </Button>
                        <Button size="sm" onClick={() => handleSync(connection.id)} disabled={syncConnection.isPending}>
                          <RefreshCw className={`h-4 w-4 mr-2 ${syncConnection.isPending ? 'animate-spin' : ''}`} />
                          Sync Now
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-muted-foreground">MOCK — no real API</span>
                      <Dialog open={connectingPlatform === platform.id} onOpenChange={(open) => {
                        if (!open) {
                          setConnectingPlatform(null);
                          form.reset();
                        } else {
                          setConnectingPlatform(platform.id);
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button size="sm">Connect Account</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Connect {platform.name}</DialogTitle>
                            <DialogDescription>
                              Enter a mock account name to simulate a connection. No real authentication will occur.
                            </DialogDescription>
                          </DialogHeader>
                          <Form {...form}>
                            <form onSubmit={form.handleSubmit(onConnect)} className="space-y-4">
                              <FormField
                                control={form.control}
                                name="accountName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Mock Account Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Acme Ads Global" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <DialogFooter>
                                <Button type="submit" disabled={createConnection.isPending}>
                                  {createConnection.isPending ? "Connecting..." : "Simulate Connection"}
                                </Button>
                              </DialogFooter>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </SidebarLayout>
  );
}
