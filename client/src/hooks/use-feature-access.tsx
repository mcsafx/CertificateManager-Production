import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

interface UseFeatureAccessResult {
  isAccessible: boolean;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook para verificar se o usuário atual tem acesso a uma determinada funcionalidade
 * @param featurePath Caminho da funcionalidade a ser verificada
 */
export function useFeatureAccess(featurePath: string): UseFeatureAccessResult {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch de acesso à funcionalidade
  const {
    data: isAccessible = false,
    isLoading,
    error,
  } = useQuery<boolean, Error>({
    queryKey: ["/api/features/access", featurePath],
    queryFn: async () => {
      if (!user) return false;
      
      const response = await fetch(`/api/features/access?path=${encodeURIComponent(featurePath)}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Erro ao verificar acesso" }));
        throw new Error(errorData.message || "Erro ao verificar acesso à funcionalidade");
      }
      
      const data = await response.json();
      return data.hasAccess === true;
    },
    enabled: !!user, // Só executa se o usuário estiver autenticado
    retry: false,
  });
  
  return {
    isAccessible,
    isLoading,
    error: error || null,
  };
}