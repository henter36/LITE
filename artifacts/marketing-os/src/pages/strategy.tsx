import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateStrategyIntake,
  useGenerateStrategyDiagnosis,
  useGetLatestStrategyDiagnosis,
  useGetStrategyIntake,
  useUpdateStrategyIntake,
  getGetLatestStrategyDiagnosisQueryKey,
  getGetStrategyIntakeQueryKey,
} from "@workspace/api-client-react";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const emptyIntake = {
  businessOverview: "",
  productsServices: "",
  targetCustomers: "",
  geography: "",
  currentChannels: "",
  competitors: "",
  currentOffers: "",
  budgetRange: "",
  growthGoals: "",
  mainPainPoints: "",
};

export default function StrategyPage() {
  const { activeWorkspaceId, user } = useAuth();
  const isViewer = user?.role === "viewer";
  const canEdit = !isViewer;
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyIntake);

  const { data: latestIntake } = useGetStrategyIntake(
    { workspaceId: activeWorkspaceId },
    { query: { enabled: !!activeWorkspaceId, queryKey: ["strategy-intake", activeWorkspaceId] } },
  );
  const { data: latestDiagnosis } = useGetLatestStrategyDiagnosis(
    { workspaceId: activeWorkspaceId },
    { query: { enabled: !!activeWorkspaceId, queryKey: ["strategy-diagnosis", activeWorkspaceId] } },
  );
  const createIntake = useCreateStrategyIntake();
  const updateIntake = useUpdateStrategyIntake();
  const generateDiagnosis = useGenerateStrategyDiagnosis();

  useEffect(() => {
    if (latestIntake) {
      setForm({
        businessOverview: latestIntake.businessCategory ?? "",
        productsServices: latestIntake.currentOffer ?? "",
        targetCustomers: latestIntake.targetAudience ?? "",
        geography: latestIntake.geography ?? "",
        currentChannels: latestIntake.availableAssets ?? "",
        competitors: latestIntake.previousLearnings ?? "",
        currentOffers: latestIntake.currentOffer ?? "",
        budgetRange: latestIntake.budgetRange ?? "",
        growthGoals: latestIntake.primaryGoal ?? "",
        mainPainPoints: latestIntake.painPoints ?? "",
      });
    }
  }, [latestIntake]);

  const draft = useMemo(() => {
    if (!latestDiagnosis) return null;
    return {
      currentSituation: latestDiagnosis.summary,
      audienceClarity: latestDiagnosis.audienceSummary,
      offerStrength: latestDiagnosis.offerSummary,
      channelReadiness: latestDiagnosis.likelyCreativeDirection,
      funnelGaps: latestDiagnosis.whatIsMissing,
      risks: latestDiagnosis.topObjections,
      opportunities: latestDiagnosis.whatToTestFirst,
    };
  }, [latestDiagnosis]);

  const saveIntake = async () => {
    const payload = {
      workspaceId: activeWorkspaceId,
      businessCategory: form.businessOverview,
      currentOffer: form.currentOffers,
      targetAudience: form.targetCustomers,
      geography: form.geography,
      budgetRange: form.budgetRange,
      primaryGoal: form.growthGoals,
      brandVoice: "",
      painPoints: form.mainPainPoints,
      availableAssets: form.currentChannels,
      previousLearnings: form.competitors,
    };
    if (latestIntake) {
      await updateIntake.mutateAsync({ data: payload });
    } else {
      await createIntake.mutateAsync({ data: payload });
    }
    await queryClient.invalidateQueries({ queryKey: getGetStrategyIntakeQueryKey({ workspaceId: activeWorkspaceId }) });
  };

  const runDiagnosis = async () => {
    await generateDiagnosis.mutateAsync({ data: { workspaceId: activeWorkspaceId } });
    await queryClient.invalidateQueries({ queryKey: getGetLatestStrategyDiagnosisQueryKey({ workspaceId: activeWorkspaceId }) });
  };

  return (
    <SidebarLayout>
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Strategy</h1>
        <p className="text-muted-foreground">Demo-only strategy planning for internal review.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">Strategy is advisory</Badge>
        <Badge variant="secondary">Human approval required before campaign execution</Badge>
        <Badge variant="secondary">No guaranteed performance claims</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Intake</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries({
            businessOverview: "Business overview",
            productsServices: "Products / services",
            targetCustomers: "Target customers",
            geography: "Geography",
            currentChannels: "Current channels",
            competitors: "Competitors",
            currentOffers: "Current offers",
            budgetRange: "Budget range",
            growthGoals: "Growth goals",
            mainPainPoints: "Main pain points",
          }).map(([key, label]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{label}</Label>
              <Textarea
                id={key}
                value={(form as Record<string, string>)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                readOnly={isViewer}
              />
            </div>
          ))}
          <Button onClick={saveIntake} disabled={!canEdit || createIntake.isPending || updateIntake.isPending}>
            Save Intake
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Diagnosis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runDiagnosis} disabled={!canEdit || generateDiagnosis.isPending}>
            Generate Diagnosis
          </Button>
          {latestDiagnosis ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["Current situation", latestDiagnosis.summary],
                ["Audience clarity", latestDiagnosis.audienceSummary],
                ["Offer strength", latestDiagnosis.offerSummary],
                ["Channel readiness", latestDiagnosis.likelyCreativeDirection],
                ["Funnel gaps", latestDiagnosis.whatIsMissing],
                ["Risks", latestDiagnosis.topObjections],
                ["Opportunities", latestDiagnosis.whatToTestFirst],
              ].map(([title, value]) => (
                <div key={title as string} className="rounded-lg border p-4">
                  <p className="text-sm font-medium">{title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{value as string}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No diagnosis yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Strategy Draft</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {draft ? (
            <div className="space-y-2">
              <p><strong>Current situation:</strong> {draft.currentSituation}</p>
              <p><strong>Audience clarity:</strong> {draft.audienceClarity}</p>
              <p><strong>Offer strength:</strong> {draft.offerStrength}</p>
              <p><strong>Channel readiness:</strong> {draft.channelReadiness}</p>
              <p><strong>Funnel gaps:</strong> {draft.funnelGaps}</p>
              <p><strong>Risks:</strong> {draft.risks}</p>
              <p><strong>Opportunities:</strong> {draft.opportunities}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Generate a diagnosis to view the draft.</p>
          )}
        </CardContent>
      </Card>
    </SidebarLayout>
  );
}