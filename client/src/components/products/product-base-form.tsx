import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertProductBaseSchema, ProductSubcategory, ProductBase } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ProductBaseFormProps {
  productBaseId: number | null;
  defaultSubcategoryId: number | null;
  onSuccess?: () => void;
}

export function ProductBaseForm({ productBaseId, defaultSubcategoryId, onSuccess }: ProductBaseFormProps) {
  const { toast } = useToast();
  const [formValues, setFormValues] = useState({
    technicalName: "",
    commercialName: "",
    description: "",
    internalCode: "",
    defaultMeasureUnit: "",
    subcategoryId: defaultSubcategoryId ? defaultSubcategoryId.toString() : "",
  });

  // Fetch subcategories for dropdown
  const { data: subcategories, isLoading: subcategoriesLoading } = useQuery<ProductSubcategory[]>({
    queryKey: ["/api/product-subcategories"],
  });

  // Fetch product base data if editing
  const { data: productBase, isLoading: productBaseLoading } = useQuery<ProductBase>({
    queryKey: [`/api/product-base/${productBaseId}`],
    enabled: !!productBaseId,
  });

  // Set form values when product base data is loaded
  useEffect(() => {
    if (productBase) {
      setFormValues({
        technicalName: productBase.technicalName,
        commercialName: productBase.commercialName || "",
        description: productBase.description || "",
        internalCode: productBase.internalCode || "",
        defaultMeasureUnit: productBase.defaultMeasureUnit,
        subcategoryId: productBase.subcategoryId.toString(),
      });
    } else if (defaultSubcategoryId) {
      setFormValues(prev => ({
        ...prev,
        subcategoryId: defaultSubcategoryId.toString()
      }));
    }
  }, [productBase, defaultSubcategoryId]);

  // Mutation for creating/updating product base
  const mutation = useMutation({
    mutationFn: async (data: typeof formValues) => {
      const payload = {
        ...data,
        subcategoryId: Number(data.subcategoryId),
      };
      
      if (productBaseId) {
        // Update existing product base
        await apiRequest("PATCH", `/api/product-base/${productBaseId}`, payload);
      } else {
        // Create new product base
        await apiRequest("POST", "/api/product-base", payload);
      }
    },
    onSuccess: () => {
      // Invalidate queries to update data
      queryClient.invalidateQueries({ queryKey: ["/api/product-base"] });
      if (formValues.subcategoryId) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/product-base", { subcategoryId: Number(formValues.subcategoryId) }]
        });
      }
      if (productBaseId) {
        queryClient.invalidateQueries({ queryKey: [`/api/product-base/${productBaseId}`] });
      }
      
      toast({
        title: productBaseId ? "Produto Base atualizado" : "Produto Base criado",
        description: productBaseId 
          ? "O produto base foi atualizado com sucesso." 
          : "O produto base foi criado com sucesso.",
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
      insertProductBaseSchema.parse({
        ...formValues,
        subcategoryId: Number(formValues.subcategoryId),
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

  if ((productBaseLoading && productBaseId) || subcategoriesLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="subcategoryId">Subcategoria *</Label>
        <Select 
          required
          value={formValues.subcategoryId} 
          onValueChange={(value) => handleSelectChange("subcategoryId", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma subcategoria" />
          </SelectTrigger>
          <SelectContent>
            {subcategories?.map((subcategory) => (
              <SelectItem key={subcategory.id} value={subcategory.id.toString()}>
                {subcategory.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="technicalName">Nome Técnico *</Label>
          <Input
            id="technicalName"
            name="technicalName"
            value={formValues.technicalName}
            onChange={handleChange}
            placeholder="Ex: Ácido Sulfúrico"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="commercialName">Nome Comercial</Label>
          <Input
            id="commercialName"
            name="commercialName"
            value={formValues.commercialName}
            onChange={handleChange}
            placeholder="Ex: SupraAcid S-98"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="internalCode">Código Interno (ERP)</Label>
          <Input
            id="internalCode"
            name="internalCode"
            value={formValues.internalCode}
            onChange={handleChange}
            placeholder="Ex: AC-0023"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="defaultMeasureUnit">Unidade de Medida Padrão *</Label>
          <Input
            id="defaultMeasureUnit"
            name="defaultMeasureUnit"
            value={formValues.defaultMeasureUnit}
            onChange={handleChange}
            placeholder="Ex: kg"
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          name="description"
          value={formValues.description}
          onChange={handleChange}
          placeholder="Ex: Ácido sulfúrico para uso industrial, alta pureza"
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
          ) : productBaseId ? "Atualizar Produto Base" : "Criar Produto Base"}
        </Button>
      </div>
    </form>
  );
}