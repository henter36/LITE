import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import {
  Image,
  Video,
  FileText,
  Link as LinkIcon,
  File,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  EyeOff,
  ExternalLink,
  Pencil,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useListWorkspaces, useListCampaigns, getListCampaignsQueryKey } from "@workspace/api-client-react";

type AssetType = "image" | "video" | "document" | "link" | "other";
type SourceType = "uploaded" | "external_url" | "generated_later";
type AssetStatus = "draft" | "needs_review" | "approved" | "rejected";

interface MediaAsset {
  id: number;
  workspaceId: number;
  campaignId: number | null;
  title: string;
  type: AssetType;
  sourceType: SourceType;
  urlOrReference: string;
  description: string;
  channel: string | null;
  status: AssetStatus;
  usageRightsNotes: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

const TYPE_ICONS: Record<AssetType, React.ElementType> = {
  image: Image,
  video: Video,
  document: FileText,
  link: LinkIcon,
  other: File,
};

const TYPE_LABELS: Record<AssetType, string> = {
  image: "Image",
  video: "Video",
  document: "Document",
  link: "Link",
  other: "Other",
};

const SOURCE_LABELS: Record<SourceType, string> = {
  uploaded: "Uploaded",
  external_url: "External URL",
  generated_later: "To generate",
};

const STATUS_COLORS: Record<AssetStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  needs_review: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  approved: "bg-green-500/10 text-green-700 border-green-500/20",
  rejected: "bg-red-500/10 text-red-700 border-red-500/20",
};

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? res.statusText);
  }
  if (res.status === 204) return null;
  return res.json();
}

