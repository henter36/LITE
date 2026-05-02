import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { useListWorkspaces, useCreateWorkspace, useUpdateWorkspace, getListWorkspacesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const workspaceSchema = z.object({
  name: z.string().min(1, "Workspace name is required"),
  businessType: z.string().min(1, "Business type is required"),
  country: z.string().min(1, "Country is required"),
  language: z.string().min(1, "Language is required"),
  defaultCurrency: z.string().min(1, "Currency is required"),
});

export default function Workspaces() {
  const { data: workspaces, isLoading } = useListWorkspaces();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<number | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createWorkspace = useCreateWorkspace();
  const updateWorkspace = useUpdateWorkspace();

  const form = useForm<z.infer<typeof workspaceSchema>>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: "",
      businessType: "",
      country: "",
      language: "",
      defaultCurrency: "USD",
    },
  });

  const onSubmit = (data: z.infer<typeof workspaceSchema>) => {
    if (editingWorkspaceId) {
      updateWorkspace.mutate({ id: editingWorkspaceId, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListWorkspacesQueryKey() });
          setIsCreateOpen(false);
          toast({ title: "Workspace updated successfully" });
        }
      });
    } else {
      createWorkspace.mutate({ data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListWorkspacesQueryKey() });
          setIsCreateOpen(false);
          form.reset();
          toast({ title: "Workspace created successfully" });
        }
      });
    }
  };

  const handleEdit = (workspace: any) => {
    setEditingWorkspaceId(workspace.id);
    form.reset({
      name: workspace.name,
      businessType: workspace.businessType,
      country: workspace.country,
      language: workspace.language,
      defaultCurrency: workspace.defaultCurrency,
    });
    setIsCreateOpen(true);
  };

  return (
    <SidebarLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workspaces</h1>
          <p className="text-muted-foreground mt-1">Manage your business workspaces.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            setEditingWorkspaceId(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Workspace
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingWorkspaceId ? "Edit Workspace" : "Create Workspace"}</DialogTitle>
              <DialogDescription>
                {editingWorkspaceId ? "Update your workspace details below." : "Set up a new workspace for your business."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workspace Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Corp" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="businessType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Type</FormLabel>
                      <FormControl>
                        <Input placeholder="E-commerce, SaaS, Agency..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input placeholder="US" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <FormControl>
                          <Input placeholder="en" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="defaultCurrency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="CAD">CAD (£)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createWorkspace.isPending || updateWorkspace.isPending}>
                    {createWorkspace.isPending || updateWorkspace.isPending ? "Saving..." : "Save Workspace"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[160px] w-full rounded-xl" />
          ))}
        </div>
      ) : workspaces?.length === 0 ? (
        <Card className="mt-6 flex flex-col items-center justify-center py-12">
          <CardHeader>
            <CardTitle className="text-xl">No workspaces found</CardTitle>
            <CardDescription>Create your first workspace to get started.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
          {workspaces?.map((workspace) => (
            <Card key={workspace.id} className="flex flex-col">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle>{workspace.name}</CardTitle>
                  <CardDescription className="mt-1">{workspace.businessType}</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(workspace)}>
                  <Settings className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="mt-auto pt-4 flex gap-4 text-sm text-muted-foreground border-t">
                <div className="flex items-center gap-1">
                  <span>{workspace.country}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>{workspace.language}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>{workspace.defaultCurrency}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </SidebarLayout>
  );
}
