import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children, requireStaff, requireAdmin }: { children: ReactNode; requireStaff?: boolean; requireAdmin?: boolean }) {
  const { user, loading, isStaff, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth" });
    else if (requireAdmin && !isAdmin) navigate({ to: "/dashboard" });
    else if (requireStaff && !isStaff) navigate({ to: "/dashboard" });
  }, [user, loading, isStaff, isAdmin, requireAdmin, requireStaff, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  return <>{children}</>;
}