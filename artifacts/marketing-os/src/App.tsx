import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Campaigns from "@/pages/campaigns";
import NewCampaign from "@/pages/campaigns-new";
import CampaignDetail from "@/pages/campaign-detail";
import ContentStudio from "@/pages/content-studio";
import StrategyPage from "@/pages/strategy";
import Reports from "@/pages/reports";
import SettingsPage from "@/pages/settings";

// Legacy routes still accessible via direct URL
import Workspaces from "@/pages/workspaces";
import BrandProfile from "@/pages/brand-profile";
import TrackingLinks from "@/pages/tracking-links";
import Connections from "@/pages/connections";
import AuditLog from "@/pages/audit-log";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/campaigns" component={() => <ProtectedRoute component={Campaigns} />} />
      <Route path="/campaigns/new" component={() => <ProtectedRoute component={NewCampaign} />} />
      <Route path="/campaigns/:id" component={() => <ProtectedRoute component={CampaignDetail} />} />
      <Route path="/content-studio" component={() => <ProtectedRoute component={ContentStudio} />} />
      <Route path="/strategy" component={() => <ProtectedRoute component={StrategyPage} />} />
      <Route path="/reports" component={() => <ProtectedRoute component={Reports} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={SettingsPage} />} />
      {/* Legacy routes kept for direct access */}
      <Route path="/workspaces" component={() => <ProtectedRoute component={Workspaces} />} />
      <Route path="/brand-profile" component={() => <ProtectedRoute component={BrandProfile} />} />
      <Route path="/tracking-links" component={() => <ProtectedRoute component={TrackingLinks} />} />
      <Route path="/connections" component={() => <ProtectedRoute component={Connections} />} />
      <Route path="/audit-log" component={() => <ProtectedRoute component={AuditLog} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
