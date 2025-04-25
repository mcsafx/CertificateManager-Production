import React, { useEffect } from "react";
import { useFeatureAccess } from "@/hooks/use-feature-access";
import { AlertCircle, Loader2, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  
  /**
   * Se true, mostra informações de debug quando em desenvolvimento
   * @default false
   */
  debug?: boolean;
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
  fallback,
  debug = false
}: FeatureGateProps) {
  const { isAccessible, isLoading, error } = useFeatureAccess(featurePath);
  const { user } = useAuth();
  
  // Logs para debugar o controle de acesso
  useEffect(() => {
    if (debug) {
      console.log(`[FeatureGate] Verificando acesso para: ${featurePath}`);
      console.log(`[FeatureGate] Usuário: ${user?.username} (Tenant: ${user?.tenantId}, Role: ${user?.role})`);
      console.log(`[FeatureGate] Acesso: ${isAccessible ? 'Permitido' : 'Negado'}`);
    }
  }, [featurePath, isAccessible, user, debug]);

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
          {debug && (
            <div className="mt-2 text-xs border border-destructive/20 bg-destructive/10 p-2 rounded">
              <strong>Erro:</strong> {error.message}
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Se o usuário tem acesso, renderiza o conteúdo normal
  if (isAccessible) {
    return (
      <>
        {debug && (
          <div className="mb-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-flex items-center px-2 py-1 text-xs rounded bg-green-100 text-green-800 border border-green-200">
                    <Info className="h-3 w-3 mr-1" />
                    <span>Acesso permitido: {featurePath}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    Usuário: {user?.username}<br />
                    Tenant: {user?.tenantId}<br />
                    Função: {user?.role}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        {children}
      </>
    );
  }

  // Se o usuário não tem acesso e foi fornecido um fallback customizado
  if (fallback) {
    return (
      <>
        {debug && (
          <div className="mb-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-flex items-center px-2 py-1 text-xs rounded bg-red-100 text-red-800 border border-red-200">
                    <Info className="h-3 w-3 mr-1" />
                    <span>Acesso negado: {featurePath}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    Usuário: {user?.username}<br />
                    Tenant: {user?.tenantId}<br />
                    Função: {user?.role}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        {fallback}
      </>
    );
  }

  // Renderiza a mensagem de fallback padrão
  return (
    <>
      {debug && (
        <div className="mb-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="inline-flex items-center px-2 py-1 text-xs rounded bg-red-100 text-red-800 border border-red-200">
                  <Info className="h-3 w-3 mr-1" />
                  <span>Acesso negado: {featurePath}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  Usuário: {user?.username}<br />
                  Tenant: {user?.tenantId}<br />
                  Função: {user?.role}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
      <Alert variant="default" className="bg-muted/40">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{fallbackTitle}</AlertTitle>
        <AlertDescription>
          {fallbackMessage}
          {debug && (
            <div className="mt-2 text-xs border border-muted p-2 rounded bg-muted/20">
              <strong>Informação de Debug:</strong><br />
              Funcionalidade: {featurePath}<br />
              Usuário: {user?.username}<br />
              Tenant: {user?.tenantId}<br />
              Função: {user?.role}
            </div>
          )}
        </AlertDescription>
      </Alert>
    </>
  );
}