import React from "react";
import { Route } from "wouter";
import { ProtectedRoute } from "@/lib/protected-route";
import { FeatureGate } from "@/components/ui/feature-gate";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface FeatureProtectedRouteProps {
  /**
   * O caminho da rota
   */
  path: string;
  
  /**
   * O componente a ser renderizado se o usuário tiver acesso
   */
  component: () => React.JSX.Element;
  
  /**
   * O caminho da funcionalidade a ser verificada
   */
  featurePath: string;
  
  /**
   * Título da mensagem de erro de acesso negado
   * @default "Acesso Restrito"
   */
  accessDeniedTitle?: string;
  
  /**
   * Mensagem de erro de acesso negado
   * @default "Você não tem acesso a esta funcionalidade."
   */
  accessDeniedMessage?: string;
  
  /**
   * Caminho para redirecionar quando o acesso é negado
   * Se não fornecido, mostra uma mensagem de acesso negado
   */
  redirectPath?: string;
}

/**
 * Componente que combina ProtectedRoute (autenticação) com FeatureGate (autorização)
 * Primeiramente verifica se o usuário está autenticado, e em seguida
 * verifica se tem acesso à funcionalidade específica
 */
export function FeatureProtectedRoute({
  path,
  component: Component,
  featurePath,
  accessDeniedTitle = "Acesso Restrito",
  accessDeniedMessage = "Você não tem acesso a esta funcionalidade.",
  redirectPath,
}: FeatureProtectedRouteProps) {
  // Componente a ser renderizado após verificar autenticação
  const FeatureProtectedComponent = () => {
    const fallback = redirectPath ? (
      <div className="p-8 flex flex-col items-center justify-center">
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-bold mb-2">{accessDeniedTitle}</h2>
          <p className="text-muted-foreground">{accessDeniedMessage}</p>
        </div>
        <Link href={redirectPath}>
          <Button className="mt-4">Voltar</Button>
        </Link>
      </div>
    ) : undefined;

    return (
      <FeatureGate
        featurePath={featurePath}
        fallbackTitle={accessDeniedTitle}
        fallbackMessage={accessDeniedMessage}
        fallback={fallback}
      >
        <Component />
      </FeatureGate>
    );
  };

  // Primeiro verificamos a autenticação com ProtectedRoute
  return (
    <ProtectedRoute 
      path={path} 
      component={FeatureProtectedComponent} 
    />
  );
}