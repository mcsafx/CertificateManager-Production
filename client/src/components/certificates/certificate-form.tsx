import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SafeSelectItem } from "@/components/ui/safe-select-item";
import { Supplier, Manufacturer, Product, ProductCharacteristic, EntryCertificate, EntryCertificateResult } from "@shared/schema";
import { toISODateString, formatNumber } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Upload, Eye, FileEdit, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface CertificateFormProps {
  certificateId?: number;
  onSuccess?: () => void;
}

// Removido para definir dentro do componente

export function CertificateForm({ certificateId, onSuccess }: CertificateFormProps) {
  const { toast } = useToast();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(!!certificateId);
  const [formStep, setFormStep] = useState(1);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [isManufacturerDialogOpen, setIsManufacturerDialogOpen] = useState(false);
  
  // Supplier form schema
  const supplierSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    active: z.boolean().default(true),
  });
  
  // Manufacturer form schema
  const manufacturerSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    active: z.boolean().default(true),
  });
  
  // Supplier form
  const supplierForm = useForm<z.infer<typeof supplierSchema>>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      active: true,
    },
  });
  
  // Manufacturer form
  const manufacturerForm = useForm<z.infer<typeof manufacturerSchema>>({
    resolver: zodResolver(manufacturerSchema),
    defaultValues: {
      name: "",
      active: true,
    },
  });
  
  // Certificate data state
  const [formData, setFormData] = useState({
    supplierId: "",
    manufacturerId: "",
    referenceDocument: "",
    entryDate: toISODateString(new Date()),
    productId: "",
    receivedQuantity: "",
    measureUnit: "",
    packageType: "",
    conversionFactor: "",
    supplierLot: "",
    manufacturingDate: toISODateString(new Date()),
    inspectionDate: toISODateString(new Date()),
    expirationDate: "",
    internalLot: "",
    status: "Aprovado",
    originalFileUrl: "",
  });
  
  // Product characteristics and results
  const [results, setResults] = useState<Array<{
    id?: number;
    characteristicName: string;
    unit: string;
    minValue: string | null;
    maxValue: string | null;
    obtainedValue: string;
    analysisMethod: string;
  }>>([]);
  
  // Data fetching
  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });
  
  const { data: manufacturers } = useQuery<Manufacturer[]>({
    queryKey: ["/api/manufacturers"],
  });
  
  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });
  
  const { data: packageTypes } = useQuery<any[]>({
    queryKey: ["/api/package-types"],
  });
  
  // Fetch product characteristics when product changes
  const { data: characteristics } = useQuery<ProductCharacteristic[]>({
    queryKey: [`/api/products/${formData.productId}/characteristics`],
    enabled: !!formData.productId && !isEditing,
  });
  
  // Fetch certificate data if editing
  const { data: certificate, isLoading: isLoadingCertificate } = useQuery<EntryCertificate & { results: EntryCertificateResult[] }>({
    queryKey: [`/api/entry-certificates/${certificateId}`],
    enabled: !!certificateId,
  });
  
  // Load certificate data if editing
  useEffect(() => {
    if (certificate && isEditing) {
      setFormData({
        supplierId: certificate.supplierId.toString(),
        manufacturerId: certificate.manufacturerId.toString(),
        referenceDocument: certificate.referenceDocument,
        entryDate: toISODateString(certificate.entryDate),
        productId: certificate.productId.toString(),
        receivedQuantity: certificate.receivedQuantity.toString(),
        measureUnit: certificate.measureUnit,
        packageType: certificate.packageType,
        conversionFactor: certificate.conversionFactor ? certificate.conversionFactor.toString() : "",
        supplierLot: certificate.supplierLot,
        manufacturingDate: toISODateString(certificate.manufacturingDate),
        inspectionDate: toISODateString(certificate.inspectionDate),
        expirationDate: toISODateString(certificate.expirationDate),
        internalLot: certificate.internalLot,
        status: certificate.status,
        originalFileUrl: certificate.originalFileUrl || "",
      });
      
      if (certificate.results) {
        setResults(certificate.results.map(result => ({
          id: result.id,
          characteristicName: result.characteristicName,
          unit: result.unit,
          minValue: result.minValue !== null ? result.minValue.toString() : null,
          maxValue: result.maxValue !== null ? result.maxValue.toString() : null,
          obtainedValue: result.obtainedValue.toString(),
          analysisMethod: result.analysisMethod || "",
        })));
      }
    }
  }, [certificate, isEditing]);
  
  // Load product characteristics when product changes and not editing
  useEffect(() => {
    if (characteristics && !isEditing && formData.productId) {
      setResults(characteristics.map(characteristic => ({
        characteristicName: characteristic.name,
        unit: characteristic.unit,
        minValue: characteristic.minValue !== null ? characteristic.minValue.toString() : null,
        maxValue: characteristic.maxValue !== null ? characteristic.maxValue.toString() : null,
        obtainedValue: "",
        analysisMethod: characteristic.analysisMethod || "",
      })));
    }
  }, [characteristics, formData.productId, isEditing]);
  
  // Save or update certificate
  // Add supplier mutation
  const addSupplierMutation = useMutation({
    mutationFn: async (data: z.infer<typeof supplierSchema>) => {
      const payload = {
        ...data,
        tenantId: 1, // Default tenant
      };
      const response = await apiRequest("POST", "/api/suppliers", payload);
      return await response.json();
    },
    onSuccess: (newSupplier) => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setIsSupplierDialogOpen(false);
      supplierForm.reset();
      
      // Automatically select the new supplier
      if (newSupplier && newSupplier.id) {
        handleSelectChange("supplierId", newSupplier.id.toString());
      }
      
      toast({
        title: "Fornecedor adicionado",
        description: "O fornecedor foi adicionado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar fornecedor",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Add manufacturer mutation
  const addManufacturerMutation = useMutation({
    mutationFn: async (data: z.infer<typeof manufacturerSchema>) => {
      const payload = {
        ...data,
        tenantId: 1, // Default tenant
      };
      const response = await apiRequest("POST", "/api/manufacturers", payload);
      return await response.json();
    },
    onSuccess: (newManufacturer) => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturers"] });
      setIsManufacturerDialogOpen(false);
      manufacturerForm.reset();
      
      // Automatically select the new manufacturer
      if (newManufacturer && newManufacturer.id) {
        handleSelectChange("manufacturerId", newManufacturer.id.toString());
      }
      
      toast({
        title: "Fabricante adicionado",
        description: "O fabricante foi adicionado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar fabricante",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const saveMutation = useMutation({
    mutationFn: async () => {
      const certificatePayload = {
        ...formData,
        supplierId: parseInt(formData.supplierId),
        manufacturerId: parseInt(formData.manufacturerId),
        productId: parseInt(formData.productId),
        receivedQuantity: parseFloat(formData.receivedQuantity),
        conversionFactor: formData.conversionFactor ? parseFloat(formData.conversionFactor) : null,
      };
      
      const resultsPayload = results.map(result => {
        // Preservar valores textuais, convertendo para números apenas quando possível
        const minValue = result.minValue ? isNaN(parseFloat(result.minValue)) ? result.minValue : parseFloat(result.minValue) : null;
        const maxValue = result.maxValue ? isNaN(parseFloat(result.maxValue)) ? result.maxValue : parseFloat(result.maxValue) : null;
        const obtainedValue = isNaN(parseFloat(result.obtainedValue)) ? result.obtainedValue : parseFloat(result.obtainedValue);
        
        return {
          ...result,
          minValue,
          maxValue,
          obtainedValue,
        };
      });
      
      if (isEditing && certificateId) {
        // Update existing certificate
        await apiRequest("PATCH", `/api/entry-certificates/${certificateId}`, {
          certificate: certificatePayload,
          results: resultsPayload,
        });
      } else {
        // Create new certificate
        await apiRequest("POST", "/api/entry-certificates", {
          certificate: certificatePayload,
          results: resultsPayload,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/entry-certificates"] });
      if (certificateId) {
        queryClient.invalidateQueries({ queryKey: [`/api/entry-certificates/${certificateId}`] });
      }
      
      toast({
        title: isEditing ? "Boletim atualizado" : "Boletim criado",
        description: isEditing
          ? "O boletim foi atualizado com sucesso."
          : "O boletim foi criado com sucesso.",
      });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Form change handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleResultChange = (index: number, field: string, value: string) => {
    setResults(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };
  
  const handleAddCharacteristic = () => {
    setResults(prev => [
      ...prev,
      {
        characteristicName: "",
        unit: "",
        minValue: null,
        maxValue: null,
        obtainedValue: "0", // Definindo um valor padrão para evitar valores vazios
        analysisMethod: "",
      }
    ]);
  };
  
  const handleRemoveCharacteristic = (index: number) => {
    setResults(prev => prev.filter((_, i) => i !== index));
  };
  
  // Função auxiliar para determinar a classe CSS com base nos valores
  const getObtainedValueClass = (min: string | null, max: string | null, value: string): string => {
    // Se algum dos valores estiver vazio, retorna classe padrão
    if (!value || (!min && !max)) return "";
    
    // Tenta converter para números
    const minNum = min ? parseFloat(min) : null;
    const maxNum = max ? parseFloat(max) : null;
    const valueNum = parseFloat(value);
    
    // Se não forem números válidos, retorna classe padrão
    if ((min && isNaN(minNum!)) || (max && isNaN(maxNum!)) || isNaN(valueNum)) {
      return ""; // Valores não numéricos não recebem indicador visual
    }
    
    // Verifica se está dentro do intervalo e retorna a classe apropriada
    const withinMin = minNum === null || valueNum >= minNum;
    const withinMax = maxNum === null || valueNum <= maxNum;
    
    if (withinMin && withinMax) {
      return "border-green-500 focus:ring-green-500"; // Dentro do intervalo
    } else {
      return "border-red-500 focus:ring-red-500"; // Fora do intervalo
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.supplierId || !formData.manufacturerId || !formData.productId) {
      toast({
        title: "Erro de validação",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate results
    if (results.length === 0) {
      toast({
        title: "Erro de validação",
        description: "Adicione pelo menos uma característica ao boletim.",
        variant: "destructive",
      });
      return;
    }
    
    // Verifica se todos os campos obrigatórios estão preenchidos (nome, unidade e valor obtido)
    if (results.some(r => !r.characteristicName || !r.unit || !r.obtainedValue)) {
      toast({
        title: "Erro de validação",
        description: "Preencha todos os campos obrigatórios nas características.",
        variant: "destructive",
      });
      return;
    }
    
    // Verifica se há valores numéricos sem min/max definidos
    const invalidResults = results.filter(r => {
      // Se o valor obtido for um número
      const isNumericValue = !isNaN(parseFloat(r.obtainedValue));
      
      // Se for numérico, precisa ter min ou max definido
      // Se for texto, não precisa validar min/max
      return isNumericValue && !r.minValue && !r.maxValue;
    });
    
    if (invalidResults.length > 0) {
      toast({
        title: "Erro de validação",
        description: "Para características com valores numéricos, preencha pelo menos um dos campos: valor mínimo ou valor máximo.",
        variant: "destructive",
      });
      return;
    }
    
    saveMutation.mutate();
  };
  
  if (isLoadingCertificate && certificateId) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Step indicator */}
      <div className="space-y-6">
        <div className="flex justify-between">
          <Button
            variant={formStep === 1 ? "default" : "outline"}
            onClick={() => setFormStep(1)}
            className={formStep === 1 ? "" : "opacity-70"}
          >
            1. Informações Básicas
          </Button>
          <Button
            variant={formStep === 2 ? "default" : "outline"}
            onClick={() => setFormStep(2)}
            className={formStep === 2 ? "" : "opacity-70"}
          >
            2. Características e Resultados
          </Button>
          <Button
            variant={formStep === 3 ? "default" : "outline"}
            onClick={() => setFormStep(3)}
            className={formStep === 3 ? "" : "opacity-70"}
          >
            3. Documentação
          </Button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* Step 1: Basic Information */}
        {formStep === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="supplierId">Fornecedor *</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.supplierId}
                  onValueChange={(value) => handleSelectChange("supplierId", value)}
                  required
                >
                  <SelectTrigger id="supplierId">
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.map((supplier) => (
                      <SafeSelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SafeSelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={() => setIsSupplierDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="manufacturerId">Fabricante *</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.manufacturerId}
                  onValueChange={(value) => handleSelectChange("manufacturerId", value)}
                  required
                >
                  <SelectTrigger id="manufacturerId">
                    <SelectValue placeholder="Selecione um fabricante" />
                  </SelectTrigger>
                  <SelectContent>
                    {manufacturers?.map((manufacturer) => (
                      <SafeSelectItem key={manufacturer.id} value={manufacturer.id.toString()}>
                        {manufacturer.name}
                      </SafeSelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={() => setIsManufacturerDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="referenceDocument">Documento de Referência *</Label>
              <Input
                id="referenceDocument"
                name="referenceDocument"
                value={formData.referenceDocument}
                onChange={handleChange}
                placeholder="Nº NF ou Invoice"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="entryDate">Data de Entrada *</Label>
              <Input
                id="entryDate"
                name="entryDate"
                type="date"
                value={formData.entryDate}
                onChange={handleChange}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="productId">Produto *</Label>
              <Select
                value={formData.productId}
                onValueChange={(value) => handleSelectChange("productId", value)}
                required
              >
                <SelectTrigger id="productId">
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {products?.map((product) => (
                    <SafeSelectItem key={product.id} value={product.id.toString()}>
                      {product.technicalName}
                    </SafeSelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="receivedQuantity">Quantidade Recebida *</Label>
                <Input
                  id="receivedQuantity"
                  name="receivedQuantity"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.receivedQuantity}
                  onChange={handleChange}
                  placeholder="0,00"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="measureUnit">Unidade *</Label>
                <Input
                  id="measureUnit"
                  name="measureUnit"
                  value={formData.measureUnit}
                  onChange={handleChange}
                  placeholder="Ex: kg"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="packageType">Tipo de Embalagem *</Label>
              <Select
                value={formData.packageType}
                onValueChange={(value) => handleSelectChange("packageType", value)}
                required
              >
                <SelectTrigger id="packageType">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {packageTypes && packageTypes.length > 0 ? (
                    packageTypes.filter(pkg => pkg.active).map((pkg) => (
                      <SafeSelectItem key={pkg.id} value={pkg.name}>
                        {pkg.name}
                      </SafeSelectItem>
                    ))
                  ) : (
                    <>
                      <SafeSelectItem value="Tambor">Tambor</SafeSelectItem>
                      <SafeSelectItem value="IBC">IBC</SafeSelectItem>
                      <SafeSelectItem value="Saco">Saco</SafeSelectItem>
                      <SafeSelectItem value="Bombona">Bombona</SafeSelectItem>
                      <SafeSelectItem value="Granel">Granel</SafeSelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              <div className="mt-1 text-xs text-right">
                <a href="/package-types" target="_blank" className="text-blue-500 hover:underline">
                  Gerenciar tipos de embalagem
                </a>
              </div>
            </div>
            
            <div>
              <Label htmlFor="conversionFactor">Fator de Conversão</Label>
              <Input
                id="conversionFactor"
                name="conversionFactor"
                type="number"
                step="0.0001"
                value={formData.conversionFactor}
                onChange={handleChange}
                placeholder="Opcional"
              />
            </div>
            
            <div>
              <Label htmlFor="supplierLot">Lote do Fornecedor/Fabricante *</Label>
              <Input
                id="supplierLot"
                name="supplierLot"
                value={formData.supplierLot}
                onChange={handleChange}
                placeholder="Lote original"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="internalLot">Lote Interno *</Label>
              <Input
                id="internalLot"
                name="internalLot"
                value={formData.internalLot}
                onChange={handleChange}
                placeholder="Lote interno da sua empresa"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="manufacturingDate">Data de Fabricação *</Label>
              <Input
                id="manufacturingDate"
                name="manufacturingDate"
                type="date"
                value={formData.manufacturingDate}
                onChange={handleChange}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="inspectionDate">Data de Inspeção/Análise *</Label>
              <Input
                id="inspectionDate"
                name="inspectionDate"
                type="date"
                value={formData.inspectionDate}
                onChange={handleChange}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="expirationDate">Data de Validade *</Label>
              <Input
                id="expirationDate"
                name="expirationDate"
                type="date"
                value={formData.expirationDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        )}
        
        {/* Step 2: Characteristics and Results */}
        {formStep === 2 && (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <div className="mb-2 text-sm text-gray-500 italic">
                <p>Nota: Para valores numéricos, preencha pelo menos o valor mínimo ou máximo. Para valores textuais (ex: "LAT"), não é necessário preencher mínimo/máximo.</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Característica *</TableHead>
                    <TableHead>Unidade *</TableHead>
                    <TableHead>Mínimo</TableHead>
                    <TableHead>Máximo</TableHead>
                    <TableHead>Valor Obtido *</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead className="w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                        Nenhuma característica adicionada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    results.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Input
                            value={result.characteristicName}
                            onChange={(e) => handleResultChange(index, "characteristicName", e.target.value)}
                            placeholder="Ex: Pureza"
                            required
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={result.unit}
                            onChange={(e) => handleResultChange(index, "unit", e.target.value)}
                            placeholder="Ex: %"
                            required
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={result.minValue || ""}
                            onChange={(e) => handleResultChange(index, "minValue", e.target.value)}
                            placeholder="Ex: 98.0"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={result.maxValue || ""}
                            onChange={(e) => handleResultChange(index, "maxValue", e.target.value)}
                            placeholder="Ex: 99.9"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={result.obtainedValue || ""}
                            onChange={(e) => handleResultChange(index, "obtainedValue", e.target.value)}
                            placeholder="Valor obtido"
                            required
                            className={getObtainedValueClass(result.minValue, result.maxValue, result.obtainedValue)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={result.analysisMethod}
                            onChange={(e) => handleResultChange(index, "analysisMethod", e.target.value)}
                            placeholder="Ex: ASTM D-123"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveCharacteristic(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            <Button
              type="button"
              variant="outline"
              onClick={handleAddCharacteristic}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Nova Característica
            </Button>
          </div>
        )}
        
        {/* Step 3: Documentation */}
        {formStep === 3 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Status do Boletim *</Label>
              <RadioGroup
                value={formData.status}
                onValueChange={(value) => handleSelectChange("status", value)}
                className="flex space-x-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Aprovado" id="status-approved" />
                  <Label htmlFor="status-approved">Aprovado</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Reprovado" id="status-rejected" />
                  <Label htmlFor="status-rejected">Reprovado</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div>
              <Label>Anexar Boletim Original</Label>
              {formData.originalFileUrl ? (
                <div className="mt-2 border-2 border-gray-300 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <p className="text-sm font-medium">
                        {formData.originalFileUrl.split('/').pop()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => window.open(formData.originalFileUrl, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Visualizar
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <FileEdit className="h-4 w-4 mr-1" />
                        Substituir
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setFormData({ ...formData, originalFileUrl: '' })}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remover
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-8 w-8 mx-auto text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    Arraste e solte um arquivo PDF ou imagem, ou{" "}
                    <span className="text-primary">clique para escolher</span>
                  </p>
                  <div className="mt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Escolher Arquivo
                    </Button>
                  </div>
                </div>
              )}
              <Input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Aqui você lidaria com o upload do arquivo
                    setFormData({ ...formData, originalFileUrl: URL.createObjectURL(file) });
                  }
                }}
              />
            </div>
          </div>
        )}
        
        <div className="flex justify-between pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
          >
            Cancelar
          </Button>
          
          <div className="space-x-2">
            {formStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormStep(formStep - 1)}
              >
                Voltar
              </Button>
            )}
            
            {formStep < 3 ? (
              <Button
                type="button"
                onClick={() => setFormStep(formStep + 1)}
              >
                Continuar
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  isEditing ? "Atualizar Boletim" : "Salvar Boletim"
                )}
              </Button>
            )}
          </div>
        </div>
      </form>

      {/* Supplier Dialog */}
      <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Fornecedor</DialogTitle>
          </DialogHeader>
          <Form {...supplierForm}>
            <form onSubmit={supplierForm.handleSubmit((data) => addSupplierMutation.mutate(data))}>
              <div className="space-y-4">
                <FormField
                  control={supplierForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Fornecedor *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Digite o nome do fornecedor" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setIsSupplierDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    disabled={addSupplierMutation.isPending}
                  >
                    {addSupplierMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Adicionar Fornecedor"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Manufacturer Dialog */}
      <Dialog open={isManufacturerDialogOpen} onOpenChange={setIsManufacturerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Fabricante</DialogTitle>
          </DialogHeader>
          <Form {...manufacturerForm}>
            <form onSubmit={manufacturerForm.handleSubmit((data) => addManufacturerMutation.mutate(data))}>
              <div className="space-y-4">
                <FormField
                  control={manufacturerForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Fabricante *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Digite o nome do fabricante" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setIsManufacturerDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    disabled={addManufacturerMutation.isPending}
                  >
                    {addManufacturerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Adicionar Fabricante"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
