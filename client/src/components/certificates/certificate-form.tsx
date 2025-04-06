import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Supplier, Manufacturer, Product, ProductCharacteristic, EntryCertificate, EntryCertificateResult } from "@shared/schema";
import { toISODateString, formatNumber } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";

interface CertificateFormProps {
  certificateId?: number;
  onSuccess?: () => void;
}

export function CertificateForm({ certificateId, onSuccess }: CertificateFormProps) {
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(!!certificateId);
  const [formStep, setFormStep] = useState(1);
  
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
      
      const resultsPayload = results.map(result => ({
        ...result,
        minValue: result.minValue ? parseFloat(result.minValue) : null,
        maxValue: result.maxValue ? parseFloat(result.maxValue) : null,
        obtainedValue: parseFloat(result.obtainedValue),
      }));
      
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
    
    if (results.some(r => !r.characteristicName || !r.unit || !r.obtainedValue)) {
      toast({
        title: "Erro de validação",
        description: "Preencha todos os campos obrigatórios nas características.",
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
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="manufacturerId">Fabricante *</Label>
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
                    <SelectItem key={manufacturer.id} value={manufacturer.id.toString()}>
                      {manufacturer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.technicalName}
                    </SelectItem>
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
                  <SelectItem value="Tambor">Tambor</SelectItem>
                  <SelectItem value="IBC">IBC</SelectItem>
                  <SelectItem value="Saco">Saco</SelectItem>
                  <SelectItem value="Bombona">Bombona</SelectItem>
                  <SelectItem value="Granel">Granel</SelectItem>
                </SelectContent>
              </Select>
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
                            type="number"
                            step="0.0001"
                            value={result.minValue || ""}
                            onChange={(e) => handleResultChange(index, "minValue", e.target.value)}
                            placeholder="Ex: 98.0"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.0001"
                            value={result.maxValue || ""}
                            onChange={(e) => handleResultChange(index, "maxValue", e.target.value)}
                            placeholder="Ex: 99.9"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.0001"
                            value={result.obtainedValue}
                            onChange={(e) => handleResultChange(index, "obtainedValue", e.target.value)}
                            placeholder="Valor obtido"
                            required
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
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-8 w-8 mx-auto text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  Arraste e solte um arquivo PDF ou imagem, ou{" "}
                  <span className="text-primary">clique para escolher</span>
                </p>
                <Input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <div className="mt-2">
                  <Button type="button" variant="outline" size="sm">
                    Escolher Arquivo
                  </Button>
                </div>
                {formData.originalFileUrl && (
                  <p className="mt-2 text-xs text-gray-500">
                    Arquivo atual: {formData.originalFileUrl.split('/').pop()}
                  </p>
                )}
              </div>
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
    </div>
  );
}
