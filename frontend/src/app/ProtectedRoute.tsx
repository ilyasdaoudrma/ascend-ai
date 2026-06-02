import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuthStore } from "@/stores/authStore";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status, user } = useAuthStore();
  const location = useLocation();

  if (status === "idle" || status === "loading") {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Force onboarding before the dashboard.
  if (user && !user.profile?.onboarding_completed && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
