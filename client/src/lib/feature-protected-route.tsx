import { useAuth } from "@/hooks/use-auth";
import { useFeatureAccess } from "@/hooks/use-feature-access";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { ProtectedRoute } from "./protected-route";

interface FeatureProtectedRouteProps {
  path: string;
  component: () => React.JSX.Element;
  featurePath: string;
  fallbackPath?: string;
}

export function FeatureProtectedRoute({
  path,
  component: Component,
  featurePath,
  fallbackPath = "/",
}: FeatureProtectedRouteProps) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { isAccessible, isLoading: isFeatureLoading } = useFeatureAccess(featurePath);
  
  // Se o usuário for admin, sempre permitir acesso
  const isAdmin = user?.role === "admin";
  
  const isLoading = isAuthLoading || isFeatureLoading;

  // Primeiro verificamos autenticação usando ProtectedRoute existente
  if (!user && !isAuthLoading) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Durante carregamento, mostrar loader
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  // Se o usuário for admin ou tiver acesso à funcionalidade, renderizar componente
  if (isAdmin || isAccessible) {
    return <Route path={path} component={Component} />;
  }

  // Caso contrário, redirecionar para fallbackPath
  return (
    <Route path={path}>
      <Redirect to={fallbackPath} />
    </Route>
  );
}