function useMediaAssets(workspaceId: number | null) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/api/media-assets?workspaceId=${workspaceId}`);
      setAssets(data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  return { assets, loading, error, load, setAssets };
}

const EMPTY_FORM = {
  title: "",
  type: "image" as AssetType,
  sourceType: "external_url" as SourceType,
  urlOrReference: "",
  description: "",
  channel: "",
  status: "draft" as AssetStatus,
  usageRightsNotes: "",
  campaignId: "" as string,
};

export default function AssetLibraryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isViewer = user?.role === "viewer";

  const { data: workspaces } = useListWorkspaces();
  const [workspaceId, setWorkspaceId] = useState<number | null>(null);

  const effectiveWorkspaceId =
    workspaceId ?? (workspaces && workspaces.length > 0 ? workspaces[0].id : null);

  const { assets, loading, error, load, setAssets } = useMediaAssets(effectiveWorkspaceId);

  const campaignParams = { workspaceId: effectiveWorkspaceId ?? 0 };
  const { data: campaigns } = useListCampaigns(campaignParams, {
    query: {
      enabled: !!effectiveWorkspaceId,
      queryKey: getListCampaignsQueryKey(campaignParams),
    },
  });

  const [hasLoaded, setHasLoaded] = useState(false);

  if (effectiveWorkspaceId && !hasLoaded) {
    setHasLoaded(true);
    load();
  }

  const reload = async () => {
    await load();
  };

  const [createOpen, setCreateOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<MediaAsset | null>(null);
  const [deleteAsset, setDeleteAsset] = useState<MediaAsset | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setCreateOpen(true);
  };

  const openEdit = (a: MediaAsset) => {
    setForm({
      title: a.title,
      type: a.type,
      sourceType: a.sourceType,
      urlOrReference: a.urlOrReference,
      description: a.description,
      channel: a.channel ?? "",
      status: a.status,
      usageRightsNotes: a.usageRightsNotes,
      campaignId: a.campaignId ? String(a.campaignId) : "",
    });
    setEditAsset(a);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.urlOrReference.trim()) {
      toast({ title: "Title and URL/reference are required", variant: "destructive" });
      return;
    }
    if (form.status === "approved" && !form.usageRightsNotes.trim()) {
      toast({ title: "Usage rights notes are required to approve an asset", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        workspaceId: effectiveWorkspaceId,
        campaignId: form.campaignId ? Number(form.campaignId) : null,
        title: form.title,
        type: form.type,
        sourceType: form.sourceType,
        urlOrReference: form.urlOrReference,
        description: form.description,
        channel: form.channel || null,
        status: form.status,
        usageRightsNotes: form.usageRightsNotes,
      };
      if (editAsset) {
        const updated = await apiFetch(`/api/media-assets/${editAsset.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setAssets((prev) => prev.map((a) => (a.id === editAsset.id ? updated : a)));
        toast({ title: "Asset updated" });
        setEditAsset(null);
      } else {
        const created = await apiFetch("/api/media-assets", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setAssets((prev) => [...prev, created]);
        toast({ title: "Asset reference created" });
        setCreateOpen(false);
      }
      queryClient.invalidateQueries();
    } catch (e) {
      toast({
        title: editAsset ? "Failed to update asset" : "Failed to create asset",
        description: e instanceof Error ? e.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (asset: MediaAsset, newStatus: AssetStatus) => {
    if (newStatus === "approved" && !asset.usageRightsNotes.trim()) {
      toast({
        title: "Usage rights notes required",
        description: "Edit the asset to add usage rights notes before approving.",
        variant: "destructive",
      });
      return;
    }
    try {
      const updated = await apiFetch(`/api/media-assets/${asset.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      setAssets((prev) => prev.map((a) => (a.id === asset.id ? updated : a)));
      toast({ title: `Asset ${newStatus}` });
    } catch (e) {
      toast({
        title: "Failed to update status",
        description: e instanceof Error ? e.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteAsset) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/media-assets/${deleteAsset.id}`, { method: "DELETE" });
      setAssets((prev) => prev.filter((a) => a.id !== deleteAsset.id));
      toast({ title: "Asset deleted" });
      setDeleteAsset(null);
    } catch (e) {
      toast({
        title: "Failed to delete asset",
        description: e instanceof Error ? e.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const AssetFormContent = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label>Title *</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Hero banner Q2 2025"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Asset type *</Label>
          <Select
            value={form.type}
            onValueChange={(v) => setForm((f) => ({ ...f, type: v as AssetType }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["image", "video", "document", "link", "other"] as const).map((t) => (
                <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Source</Label>
          <Select
            value={form.sourceType}
            onValueChange={(v) => setForm((f) => ({ ...f, sourceType: v as SourceType }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="external_url">External URL</SelectItem>
              <SelectItem value="uploaded">Uploaded</SelectItem>
              <SelectItem value="generated_later">To generate later</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label>URL / Reference *</Label>
          <Input
            value={form.urlOrReference}
            onChange={(e) => setForm((f) => ({ ...f, urlOrReference: e.target.value }))}
            placeholder="https://... or folder path or drive link"
          />
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label>Description</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Brief description of the asset"
            rows={2}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select
            value={form.status}
            onValueChange={(v) => setForm((f) => ({ ...f, status: v as AssetStatus }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="needs_review">Needs review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Link to campaign</Label>
          <Select
            value={form.campaignId || "__none__"}
            onValueChange={(v) => setForm((f) => ({ ...f, campaignId: v === "__none__" ? "" : v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
              {campaigns?.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label>
            Usage rights notes
            {form.status === "approved" && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </Label>
          <Textarea
            value={form.usageRightsNotes}
            onChange={(e) => setForm((f) => ({ ...f, usageRightsNotes: e.target.value }))}
            placeholder="e.g. Licensed for paid social use, expires Dec 2025. No competitor placements."
            rows={2}
          />
          <p className="text-xs text-muted-foreground">
            Required to approve the asset. Describe permitted uses, licenses, or restrictions.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <SidebarLayout>
      {isViewer && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground border rounded-lg px-4 py-2.5 bg-muted/20">
          <EyeOff className="h-4 w-4 shrink-0" />
          <span>
            <span className="font-medium text-foreground">Read-only access.</span>{" "}
            You can browse the asset library but cannot make changes.
          </span>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Asset Library</h1>
          <p className="text-muted-foreground mt-1">
            Manage creative asset references — images, videos, documents, and links.
          </p>
        </div>
        {!isViewer && (
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </Button>
        )}
      </div>

      {workspaces && workspaces.length > 1 && (
        <div className="flex items-center gap-3">
          <Label className="text-sm text-muted-foreground">Workspace</Label>
          <Select
            value={String(effectiveWorkspaceId ?? "")}
            onValueChange={(v) => {
              setWorkspaceId(Number(v));
              setHasLoaded(false);
            }}
          >
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {workspaces.map((w) => (
                <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Creative Assets</CardTitle>
            <Button variant="ghost" size="sm" onClick={reload} disabled={loading}>
              {loading ? "Loading…" : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : error ? (
            <div className="text-center py-10 text-muted-foreground text-sm border border-dashed rounded-lg">
              <p className="font-medium text-destructive mb-1">Failed to load assets</p>
              <p>{error}</p>
            </div>
          ) : assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-lg">
              <File className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="font-medium mb-1">No assets yet</p>
              <p className="text-muted-foreground text-sm mb-4">
                {isViewer
                  ? "No creative assets have been added to this workspace."
                  : 'Add asset references — images, videos, documents, or links.'}
              </p>
              {!isViewer && (
                <Button variant="outline" onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Asset
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {assets.map((asset) => {
                const TypeIcon = TYPE_ICONS[asset.type] ?? File;
                const campaign = campaigns?.find((c) => c.id === asset.campaignId);
                return (
                  <div
                    key={asset.id}
                    className="border rounded-lg p-4 flex flex-col sm:flex-row sm:items-start gap-4"
                  >
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <TypeIcon className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-semibold leading-tight">{asset.title}</p>
                          {asset.description && (
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                              {asset.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          <Badge variant="outline" className="text-xs capitalize">
                            {TYPE_LABELS[asset.type]}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {SOURCE_LABELS[asset.sourceType]}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-xs capitalize ${STATUS_COLORS[asset.status]}`}
                          >
                            {asset.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <a
                          href={asset.urlOrReference.startsWith("http") ? asset.urlOrReference : undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary flex items-center gap-1 hover:underline max-w-xs truncate"
                        >
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          <span className="truncate">{asset.urlOrReference}</span>
                        </a>
                        {campaign && (
                          <span className="text-xs text-muted-foreground">
                            Campaign: <span className="font-medium">{campaign.name}</span>
                          </span>
                        )}
                        {asset.usageRightsNotes && (
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            Rights: {asset.usageRightsNotes}
                          </span>
                        )}
                      </div>
                    </div>

                    {!isViewer && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {asset.status !== "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-700 border-green-500/30 hover:bg-green-500/10"
                            onClick={() => handleStatusChange(asset, "approved")}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            Approve
                          </Button>
                        )}
                        {asset.status !== "rejected" && asset.status !== "draft" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-700 border-red-500/30 hover:bg-red-500/10"
                            onClick={() => handleStatusChange(asset, "rejected")}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            Reject
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEdit(asset)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteAsset(asset)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Asset Reference</DialogTitle>
            <DialogDescription>
              Register an existing creative asset by URL, path, or reference. No binary upload.
            </DialogDescription>
          </DialogHeader>
          <AssetFormContent />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Add Asset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editAsset} onOpenChange={(open) => { if (!open) setEditAsset(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
            <DialogDescription>
              Update the asset reference, metadata, or status.
            </DialogDescription>
          </DialogHeader>
          <AssetFormContent />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAsset(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteAsset} onOpenChange={(open) => { if (!open) setDeleteAsset(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete asset?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteAsset?.title}". This action cannot be undone.
              {deleteAsset?.status === "approved" && (
                <span className="block mt-2 text-destructive font-medium">
                  Note: approved assets cannot be deleted. Change the status first.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting || deleteAsset?.status === "approved"}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarLayout>
  );
}
