import { useQuery } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";

export function useFeatureAccess(featurePath: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/features/check-access", featurePath],
    queryFn: async () => {
      const response = await fetch(`/api/features/check-access?featurePath=${encodeURIComponent(featurePath)}`);
      if (!response.ok) {
        throw new Error('Erro ao verificar acesso à funcionalidade');
      }
      return await response.json();
    },
    enabled: !!featurePath, // Só executa se featurePath for fornecido
  });

  return {
    isAccessible: data?.isAccessible ?? false,
    isLoading,
    error
  };
}

// Método para forçar o recarregamento de todas as verificações de acesso
export function reloadFeatureAccess() {
  queryClient.invalidateQueries({ queryKey: ["/api/features/check-access"] });
}