import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertProductSchema, Product, ProductBase } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { ProductCharacteristicsForm } from "./product-characteristics-form";

interface ProductFormProps {
  productId: number | null;
  defaultBaseProductId?: number | null;
  onSuccess?: () => void;
}

export function ProductForm({ productId, defaultBaseProductId, onSuccess }: ProductFormProps) {
  const { toast } = useToast();
  const [formValues, setFormValues] = useState({
    baseProductId: defaultBaseProductId ? defaultBaseProductId.toString() : "",
    sku: "",
    technicalName: "",
    commercialName: "",
    internalCode: "",
    defaultMeasureUnit: "",
    conversionFactor: "",
    netWeight: "",
    grossWeight: "",
  });

  // Fetch product base options
  const { data: productBases, isLoading: productBasesLoading } = useQuery<ProductBase[]>({
    queryKey: ["/api/product-base"],
  });

  // Fetch product data if editing
  const { data: product, isLoading: productLoading } = useQuery<Product>({
    queryKey: [`/api/products/${productId}`],
    enabled: !!productId,
  });

  // Fetch product base data to pre-fill if needed
  const { data: productBase } = useQuery<ProductBase>({
    queryKey: [`/api/product-base/${formValues.baseProductId}`],
    enabled: !!formValues.baseProductId && !productId,
  });

  // Set form values when product data is loaded for editing
  useEffect(() => {
    if (product) {
      setFormValues({
        baseProductId: product.baseProductId.toString(),
        sku: product.sku || "",
        technicalName: product.technicalName,
        commercialName: product.commercialName || "",
        internalCode: product.internalCode || "",
        defaultMeasureUnit: product.defaultMeasureUnit,
        conversionFactor: product.conversionFactor?.toString() || "",
        netWeight: product.netWeight?.toString() || "",
        grossWeight: product.grossWeight?.toString() || "",
      });
    } else if (defaultBaseProductId) {
      setFormValues(prev => ({
        ...prev,
        baseProductId: defaultBaseProductId.toString()
      }));
    }
  }, [product, defaultBaseProductId]);

  // Pre-fill fields from product base when creating a new product
  useEffect(() => {
    if (productBase && !productId) {
      setFormValues(prev => ({
        ...prev,
        technicalName: productBase.technicalName,
        commercialName: productBase.commercialName || "",
        internalCode: productBase.internalCode || "",
        defaultMeasureUnit: productBase.defaultMeasureUnit,
      }));
    }
  }, [productBase, productId]);

  // Mutation for creating/updating product
  const mutation = useMutation({
    mutationFn: async (data: typeof formValues) => {
      const payload = {
        ...data,
        baseProductId: Number(data.baseProductId),
        conversionFactor: data.conversionFactor ? Number(data.conversionFactor) : null,
        netWeight: data.netWeight ? Number(data.netWeight) : null,
        grossWeight: data.grossWeight ? Number(data.grossWeight) : null,
      };
      
      if (productId) {
        // Update existing product
        await apiRequest("PATCH", `/api/products/${productId}`, payload);
      } else {
        // Create new product
        await apiRequest("POST", "/api/products", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      if (formValues.baseProductId) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/products", { baseProductId: Number(formValues.baseProductId) }]
        });
      }
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
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
      insertProductSchema.parse({
        ...formValues,
        baseProductId: Number(formValues.baseProductId),
        conversionFactor: formValues.conversionFactor ? Number(formValues.conversionFactor) : null,
        netWeight: formValues.netWeight ? Number(formValues.netWeight) : null,
        grossWeight: formValues.grossWeight ? Number(formValues.grossWeight) : null,
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

  if ((productLoading && productId) || productBasesLoading) {
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
          <div className="space-y-2">
            <Label htmlFor="baseProductId">Produto Base *</Label>
            <Select 
              required
              value={formValues.baseProductId} 
              onValueChange={(value) => handleSelectChange("baseProductId", value)}
              disabled={!!defaultBaseProductId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um produto base" />
              </SelectTrigger>
              <SelectContent>
                {productBases?.map((base) => (
                  <SelectItem key={base.id} value={base.id.toString()}>
                    {base.technicalName} {base.commercialName ? `(${base.commercialName})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                name="sku"
                value={formValues.sku}
                onChange={handleChange}
                placeholder="Ex: ACM-S98-001"
              />
            </div>
            
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
            
            <div className="space-y-2">
              <Label htmlFor="conversionFactor">Fator de Conversão</Label>
              <Input
                id="conversionFactor"
                name="conversionFactor"
                type="number"
                step="0.01"
                value={formValues.conversionFactor}
                onChange={handleChange}
                placeholder="Ex: 1.0"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="netWeight">Peso Líquido</Label>
              <Input
                id="netWeight"
                name="netWeight"
                type="number"
                step="0.01"
                value={formValues.netWeight}
                onChange={handleChange}
                placeholder="Ex: 25.0"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="grossWeight">Peso Bruto</Label>
              <Input
                id="grossWeight"
                name="grossWeight"
                type="number"
                step="0.01"
                value={formValues.grossWeight}
                onChange={handleChange}
                placeholder="Ex: 26.5"
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
