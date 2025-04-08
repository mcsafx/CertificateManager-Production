import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertProductCategorySchema, ProductCategory } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ProductCategoryFormProps {
  categoryId: number | null;
  onSuccess?: () => void;
}

export function ProductCategoryForm({ categoryId, onSuccess }: ProductCategoryFormProps) {
  const { toast } = useToast();
  const [formValues, setFormValues] = useState({
    name: "",
    description: "",
  });

  // Fetch category data if editing
  const { data: category, isLoading } = useQuery<ProductCategory>({
    queryKey: [`/api/product-categories/${categoryId}`],
    enabled: !!categoryId,
  });

  // Set form values when category data is loaded
  useEffect(() => {
    if (category) {
      setFormValues({
        name: category.name,
        description: category.description || "",
      });
    }
  }, [category]);

  // Mutation for creating/updating category
  const mutation = useMutation({
    mutationFn: async (data: typeof formValues) => {
      if (categoryId) {
        // Update existing category
        await apiRequest("PATCH", `/api/product-categories/${categoryId}`, data);
      } else {
        // Create new category
        await apiRequest("POST", "/api/product-categories", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-categories"] });
      if (categoryId) {
        queryClient.invalidateQueries({ queryKey: [`/api/product-categories/${categoryId}`] });
      }
      toast({
        title: categoryId ? "Categoria atualizada" : "Categoria criada",
        description: categoryId 
          ? "A categoria foi atualizada com sucesso." 
          : "A categoria foi criada com sucesso.",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormValues({
      ...formValues,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate form data
      insertProductCategorySchema.parse({
        ...formValues,
        tenantId: 1, // This will be assigned by the server based on the authenticated user
      });
      
      mutation.mutate(formValues);
    } catch (error: any) {
      toast({
        title: "Erro de validação",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading && categoryId) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome da Categoria *</Label>
        <Input
          id="name"
          name="name"
          value={formValues.name}
          onChange={handleChange}
          placeholder="Ex: Ácidos"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          name="description"
          value={formValues.description}
          onChange={handleChange}
          placeholder="Ex: Produtos ácidos para uso industrial"
          rows={3}
        />
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onSuccess}
        >
          Cancelar
        </Button>
        <Button 
          type="submit"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : categoryId ? "Atualizar Categoria" : "Criar Categoria"}
        </Button>
      </div>
    </form>
  );
}