import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Megaphone,
  PenTool,
  BarChart3,
  Settings,
  LogOut,
  User,
  FlaskConical,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

const navItems = [
  { title: "Dashboard",   url: "/",              icon: LayoutDashboard },
  { title: "Campaigns",   url: "/campaigns",     icon: Megaphone },
  { title: "Content",     url: "/content-studio",icon: PenTool },
  { title: "Performance", url: "/reports",       icon: BarChart3 },
  { title: "Settings",    url: "/settings",      icon: Settings },
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
      <SidebarHeader className="h-16 flex items-center px-5 border-b">
        <div className="flex items-center gap-2.5 font-bold text-lg tracking-tight text-primary">
          <Megaphone className="h-5 w-5" />
          <span>Marketing OS</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      location === item.url ||
                      (item.url !== "/" && location.startsWith(item.url))
                    }
                    className="h-10 text-base"
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
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
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate capitalize">{user.role ?? "member"}</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={handleLogout}
        >
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
        <div className="bg-muted/60 text-muted-foreground text-xs px-4 py-1.5 text-center border-b flex items-center justify-center gap-1.5">
          <FlaskConical className="h-3 w-3" />
          Demo mode · No real ads are running
        </div>
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl space-y-8">
            {children}
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
}
