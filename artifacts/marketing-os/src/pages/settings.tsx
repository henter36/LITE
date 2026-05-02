import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { RefreshCw, Unplug, Search, Plus, Settings } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  useListBrandProfiles,
  useCreateBrandProfile,
  useUpdateBrandProfile,
  getListBrandProfilesQueryKey,
  useListConnections,
  useCreateConnection,
  useDeleteConnection,
  useSyncConnection,
  getListConnectionsQueryKey,
  useListAuditLogs,
  getListAuditLogsQueryKey,
  useListWorkspaces,
  useCreateWorkspace,
  useUpdateWorkspace,
  getListWorkspacesQueryKey,
} from "@workspace/api-client-react";

// --- Brand Profile ---
const CHANNELS = [
  { id: "instagram", label: "Instagram" },
  { id: "snapchat", label: "Snapchat" },
  { id: "youtube", label: "YouTube" },
  { id: "x", label: "X (Twitter)" },
] as const;

const brandProfileSchema = z.object({
  brandName: z.string().min(1, "Brand name is required"),
  toneOfVoice: z.string().min(1, "Tone of voice is required"),
  targetAudience: z.string().min(1, "Target audience is required"),
  productsServices: z.string().min(1, "Products/Services are required"),
  forbiddenClaims: z.string().min(1, "Forbidden claims are required"),
  preferredChannels: z.array(z.string()).min(1, "Select at least one channel"),
  visualNotes: z.string().optional(),
});

