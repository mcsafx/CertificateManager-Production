import React from "react";
import { useFeatureAccess } from "@/hooks/use-feature-access";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface FeatureGateProps {
  /**
   * Caminho da funcionalidade a ser verificada
   * Exemplo: "certificates/issue" ou "products/create"
   */
  featurePath: string;
  
  /**
   * Conteúdo a ser renderizado se o usuário tiver acesso à funcionalidade
   */
  children: React.ReactNode;
  
  /**
   * Mensagem a ser exibida quando o usuário não tiver acesso
   * @default "Você não tem acesso a esta funcionalidade."
   */
  fallbackMessage?: string;
  
  /**
   * Título da mensagem de fallback
   * @default "Acesso Restrito"
   */
  fallbackTitle?: string;
  
  /**
   * Componente alternativo a ser renderizado quando o usuário não tem acesso
   * Se fornecido, substitui a mensagem de fallback padrão
   */
  fallback?: React.ReactNode;
}

/**
 * Componente que controla o acesso a funcionalidades específicas
 * baseado nas permissões do usuário atual
 */
export function FeatureGate({
  featurePath,
  children,
  fallbackMessage = "Você não tem acesso a esta funcionalidade.",
  fallbackTitle = "Acesso Restrito",
  fallback
}: FeatureGateProps) {
  const { isAccessible, isLoading, error } = useFeatureAccess(featurePath);

  // Exibe um loader enquanto verifica permissões
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">
          Verificando acesso...
        </span>
      </div>
    );
  }

  // Se ocorreu um erro, exibe uma mensagem
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro ao verificar acesso</AlertTitle>
        <AlertDescription>
          Não foi possível verificar seu acesso a esta funcionalidade. Tente novamente mais tarde.
        </AlertDescription>
      </Alert>
    );
  }

  // Se o usuário tem acesso, renderiza o conteúdo normal
  if (isAccessible) {
    return <>{children}</>;
  }

  // Se o usuário não tem acesso e foi fornecido um fallback customizado
  if (fallback) {
    return <>{fallback}</>;
  }

  // Renderiza a mensagem de fallback padrão
  return (
    <Alert variant="default" className="bg-muted/40">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{fallbackTitle}</AlertTitle>
      <AlertDescription>{fallbackMessage}</AlertDescription>
    </Alert>
  );
}