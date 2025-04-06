import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertProductSchema, Product } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { ProductCharacteristicsForm } from "./product-characteristics-form";

interface ProductFormProps {
  productId: number | null;
  onSuccess?: () => void;
}

export function ProductForm({ productId, onSuccess }: ProductFormProps) {
  const { toast } = useToast();
  const [formValues, setFormValues] = useState({
    technicalName: "",
    commercialName: "",
    internalCode: "",
    defaultMeasureUnit: "",
  });

  // Fetch product data if editing
  const { data: product, isLoading } = useQuery<Product>({
    queryKey: [`/api/products/${productId}`],
    enabled: !!productId,
  });

  // Set form values when product data is loaded
  useEffect(() => {
    if (product) {
      setFormValues({
        technicalName: product.technicalName,
        commercialName: product.commercialName || "",
        internalCode: product.internalCode || "",
        defaultMeasureUnit: product.defaultMeasureUnit,
      });
    }
  }, [product]);

  // Mutation for creating/updating product
  const mutation = useMutation({
    mutationFn: async (data: typeof formValues) => {
      if (productId) {
        // Update existing product
        await apiRequest("PATCH", `/api/products/${productId}`, data);
      } else {
        // Create new product
        await apiRequest("POST", "/api/products", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      if (productId) {
        queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}`] });
      }
      toast({
        title: productId ? "Produto atualizado" : "Produto criado",
        description: productId 
          ? "O produto foi atualizado com sucesso." 
          : "O produto foi criado com sucesso.",
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({
      ...formValues,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate form data
      insertProductSchema.parse({
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

  if (isLoading && productId) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="general">
      <TabsList className="mb-4">
        <TabsTrigger value="general">Informações Gerais</TabsTrigger>
        {productId && (
          <TabsTrigger value="characteristics">Características</TabsTrigger>
        )}
      </TabsList>
      
      <TabsContent value="general">
        <form onSubmit={handleSubmit} className="space-y-4">
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
              ) : productId ? "Atualizar Produto" : "Criar Produto"}
            </Button>
          </div>
        </form>
      </TabsContent>
      
      {productId && (
        <TabsContent value="characteristics">
          <ProductCharacteristicsForm productId={productId} />
        </TabsContent>
      )}
    </Tabs>
  );
}
