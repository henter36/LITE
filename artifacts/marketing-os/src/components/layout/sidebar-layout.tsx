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
  ShieldCheck,
  Activity,
  User,
  LogOut,
  FlaskConical,
  PanelRight,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

const navItems = [
  { title: "لوحة التحكم", url: "/", icon: LayoutDashboard },
  { title: "العلامة التجارية", url: "/brand-profile", icon: PanelRight },
  { title: "الحملات", url: "/campaigns", icon: Megaphone },
  { title: "المحتوى", url: "/content-studio", icon: PenTool },
  { title: "المراجعة", url: "/review", icon: ShieldCheck },
  { title: "سجل النشاط", url: "/activity", icon: Activity },
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
    <Sidebar side="right" collapsible="none" className="border-l border-r-0 bg-white shrink-0">
      <SidebarHeader className="h-20 flex items-center px-5 border-b bg-white">
        <div className="flex items-center gap-3 font-bold text-lg tracking-tight text-foreground">
          <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <div>Marketing OS Lite</div>
            <div className="text-xs font-normal text-muted-foreground">RTL shell</div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-3 bg-white">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 px-2">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      location === item.url ||
                      (item.url !== "/" && location.startsWith(item.url))
                    }
                    className="h-11 rounded-2xl text-sm font-medium text-muted-foreground data-[active=true]:bg-emerald-500/10 data-[active=true]:text-emerald-700 data-[active=true]:shadow-sm"
                  >
                    <Link href={item.url} className="justify-start gap-3">
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

      <SidebarFooter className="border-t bg-white p-4 space-y-3">
        {user && (
          <div className="flex items-center gap-3 rounded-2xl border bg-muted/20 px-3 py-3">
            <div className="h-9 w-9 rounded-full bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0">
              <User className="h-4 w-4" />
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
          className="w-full justify-start rounded-2xl text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 ml-2" />
          تسجيل الخروج
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" className="min-h-screen w-full bg-[#f6faf8]">
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1 min-w-0 overflow-x-hidden bg-[#f6faf8]">
          <div className="bg-white text-muted-foreground text-xs px-4 py-1.5 text-center border-b flex items-center justify-center gap-1.5 shadow-sm">
            <FlaskConical className="h-3 w-3" />
            وضع تجريبي · لا توجد إعلانات حقيقية
          </div>
          <div className="px-6 py-6">
            <div className="mx-auto w-full max-w-[1024px] space-y-8">
              {children}
            </div>
          </div>
        </main>
      </SidebarProvider>
    </div>
  );
}
