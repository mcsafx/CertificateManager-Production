import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

interface FeatureAccessResult {
  /**
   * Indica se o usuário tem acesso à funcionalidade
   */
  isAccessible: boolean;
  
  /**
   * Indica se a verificação de acesso está em carregamento
   */
  isLoading: boolean;
  
  /**
   * Erro que ocorreu durante a verificação de acesso, se houver
   */
  error: Error | null;
}

/**
 * Hook para verificar se o usuário atual tem acesso a uma determinada funcionalidade
 * 
 * @param featurePath Caminho da funcionalidade (ex: "certificates/issue")
 * @returns Objeto com o estado do acesso (isAccessible, isLoading, error)
 */
export function useFeatureAccess(featurePath: string): FeatureAccessResult {
  const { user } = useAuth();
  const [isAccessible, setIsAccessible] = useState<boolean>(false);

  // Busca as permissões do usuário
  const {
    data: userFeatures,
    isLoading: isLoadingFeatures,
    error,
  } = useQuery({
    queryKey: ["/api/user/features"],
    queryFn: async () => {
      // Se não há usuário autenticado, não busca permissões
      if (!user) return [];
      
      const response = await fetch("/api/user/features");
      if (!response.ok) {
        throw new Error("Falha ao carregar permissões do usuário");
      }
      
      return response.json();
    },
    enabled: !!user, // Só executa se houver um usuário logado
  });

  // Verifica se o usuário tem permissão para a funcionalidade específica
  const checkAccess = useCallback(() => {
    if (!userFeatures || isLoadingFeatures) {
      setIsAccessible(false);
      return;
    }

    // Usuários administradores do sistema têm acesso a tudo
    if (user?.role === "system_admin") {
      setIsAccessible(true);
      return;
    }

    // Para usuários administradores de tenant, verifica se a funcionalidade está em algum módulo
    // do plano associado ao tenant do usuário
    if (user?.role === "tenant_admin") {
      // Verifica se o tenant do usuário tem acesso à funcionalidade
      const hasAccessThroughPlan = userFeatures.some(
        (feature: any) => feature.featurePath === featurePath
      );
      
      setIsAccessible(hasAccessThroughPlan);
      return;
    }

    // Para usuários regulares, verifica se eles têm a permissão específica
    const hasDirectAccess = userFeatures.some(
      (feature: any) => feature.featurePath === featurePath
    );
    
    setIsAccessible(hasDirectAccess);
  }, [user, userFeatures, isLoadingFeatures, featurePath]);

  // Atualiza o estado de acesso sempre que as dependências mudarem
  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  return {
    isAccessible,
    isLoading: isLoadingFeatures,
    error: error as Error | null,
  };
}