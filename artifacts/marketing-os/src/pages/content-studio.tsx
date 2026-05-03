import { SidebarLayout } from "@/components/layout/sidebar-layout";
import {
  useListCampaigns,
  useGenerateAssets,
  useListAssets,
  useCreateApproval,
  useUpdateMediaAsset,
  useListBrandProfiles,
  useGetAssetVariants,
  getListAssetsQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles,
  Check,
  Edit3,
  RefreshCw,
  PenTool,
  ShieldCheck,
  AlertCircle,
  ChevronRight,
  EyeOff,
  ImageIcon,
  Video,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
  Save,
} from "lucide-react";
import { Link as WouterLink, useSearch } from "wouter";
