import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertProductSubcategorySchema, ProductCategory, ProductSubcategory } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ProductSubcategoryFormProps {
  subcategoryId: number | null;
  defaultCategoryId: number | null;
  onSuccess?: () => void;
}

export function ProductSubcategoryForm({ subcategoryId, defaultCategoryId, onSuccess }: ProductSubcategoryFormProps) {
  const { toast } = useToast();
  const [formValues, setFormValues] = useState({
    name: "",
    description: "",
    categoryId: defaultCategoryId ? defaultCategoryId.toString() : "",
  });

  // Fetch categories for dropdown
  const { data: categories, isLoading: categoriesLoading } = useQuery<ProductCategory[]>({
    queryKey: ["/api/product-categories"],
  });

  // Fetch subcategory data if editing
  const { data: subcategory, isLoading: subcategoryLoading } = useQuery<ProductSubcategory>({
    queryKey: [`/api/product-subcategories/${subcategoryId}`],
    enabled: !!subcategoryId,
  });

  // Set form values when subcategory data is loaded
  useEffect(() => {
    if (subcategory) {
      setFormValues({
        name: subcategory.name,
        description: subcategory.description || "",
        categoryId: subcategory.categoryId.toString(),
      });
    } else if (defaultCategoryId) {
      setFormValues(prev => ({
        ...prev,
        categoryId: defaultCategoryId.toString()
      }));
    }
  }, [subcategory, defaultCategoryId]);

  // Mutation for creating/updating subcategory
  const mutation = useMutation({
    mutationFn: async (data: typeof formValues) => {
      const payload = {
        ...data,
        categoryId: Number(data.categoryId),
      };
      
      if (subcategoryId) {
        // Update existing subcategory
        await apiRequest("PATCH", `/api/product-subcategories/${subcategoryId}`, payload);
      } else {
        // Create new subcategory
        await apiRequest("POST", "/api/product-subcategories", payload);
      }
    },
    onSuccess: () => {
      // Invalidate queries to update data
      queryClient.invalidateQueries({ queryKey: ["/api/product-subcategories"] });
      if (formValues.categoryId) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/product-subcategories", { categoryId: Number(formValues.categoryId) }]
        });
      }
      if (subcategoryId) {
        queryClient.invalidateQueries({ queryKey: [`/api/product-subcategories/${subcategoryId}`] });
      }
      
      toast({
        title: subcategoryId ? "Subcategoria atualizada" : "Subcategoria criada",
        description: subcategoryId 
          ? "A subcategoria foi atualizada com sucesso." 
          : "A subcategoria foi criada com sucesso.",
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

  const handleSelectChange = (name: string, value: string) => {
    setFormValues({
      ...formValues,
      [name]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate form data
      insertProductSubcategorySchema.parse({
        ...formValues,
        categoryId: Number(formValues.categoryId),
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

  if ((subcategoryLoading && subcategoryId) || categoriesLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="categoryId">Categoria *</Label>
        <Select 
          required
          value={formValues.categoryId} 
          onValueChange={(value) => handleSelectChange("categoryId", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
            {categories?.map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="name">Nome da Subcategoria *</Label>
        <Input
          id="name"
          name="name"
          value={formValues.name}
          onChange={handleChange}
          placeholder="Ex: Ácidos Minerais"
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
          placeholder="Ex: Subcategoria de ácidos de origem mineral não orgânica"
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
          ) : subcategoryId ? "Atualizar Subcategoria" : "Criar Subcategoria"}
        </Button>
      </div>
    </form>
  );
}