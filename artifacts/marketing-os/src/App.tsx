import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Workspaces from "@/pages/workspaces";
import Campaigns from "@/pages/campaigns";
import BrandProfile from "@/pages/brand-profile";
import NewCampaign from "@/pages/campaigns-new";
import CampaignDetail from "@/pages/campaign-detail";
import ContentStudio from "@/pages/content-studio";
import TrackingLinks from "@/pages/tracking-links";
import Connections from "@/pages/connections";
import Reports from "@/pages/reports";
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
      <Route path="/" component={Dashboard} />
      <Route path="/workspaces" component={Workspaces} />
      <Route path="/brand-profile" component={BrandProfile} />
      <Route path="/campaigns" component={Campaigns} />
      <Route path="/campaigns/new" component={NewCampaign} />
      <Route path="/campaigns/:id" component={CampaignDetail} />
      <Route path="/content-studio" component={ContentStudio} />
      <Route path="/tracking-links" component={TrackingLinks} />
      <Route path="/connections" component={Connections} />
      <Route path="/reports" component={Reports} />
      <Route path="/audit-log" component={AuditLog} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
