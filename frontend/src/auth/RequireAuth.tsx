import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

export function RequireAuth() {
  const { ready, user } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-text-dim">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
