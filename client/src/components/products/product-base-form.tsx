import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  insertProductBaseSchema, 
  ProductSubcategory, 
  ProductBase,
  ProductBaseFile 
} from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Loader2, AlertTriangle, Eye, Download, Trash2 } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ProductBaseFileButtons } from "./product-base-file-buttons";

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
    // Novos campos para classificação de risco
    riskClass: "",
    riskNumber: "",
    unNumber: "",
    packagingGroup: "",
  });
  
  // Estado para uploads de arquivos
  const [fileUploads, setFileUploads] = useState({
    fispq: null as File | null,
    technicalSheet: null as File | null,
    certificate: null as File | null,
    other: null as File | null,
  });
  
  // Estado para descrições de arquivos
  const [fileDescriptions, setFileDescriptions] = useState({
    fispq: "",
    technicalSheet: "",
    certificate: "",
    other: "",
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
  
  // Fetch product base files if editing
  const { data: productBaseFiles, isLoading: filesLoading } = useQuery<ProductBaseFile[]>({
    queryKey: [`/api/product-base/${productBaseId}/files`],
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
        // Carregando os campos de classificação de risco
        riskClass: productBase.riskClass || "",
        riskNumber: productBase.riskNumber || "",
        unNumber: productBase.unNumber || "",
        packagingGroup: productBase.packagingGroup || "",
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

  // Função para lidar com o upload de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'fispq' | 'technicalSheet' | 'certificate' | 'other') => {
    if (e.target.files && e.target.files[0]) {
      setFileUploads({
        ...fileUploads,
        [fileType]: e.target.files[0]
      });
    }
  };
  
  // Função para lidar com a descrição do arquivo
  const handleFileDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'fispq' | 'technicalSheet' | 'certificate' | 'other') => {
    setFileDescriptions({
      ...fileDescriptions,
      [fileType]: e.target.value
    });
  };
  
  // Função para fazer upload do arquivo após criar/atualizar o produto base
  const uploadFile = async (file: File, description: string, baseProductId: number, fileCategory: string) => {
    try {
      // 1. Fazer upload físico do arquivo usando a API real
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileCategory', fileCategory);
      formData.append('description', description);
      formData.append('entityType', 'product_base');
      formData.append('entityId', baseProductId.toString());
      
      const uploadResponse = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include', // Para manter a sessão
      });
      
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.message || 'Erro no upload do arquivo');
      }
      
      const uploadedFile = await uploadResponse.json();
      
      // 2. Criar registro na tabela específica de product_base_files
      const fileData = {
        baseProductId,
        fileName: uploadedFile.fileName,
        fileUrl: uploadedFile.publicUrl,
        fileSize: Math.round(uploadedFile.fileSize / 1024), // Converter para KB
        fileType: uploadedFile.fileType,
        fileCategory,
        description,
      };
      
      await apiRequest("POST", "/api/product-base-files", fileData);
      
      return true;
    } catch (error) {
      console.error("Erro ao fazer upload do arquivo:", error);
      throw error; // Re-throw para o componente tratar o erro
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="info">Informações Gerais</TabsTrigger>
          <TabsTrigger value="files">Arquivos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="info" className="space-y-4 pt-4">
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
          
          {/* Seção de Classificação de Risco */}
          <div className="pt-4">
            <h3 className="text-lg font-medium mb-2">Classificação de Risco</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="riskClass">Classe/Subclasse de Risco</Label>
                <Input
                  id="riskClass"
                  name="riskClass"
                  value={formValues.riskClass}
                  onChange={handleChange}
                  placeholder="Ex: 8"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="riskNumber">Número de Risco</Label>
                <Input
                  id="riskNumber"
                  name="riskNumber"
                  value={formValues.riskNumber}
                  onChange={handleChange}
                  placeholder="Ex: 80"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unNumber">Número ONU</Label>
                <Input
                  id="unNumber"
                  name="unNumber"
                  value={formValues.unNumber}
                  onChange={handleChange}
                  placeholder="Ex: 1830"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="packagingGroup">Grupo de Embalagem</Label>
                <Input
                  id="packagingGroup"
                  name="packagingGroup"
                  value={formValues.packagingGroup}
                  onChange={handleChange}
                  placeholder="Ex: II"
                />
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="files" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload de FISPQ */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-medium mb-2">FISPQ / FDS / SDS</h3>
                
                {!productBaseId ? (
                  <div className="text-sm mb-4 flex items-center">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                    <span>Salve o produto base primeiro para habilitar o upload de arquivos.</span>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="fispq">Selecione o arquivo</Label>
                      <Input
                        id="fispq"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileChange(e, 'fispq')}
                      />
                    </div>
                    <div className="space-y-2 mt-2">
                      <Label htmlFor="fispqDescription">Descrição</Label>
                      <Input
                        id="fispqDescription"
                        placeholder="Ex: FISPQ Atualizada 2025"
                        value={fileDescriptions.fispq}
                        onChange={(e) => handleFileDescriptionChange(e, 'fispq')}
                      />
                    </div>
                    <Button 
                      className="mt-4" 
                      disabled={!fileUploads.fispq || !productBaseId}
                      onClick={async () => {
                        if (fileUploads.fispq && productBaseId) {
                          try {
                            await uploadFile(
                              fileUploads.fispq, 
                              fileDescriptions.fispq, 
                              productBaseId,
                              'fispq'
                            );
                            
                            toast({ 
                              title: "FISPQ enviada com sucesso!",
                              description: "O arquivo foi salvo e está disponível na lista de arquivos."
                            });
                            
                            // Limpar o formulário e atualizar a lista
                            queryClient.invalidateQueries({ 
                              queryKey: [`/api/product-base/${productBaseId}/files`] 
                            });
                            setFileUploads(prev => ({ ...prev, fispq: null }));
                            setFileDescriptions(prev => ({ ...prev, fispq: "" }));
                            
                            // Limpar o input de arquivo
                            const fileInput = document.querySelector('input[type="file"][accept=".pdf,.doc,.docx"]') as HTMLInputElement;
                            if (fileInput) fileInput.value = '';
                            
                          } catch (error: any) {
                            toast({ 
                              title: "Erro ao enviar FISPQ", 
                              description: error.message || "Ocorreu um erro ao fazer upload do arquivo.",
                              variant: "destructive" 
                            });
                          }
                        }
                      }}
                      type="button"
                    >
                      Fazer Upload
                    </Button>
                  </>
                )}
                
                {/* Lista de FISPQs existentes */}
                {productBaseId && productBaseFiles && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Arquivos Existentes</h4>
                    {productBaseFiles
                      .filter(file => file.fileCategory === 'fispq')
                      .map(file => (
                        <div key={file.id} className="flex justify-between items-center py-2 border-b">
                          <div>
                            <span className="font-medium">{file.fileName}</span>
                            <p className="text-sm text-muted-foreground">{file.description}</p>
                          </div>
                          <ProductBaseFileButtons file={file} />
                        </div>
                      ))}
                    {productBaseFiles.filter(file => file.fileCategory === 'fispq').length === 0 && (
                      <p className="text-sm text-muted-foreground">Nenhum arquivo FISPQ cadastrado.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Upload de Ficha Técnica */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-medium mb-2">Ficha Técnica</h3>
                
                {!productBaseId ? (
                  <div className="text-sm mb-4 flex items-center">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                    <span>Salve o produto base primeiro para habilitar o upload de arquivos.</span>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="technicalSheet">Selecione o arquivo</Label>
                      <Input
                        id="technicalSheet"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileChange(e, 'technicalSheet')}
                      />
                    </div>
                    <div className="space-y-2 mt-2">
                      <Label htmlFor="technicalSheetDescription">Descrição</Label>
                      <Input
                        id="technicalSheetDescription"
                        placeholder="Ex: Especificações Técnicas"
                        value={fileDescriptions.technicalSheet}
                        onChange={(e) => handleFileDescriptionChange(e, 'technicalSheet')}
                      />
                    </div>
                    <Button 
                      className="mt-4" 
                      disabled={!fileUploads.technicalSheet || !productBaseId}
                      onClick={async () => {
                        if (fileUploads.technicalSheet && productBaseId) {
                          try {
                            await uploadFile(
                              fileUploads.technicalSheet, 
                              fileDescriptions.technicalSheet, 
                              productBaseId,
                              'technical_sheet'
                            );
                            
                            toast({ 
                              title: "Ficha Técnica enviada com sucesso!",
                              description: "O arquivo foi salvo e está disponível na lista de arquivos."
                            });
                            
                            // Limpar o formulário e atualizar a lista
                            queryClient.invalidateQueries({ 
                              queryKey: [`/api/product-base/${productBaseId}/files`] 
                            });
                            setFileUploads(prev => ({ ...prev, technicalSheet: null }));
                            setFileDescriptions(prev => ({ ...prev, technicalSheet: "" }));
                            
                            // Limpar o input de arquivo
                            const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
                            fileInputs.forEach(input => {
                              if (input.accept === '.pdf,.doc,.docx' && input !== document.querySelector('input[type="file"][accept=".pdf,.doc,.docx"]')) {
                                input.value = '';
                              }
                            });
                            
                          } catch (error: any) {
                            toast({ 
                              title: "Erro ao enviar Ficha Técnica", 
                              description: error.message || "Ocorreu um erro ao fazer upload do arquivo.",
                              variant: "destructive" 
                            });
                          }
                        }
                      }}
                      type="button"
                    >
                      Fazer Upload
                    </Button>
                  </>
                )}
                
                {/* Lista de Fichas Técnicas existentes */}
                {productBaseId && productBaseFiles && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Arquivos Existentes</h4>
                    {productBaseFiles
                      .filter(file => file.fileCategory === 'technical_sheet')
                      .map(file => (
                        <div key={file.id} className="flex justify-between items-center py-2 border-b">
                          <div>
                            <span className="font-medium">{file.fileName}</span>
                            <p className="text-sm text-muted-foreground">{file.description}</p>
                          </div>
                          <ProductBaseFileButtons file={file} />
                        </div>
                      ))}
                    {productBaseFiles.filter(file => file.fileCategory === 'technical_sheet').length === 0 && (
                      <p className="text-sm text-muted-foreground">Nenhuma ficha técnica cadastrada.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
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