function BrandProfileTab() {
  const { activeWorkspaceId } = useAuth();
  const { data: profiles, isLoading } = useListBrandProfiles({ workspaceId: activeWorkspaceId });
  const profile = profiles?.[0];
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createProfile = useCreateBrandProfile();
  const updateProfile = useUpdateBrandProfile();

  const form = useForm<z.infer<typeof brandProfileSchema>>({
    resolver: zodResolver(brandProfileSchema),
    defaultValues: {
      brandName: "",
      toneOfVoice: "",
      targetAudience: "",
      productsServices: "",
      forbiddenClaims: "",
      preferredChannels: [],
      visualNotes: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        brandName: profile.brandName,
        toneOfVoice: profile.toneOfVoice,
        targetAudience: profile.targetAudience,
        productsServices: profile.productsServices,
        forbiddenClaims: profile.forbiddenClaims,
        preferredChannels: profile.preferredChannels,
        visualNotes: profile.visualNotes,
      });
    }
  }, [profile, form]);

  const onSubmit = (data: z.infer<typeof brandProfileSchema>) => {
    const payload = { ...data, workspaceId: activeWorkspaceId, visualNotes: data.visualNotes || "" };
    if (profile) {
      updateProfile.mutate({ id: profile.id, data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBrandProfilesQueryKey({ workspaceId: activeWorkspaceId }) });
          toast({ title: "Brand profile saved" });
        },
      });
    } else {
      createProfile.mutate({ data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBrandProfilesQueryKey({ workspaceId: activeWorkspaceId }) });
          toast({ title: "Brand profile created" });
        },
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brand Guidelines</CardTitle>
        <CardDescription>
          These settings guide the AI when writing ad copy for your campaigns.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="brandName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Corp" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="toneOfVoice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tone of Voice</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Professional, friendly, slightly humorous..." className="resize-none" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="targetAudience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Audience</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Small business owners, aged 25–45..." className="resize-none" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="productsServices"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Products & Services Overview</FormLabel>
                  <FormControl>
                    <Textarea placeholder="We sell B2B SaaS for marketing automation..." className="resize-none" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="forbiddenClaims"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Things to never say</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Do not guarantee 10x growth, do not mention competitors..." className="resize-none" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="preferredChannels"
              render={() => (
                <FormItem>
                  <FormLabel className="text-base">Preferred Channels</FormLabel>
                  <div className="flex flex-wrap gap-3 pt-1">
                    {CHANNELS.map((channel) => (
                      <FormField
                        key={channel.id}
                        control={form.control}
                        name="preferredChannels"
                        render={({ field }) => (
                          <FormItem key={channel.id} className="flex flex-row items-center space-x-2.5 space-y-0 rounded-lg border px-4 py-3 hover:bg-muted/50 cursor-pointer">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(channel.id)}
                                onCheckedChange={(checked) =>
                                  checked
                                    ? field.onChange([...(field.value || []), channel.id])
                                    : field.onChange(field.value?.filter((v) => v !== channel.id))
                                }
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">{channel.label}</FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="visualNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visual Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Always use primary purple #845EF7, prefer high contrast photography..." className="resize-none" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="lg" disabled={createProfile.isPending || updateProfile.isPending}>
              {createProfile.isPending || updateProfile.isPending ? "Saving..." : "Save Brand Profile"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// --- Ad Platforms ---
const PLATFORMS = [
  { id: "instagram", name: "Instagram / Meta Ads", color: "bg-pink-500" },
  { id: "snapchat", name: "Snapchat Ads", color: "bg-yellow-400" },
  { id: "youtube", name: "YouTube / Google Ads", color: "bg-red-500" },
  { id: "x", name: "X (Twitter) Ads", color: "bg-neutral-800 dark:bg-neutral-200" },
  { id: "tiktok", name: "TikTok Ads", color: "bg-slate-900 dark:bg-slate-100" },
] as const;

const connectSchema = z.object({
  accountName: z.string().min(1, "Account name is required"),
});

function AdPlatformsTab() {
  const { activeWorkspaceId } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  const { data: connections, isLoading } = useListConnections(
    { workspaceId: activeWorkspaceId },
    { query: { enabled: !!activeWorkspaceId, queryKey: getListConnectionsQueryKey({ workspaceId: activeWorkspaceId }) } }
  );
  const createConnection = useCreateConnection();
  const deleteConnection = useDeleteConnection();
  const syncConnection = useSyncConnection();

  const form = useForm<z.infer<typeof connectSchema>>({
    resolver: zodResolver(connectSchema),
    defaultValues: { accountName: "" },
  });

  const onConnect = (data: z.infer<typeof connectSchema>) => {
    if (!connectingPlatform) return;
    createConnection.mutate(
      { data: { workspaceId: activeWorkspaceId, platform: connectingPlatform as any, accountName: data.accountName } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListConnectionsQueryKey({ workspaceId: activeWorkspaceId }) });
          setConnectingPlatform(null);
          form.reset();
          toast({ title: "Demo account connected" });
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground border rounded-lg px-4 py-3 bg-muted/20">
        Demo mode — connecting an account uses simulated data only. No real ad APIs are called.
      </p>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {PLATFORMS.map((platform) => {
            const connection = connections?.find((c) => c.platform === platform.id);
            return (
              <Card key={platform.id} className={`overflow-hidden border-2 ${connection ? "border-primary/20" : "border-border"}`}>
                <div className={`h-1.5 w-full ${platform.color}`} />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{platform.name}</CardTitle>
                    {connection ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20 text-xs">
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground text-xs">Not Connected</Badge>
                    )}
                  </div>
                  {connection && (
                    <CardDescription>
                      Account: <span className="font-medium text-foreground">{connection.accountName}</span>
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pb-3">
                  {connection ? (
                    <div className="grid grid-cols-3 gap-3 text-center">
                      {[
                        { label: "Spend", value: `$${connection.mockSpend.toLocaleString()}` },
                        { label: "Impr.", value: `${(connection.mockImpressions / 1000).toFixed(1)}k` },
                        { label: "Clicks", value: connection.mockClicks.toLocaleString() },
                      ].map((stat) => (
                        <div key={stat.label} className="bg-muted rounded-lg p-2">
                          <p className="text-xs text-muted-foreground mb-0.5">{stat.label}</p>
                          <p className="font-bold">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-[62px] flex items-center justify-center border border-dashed rounded-lg bg-muted/20 text-sm text-muted-foreground">
                      Connect to see demo metrics
                    </div>
                  )}
                </CardContent>
                <CardFooter className="bg-muted/20 border-t px-4 py-3 flex justify-between items-center gap-2">
                  {connection ? (
                    <>
                      <span className="text-xs text-muted-foreground">
                        {connection.lastSyncAt
                          ? `Synced ${formatDistanceToNow(new Date(connection.lastSyncAt))} ago`
                          : "Never synced"}
                      </span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => { deleteConnection.mutate({ id: connection.id }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListConnectionsQueryKey({ workspaceId: activeWorkspaceId }) }); toast({ title: "Disconnected" }); } }); }} disabled={deleteConnection.isPending}>
                          <Unplug className="h-3.5 w-3.5 mr-1.5" />
                          Disconnect
                        </Button>
                        <Button size="sm" onClick={() => { syncConnection.mutate({ id: connection.id }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListConnectionsQueryKey({ workspaceId: activeWorkspaceId }) }); toast({ title: "Sync initiated" }); } }); }} disabled={syncConnection.isPending}>
                          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncConnection.isPending ? "animate-spin" : ""}`} />
                          Sync
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-muted-foreground">Demo only</span>
                      <Dialog
                        open={connectingPlatform === platform.id}
                        onOpenChange={(open) => {
                          if (!open) { setConnectingPlatform(null); form.reset(); }
                          else setConnectingPlatform(platform.id);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button size="sm">Connect</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Connect {platform.name}</DialogTitle>
                            <DialogDescription>
                              Enter a demo account name. No real authentication will occur.
                            </DialogDescription>
                          </DialogHeader>
                          <Form {...form}>
                            <form onSubmit={form.handleSubmit(onConnect)} className="space-y-4">
                              <FormField
                                control={form.control}
                                name="accountName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Account Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Acme Ads Global" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <DialogFooter>
                                <Button type="submit" disabled={createConnection.isPending}>
                                  {createConnection.isPending ? "Connecting..." : "Connect Account"}
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
    </div>
  );
}

// --- Activity Log ---
function ActivityLogTab() {
  const { activeWorkspaceId } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const { data: logPage, isLoading } = useListAuditLogs(
    { workspaceId: activeWorkspaceId, limit: 50, search: debouncedSearch || undefined },
    {
      query: {
        enabled: !!activeWorkspaceId,
        queryKey: getListAuditLogsQueryKey({ workspaceId: activeWorkspaceId, limit: 50, search: debouncedSearch || undefined }),
      },
    }
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription className="mt-1">A record of all actions taken in this account.</CardDescription>
          </div>
          <div className="relative w-full sm:w-[260px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activity..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !logPage?.items || logPage.items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg bg-muted/20 text-sm">
            No activity found.
          </div>
        ) : (
          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">When</TableHead>
                  <TableHead>Who</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>What</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logPage.items.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="font-medium text-sm">{log.actor}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal text-xs bg-muted">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize text-sm">{log.entityType || "—"}</span>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground max-w-[240px] truncate" title={log.details}>
                      {log.details || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Account ---
const workspaceSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  businessType: z.string().min(1, "Business type is required"),
  country: z.string().min(1, "Country is required"),
  language: z.string().min(1, "Language is required"),
  defaultCurrency: z.string().min(1, "Currency is required"),
});

function AccountTab() {
  const { data: workspaces, isLoading } = useListWorkspaces();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createWorkspace = useCreateWorkspace();
  const updateWorkspace = useUpdateWorkspace();

  const form = useForm<z.infer<typeof workspaceSchema>>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: { name: "", businessType: "", country: "", language: "", defaultCurrency: "USD" },
  });

  const onSubmit = (data: z.infer<typeof workspaceSchema>) => {
    if (editingId) {
      updateWorkspace.mutate({ id: editingId, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListWorkspacesQueryKey() });
          setIsDialogOpen(false);
          toast({ title: "Account updated" });
        },
      });
    } else {
      createWorkspace.mutate({ data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListWorkspacesQueryKey() });
          setIsDialogOpen(false);
          form.reset();
          toast({ title: "Account created" });
        },
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Manage the accounts (workspaces) you have access to.</p>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) { setEditingId(null); form.reset(); }
        }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Account" : "Create Account"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Name</FormLabel>
                    <FormControl><Input placeholder="Acme Corp" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="businessType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Type</FormLabel>
                    <FormControl><Input placeholder="E-commerce, SaaS, Agency..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl><Input placeholder="US" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="language" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <FormControl><Input placeholder="en" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="defaultCurrency" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="CAD">CAD (CA$)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <DialogFooter>
                  <Button type="submit" disabled={createWorkspace.isPending || updateWorkspace.isPending}>
                    {createWorkspace.isPending || updateWorkspace.isPending ? "Saving..." : "Save Account"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {workspaces?.map((ws) => (
            <Card key={ws.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-base">{ws.name}</CardTitle>
                  <CardDescription className="mt-0.5">{ws.businessType}</CardDescription>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                  setEditingId(ws.id);
                  form.reset({
                    name: ws.name,
                    businessType: ws.businessType,
                    country: ws.country,
                    language: ws.language,
                    defaultCurrency: ws.defaultCurrency,
                  });
                  setIsDialogOpen(true);
                }}>
                  <Settings className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex gap-3 text-sm text-muted-foreground border-t pt-3">
                <span>{ws.country}</span>
                <span>·</span>
                <span>{ws.language}</span>
                <span>·</span>
                <span>{ws.defaultCurrency}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Main Settings Page ---
export default function SettingsPage() {
  return (
    <SidebarLayout>
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2 text-base">Manage your brand, platforms, and account.</p>
      </div>

      <Tabs defaultValue="brand">
        <TabsList className="mb-6">
          <TabsTrigger value="brand">Brand Profile</TabsTrigger>
          <TabsTrigger value="platforms">Ad Platforms</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="brand">
          <BrandProfileTab />
        </TabsContent>

        <TabsContent value="platforms">
          <AdPlatformsTab />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityLogTab />
        </TabsContent>

        <TabsContent value="account">
          <AccountTab />
        </TabsContent>
      </Tabs>
    </SidebarLayout>
  );
}
