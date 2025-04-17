import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ModuleFeature, Module, InsertModuleFeature } from "@shared/schema";

// Hook para gerenciar operações relacionadas a módulos e funcionalidades
export function useModuleFeatures() {
  const { toast } = useToast();

  // Busca a lista de módulos
  const {
    data: modules = [],
    isLoading: isLoadingModules,
    error: modulesError,
  } = useQuery<Module[]>({
    queryKey: ["/api/modules"],
    queryFn: async () => {
      const response = await fetch("/api/modules");
      if (!response.ok) {
        throw new Error("Erro ao carregar módulos");
      }
      return response.json();
    },
  });

  // Busca a lista de funcionalidades
  const {
    data: features = [],
    isLoading: isLoadingFeatures,
    error: featuresError,
  } = useQuery<ModuleFeature[]>({
    queryKey: ["/api/module-features"],
    queryFn: async () => {
      const response = await fetch("/api/module-features");
      if (!response.ok) {
        throw new Error("Erro ao carregar funcionalidades");
      }
      return response.json();
    },
  });

  // Mutation para criar uma nova funcionalidade
  const createFeatureMutation = useMutation({
    mutationFn: async (data: InsertModuleFeature) => {
      const response = await fetch("/api/module-features", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao criar funcionalidade");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Funcionalidade criada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/module-features"] });
      return true;
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      return false;
    },
  });

  // Mutation para atualizar uma funcionalidade
  const updateFeatureMutation = useMutation({
    mutationFn: async (data: ModuleFeature) => {
      const response = await fetch(`/api/module-features/${data.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao atualizar funcionalidade");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Funcionalidade atualizada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/module-features"] });
      return true;
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      return false;
    },
  });

  // Mutation para excluir uma funcionalidade
  const deleteFeatureMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/module-features/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao excluir funcionalidade");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Funcionalidade excluída com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/module-features"] });
      return true;
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      return false;
    },
  });

  return {
    // Dados
    modules,
    features,
    
    // Estados de carregamento
    isLoadingModules,
    isLoadingFeatures,
    
    // Erros
    modulesError,
    featuresError,
    
    // Mutations
    createFeature: createFeatureMutation.mutate,
    updateFeature: updateFeatureMutation.mutate,
    deleteFeature: deleteFeatureMutation.mutate,
    
    // Estados das mutations
    isCreating: createFeatureMutation.isPending,
    isUpdating: updateFeatureMutation.isPending,
    isDeleting: deleteFeatureMutation.isPending,
  };
}