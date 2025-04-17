import { useAuth } from "@/hooks/use-auth";
import { useFeatureAccess } from "@/hooks/use-feature-access";
import { cn } from "@/lib/utils";
import { PropsWithChildren } from "react";

interface FeatureGateProps extends PropsWithChildren {
  /**
   * O caminho da funcionalidade a ser verificada
   */
  featurePath: string;
  
  /**
   * Componente a ser exibido enquanto carrega
   */
  fallback?: React.ReactNode;
  
  /**
   * Se verdadeiro, o componente é renderizado mesmo se a funcionalidade não estiver disponível 
   * mas com classe "opacity-50 pointer-events-none" aplicada
   */
  renderDisabled?: boolean;
  
  /**
   * Classes adicionais a serem aplicadas quando o componente está desabilitado (só aplicável com renderDisabled=true)
   */
  disabledClassName?: string;
}

/**
 * Componente que renderiza seus filhos apenas se o usuário atual tiver acesso à funcionalidade especificada
 */
export function FeatureGate({
  featurePath,
  children,
  fallback,
  renderDisabled = false,
  disabledClassName = "opacity-50 pointer-events-none cursor-not-allowed",
}: FeatureGateProps) {
  const { user } = useAuth();
  const { isAccessible, isLoading } = useFeatureAccess(featurePath);
  
  // Se o usuário for admin, sempre tem acesso
  const isAdmin = user?.role === "admin";
  const hasAccess = isAdmin || isAccessible;

  // Durante carregamento, mostrar fallback ou nada
  if (isLoading) {
    return fallback ? <>{fallback}</> : null;
  }

  // Se não tiver acesso
  if (!hasAccess) {
    // Se for para renderizar desabilitado
    if (renderDisabled) {
      return <div className={cn(disabledClassName)}>{children}</div>;
    }
    // Caso contrário, não renderiza nada
    return null;
  }

  // Se tiver acesso, renderiza normalmente
  return <>{children}</>;
}