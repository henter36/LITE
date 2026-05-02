import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "wouter";
import { Loader2, Megaphone } from "lucide-react";

interface ProtectedRouteProps {
  component: React.ComponentType;
}

export function ProtectedRoute({ component: Component }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-muted/20">
        <div className="flex items-center gap-2 text-primary">
          <Megaphone className="h-8 w-8" />
          <span className="text-2xl font-bold tracking-tight">Marketing OS</span>
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}
