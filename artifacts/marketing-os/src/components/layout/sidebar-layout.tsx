import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  Briefcase, 
  Palette, 
  Megaphone, 
  PenTool, 
  Link as LinkIcon, 
  Plug, 
  BarChart3, 
  Activity,
  LogOut,
  User,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Workspaces", url: "/workspaces", icon: Briefcase },
  { title: "Brand Profile", url: "/brand-profile", icon: Palette },
  { title: "Campaigns", url: "/campaigns", icon: Megaphone },
  { title: "Content Studio", url: "/content-studio", icon: PenTool },
  { title: "Tracking Links", url: "/tracking-links", icon: LinkIcon },
  { title: "Connections", url: "/connections", icon: Plug },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Audit Log", url: "/audit-log", icon: Activity },
];

export function AppSidebar() {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await logout();
    queryClient.clear();
    navigate("/login");
  };

  return (
    <Sidebar>
      <SidebarHeader className="h-16 flex items-center px-4 border-b">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight text-primary">
          <Megaphone className="h-6 w-6" />
          <span>Marketing OS</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url || (item.url !== "/" && location.startsWith(item.url))}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-3 space-y-2">
        {user && (
          <div className="flex items-center gap-2 px-2 py-1 rounded-md">
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate capitalize">{user.role ?? "member"}</p>
            </div>
          </div>
        )}
        <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-destructive" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 flex flex-col min-w-0 bg-muted/20">
        <div className="bg-destructive/10 text-destructive text-sm font-medium px-4 py-2 text-center border-b border-destructive/20 flex items-center justify-center gap-2">
          <Activity className="h-4 w-4" />
          MOCK MODE: This MVP does NOT spend real ad budget or publish ads automatically.
        </div>
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl space-y-6">
            {children}
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
}
