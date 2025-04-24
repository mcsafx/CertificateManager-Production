import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDate, formatNumber } from "@/lib/utils";
import { 
  Loader2, 
  Search, 
  ClipboardList, 
  ArrowDownUp, 
  Package, 
  Building2, 
  Factory,
  Layers,
  Calendar,
  Scale,
  FileText,
  Users,
  Filter,
  X,
  ChevronDown
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type TraceabilityResult = {
  entryCertificate: {
    id: number;
    internalLot: string;
    productId: number;
    productName: string;
    supplierId: number;
    supplierName: string;
    manufacturerId: number;
    manufacturerName: string;
    referenceDocument: string;
    entryDate: string;
    receivedQuantity: number;
    measureUnit: string;
    expirationDate: string;
  };
  issuedCertificates: Array<{
    id: number;
    clientId: number;
    clientName: string;
    invoiceNumber: string;
    issueDate: string;
    soldQuantity: number;
    measureUnit: string;
    customLot: string;
  }>;
  summary: {
    receivedQuantity: number;
    soldQuantity: number;
    remainingQuantity: number;
    measureUnit: string;
  };
};

// Interfaces para os dados de filtro
interface Product {
  id: number;
  name: string;
}

interface Supplier {
  id: number;
  name: string;
}

interface Manufacturer {
  id: number;
  name: string;
}

interface FilterOptions {
  internalLot?: string;
  supplierLot?: string;
  productId?: number;
  supplierId?: number;
  manufacturerId?: number;
  startDate?: string;
  endDate?: string;
}

export default function TraceabilityPage() {
  const { toast } = useToast();
  const [supplierLot, setSupplierLot] = useState(""); // Alterado para lote do fornecedor
  const [isLoading, setIsLoading] = useState(false);
  const [traceabilityResult, setTraceabilityResult] = useState<TraceabilityResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Estados para os dados dos filtros
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  
  // Estado para os filtros aplicados
  const [filters, setFilters] = useState<FilterOptions>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  
  // Carregar opções de filtro ao montar o componente
  useEffect(() => {
    const loadFilterOptions = async () => {
      setIsLoadingOptions(true);
      try {
        // Carregar produtos
        const productsResponse = await apiRequest("GET", "/api/products", undefined);
        const productsData = await productsResponse.json();
        setProducts(productsData);
        
        // Carregar fornecedores
        const suppliersResponse = await apiRequest("GET", "/api/suppliers", undefined);
        const suppliersData = await suppliersResponse.json();
        setSuppliers(suppliersData);
        
        // Carregar fabricantes
        const manufacturersResponse = await apiRequest("GET", "/api/manufacturers", undefined);
        const manufacturersData = await manufacturersResponse.json();
        setManufacturers(manufacturersData);
      } catch (error) {
        console.error("Erro ao carregar opções de filtro:", error);
      } finally {
        setIsLoadingOptions(false);
      }
    };
    
    loadFilterOptions();
  }, []);
  
  // Atualizar contagem de filtros ativos quando os filtros mudam
  useEffect(() => {
    const count = Object.values(filters).filter(value => 
      value !== undefined && value !== "" && value !== null
    ).length;
    setActiveFiltersCount(count);
  }, [filters]);
  
  // Função para atualizar um filtro específico
  const updateFilter = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === "" ? undefined : value
    }));
  };
  
  // Função para limpar todos os filtros
  const clearFilters = () => {
    setFilters({});
    setSupplierLot("");
  };

  // Função para construir a URL de busca com os filtros
  const buildSearchUrl = () => {
    // Se estamos usando apenas o filtro simples de lote do fornecedor
    if (!showAdvancedFilters && supplierLot.trim()) {
      return `/api/traceability/supplier/${supplierLot.trim()}`;
    }
    
    // Construir os parâmetros de consulta para filtros avançados
    const queryParams = new URLSearchParams();
    
    if (filters.internalLot) queryParams.append('internalLot', filters.internalLot);
    if (filters.supplierLot) queryParams.append('supplierLot', filters.supplierLot);
    if (filters.productId) queryParams.append('productId', filters.productId.toString());
    if (filters.supplierId) queryParams.append('supplierId', filters.supplierId.toString());
    if (filters.manufacturerId) queryParams.append('manufacturerId', filters.manufacturerId.toString());
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    
    return `/api/traceability/search?${queryParams.toString()}`;
  };
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar se pelo menos um filtro foi preenchido
    const hasSimpleFilter = !showAdvancedFilters && supplierLot.trim();
    const hasAdvancedFilter = showAdvancedFilters && Object.values(filters).some(val => 
      val !== undefined && val !== '' && val !== null
    );
    
    if (!hasSimpleFilter && !hasAdvancedFilter) {
      toast({
        title: "Filtros vazios",
        description: "Por favor, informe pelo menos um filtro para realizar a consulta.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const searchUrl = buildSearchUrl();
      const response = await apiRequest("GET", searchUrl, undefined);
      const data = await response.json();
      
      if (Array.isArray(data) && data.length === 0) {
        toast({
          title: "Nenhum resultado",
          description: "Não foram encontrados lotes com os filtros informados.",
          variant: "default",
        });
        setTraceabilityResult(null);
      } else if (Array.isArray(data) && data.length > 0) {
        // Se retornou uma lista, exibir apenas o primeiro resultado
        // ou implementar uma interface para selecionar qual exibir
        setTraceabilityResult(data[0]);
        
        if (data.length > 1) {
          toast({
            title: "Múltiplos resultados",
            description: `Foram encontrados ${data.length} lotes. Exibindo o primeiro resultado.`,
            variant: "default",
          });
        }
      } else {
        setTraceabilityResult(data);
      }
    } catch (error: any) {
      toast({
        title: "Erro na consulta",
        description: error.message || "Não foi possível encontrar lotes com os filtros informados.",
        variant: "destructive",
      });
      setTraceabilityResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-medium">Rastreabilidade de Lotes</h1>
        </div>
        
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Consultar Lote</CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant={showAdvancedFilters ? "default" : "outline"} 
                size="sm" 
                className="h-8"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <Filter className="h-4 w-4 mr-1" />
                {showAdvancedFilters ? "Ocultar Filtros" : "Filtros Avançados"}
                {activeFiltersCount > 0 && !showAdvancedFilters && (
                  <Badge variant="secondary" className="ml-1 px-1.5">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
              
              {activeFiltersCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-gray-500"
                  onClick={clearFilters}
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch}>
              {!showAdvancedFilters ? (
                // Filtro simples por lote do fornecedor
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input 
                      placeholder="Digite o número do lote do fornecedor..." 
                      className="pl-10"
                      value={supplierLot}
                      onChange={(e) => setSupplierLot(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Consultando...
                      </>
                    ) : (
                      <>
                        <ClipboardList className="mr-2 h-4 w-4" />
                        Consultar
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                // Filtros avançados
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Lote Interno */}
                    <div className="space-y-2">
                      <Label htmlFor="internalLot">Lote Interno</Label>
                      <Input
                        id="internalLot"
                        placeholder="Ex: WA2025"
                        value={filters.internalLot || ""}
                        onChange={(e) => updateFilter("internalLot", e.target.value)}
                      />
                    </div>
                    
                    {/* Lote do Fornecedor */}
                    <div className="space-y-2">
                      <Label htmlFor="supplierLot">Lote do Fornecedor</Label>
                      <Input
                        id="supplierLot"
                        placeholder="Ex: AG2025"
                        value={filters.supplierLot || ""}
                        onChange={(e) => updateFilter("supplierLot", e.target.value)}
                      />
                    </div>
                    
                    {/* Produto */}
                    <div className="space-y-2">
                      <Label htmlFor="productId">Produto</Label>
                      <Select
                        value={filters.productId?.toString() || ""}
                        onValueChange={(value) => updateFilter("productId", value ? Number(value) : undefined)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Fornecedor */}
                    <div className="space-y-2">
                      <Label htmlFor="supplierId">Fornecedor</Label>
                      <Select
                        value={filters.supplierId?.toString() || ""}
                        onValueChange={(value) => updateFilter("supplierId", value ? Number(value) : undefined)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um fornecedor" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id.toString()}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Fabricante */}
                    <div className="space-y-2">
                      <Label htmlFor="manufacturerId">Fabricante</Label>
                      <Select
                        value={filters.manufacturerId?.toString() || ""}
                        onValueChange={(value) => updateFilter("manufacturerId", value ? Number(value) : undefined)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um fabricante" />
                        </SelectTrigger>
                        <SelectContent>
                          {manufacturers.map((manufacturer) => (
                            <SelectItem key={manufacturer.id} value={manufacturer.id.toString()}>
                              {manufacturer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Data inicial */}
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Data Inicial</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={filters.startDate || ""}
                        onChange={(e) => updateFilter("startDate", e.target.value)}
                      />
                    </div>
                    
                    {/* Data final */}
                    <div className="space-y-2">
                      <Label htmlFor="endDate">Data Final</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={filters.endDate || ""}
                        onChange={(e) => updateFilter("endDate", e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearFilters}
                    >
                      Limpar Filtros
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Consultando...
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          Buscar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Lista de filtros ativos, visível apenas quando temos filtros e o painel avançado não está aberto */}
              {activeFiltersCount > 0 && !showAdvancedFilters && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {filters.internalLot && (
                    <Badge variant="secondary" className="pl-2 pr-1 py-1 flex items-center">
                      Lote Interno: {filters.internalLot}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => updateFilter("internalLot", undefined)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  {filters.supplierLot && (
                    <Badge variant="secondary" className="pl-2 pr-1 py-1 flex items-center">
                      Lote Fornecedor: {filters.supplierLot}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => updateFilter("supplierLot", undefined)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  {filters.productId && (
                    <Badge variant="secondary" className="pl-2 pr-1 py-1 flex items-center">
                      Produto: {products.find(p => p.id === filters.productId)?.name}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => updateFilter("productId", undefined)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  {filters.supplierId && (
                    <Badge variant="secondary" className="pl-2 pr-1 py-1 flex items-center">
                      Fornecedor: {suppliers.find(s => s.id === filters.supplierId)?.name}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => updateFilter("supplierId", undefined)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  {filters.manufacturerId && (
                    <Badge variant="secondary" className="pl-2 pr-1 py-1 flex items-center">
                      Fabricante: {manufacturers.find(m => m.id === filters.manufacturerId)?.name}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => updateFilter("manufacturerId", undefined)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  {filters.startDate && (
                    <Badge variant="secondary" className="pl-2 pr-1 py-1 flex items-center">
                      De: {filters.startDate}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => updateFilter("startDate", undefined)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  {filters.endDate && (
                    <Badge variant="secondary" className="pl-2 pr-1 py-1 flex items-center">
                      Até: {filters.endDate}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => updateFilter("endDate", undefined)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : hasSearched ? (
          traceabilityResult ? (
            <div className="space-y-6">
              {/* Entry Certificate Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2 text-primary" />
                    Dados do Lote {traceabilityResult.entryCertificate.internalLot}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 flex items-center">
                          <Package className="h-4 w-4 mr-1" /> Produto
                        </h3>
                        <p className="text-base font-medium">{traceabilityResult.entryCertificate.productName}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 flex items-center">
                          <Building2 className="h-4 w-4 mr-1" /> Fornecedor
                        </h3>
                        <p className="text-base">{traceabilityResult.entryCertificate.supplierName}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 flex items-center">
                          <Factory className="h-4 w-4 mr-1" /> Fabricante
                        </h3>
                        <p className="text-base">{traceabilityResult.entryCertificate.manufacturerName}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 flex items-center">
                          <Layers className="h-4 w-4 mr-1" /> Lote Interno
                        </h3>
                        <p className="text-base">{traceabilityResult.entryCertificate.internalLot}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 flex items-center">
                          <FileText className="h-4 w-4 mr-1" /> Documento Referência
                        </h3>
                        <p className="text-base">{traceabilityResult.entryCertificate.referenceDocument}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 flex items-center">
                          <Calendar className="h-4 w-4 mr-1" /> Data de Entrada
                        </h3>
                        <p className="text-base">{formatDate(traceabilityResult.entryCertificate.entryDate)}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 flex items-center">
                          <Scale className="h-4 w-4 mr-1" /> Quantidade Recebida
                        </h3>
                        <p className="text-base font-medium">
                          {formatNumber(traceabilityResult.entryCertificate.receivedQuantity)} {traceabilityResult.entryCertificate.measureUnit}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 flex items-center">
                          <Calendar className="h-4 w-4 mr-1" /> Validade
                        </h3>
                        <p className="text-base">{formatDate(traceabilityResult.entryCertificate.expirationDate)}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 flex items-center">
                          <Scale className="h-4 w-4 mr-1" /> Saldo Atual
                        </h3>
                        <p className="text-lg font-bold text-primary">
                          {formatNumber(traceabilityResult.summary.remainingQuantity)} {traceabilityResult.summary.measureUnit}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ArrowDownUp className="h-5 w-5 mr-2 text-primary" />
                    Resumo de Movimentação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-blue-700">Quantidade Recebida</h3>
                      <p className="text-2xl font-bold text-blue-700">
                        {formatNumber(traceabilityResult.summary.receivedQuantity)} {traceabilityResult.summary.measureUnit}
                      </p>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-green-700">Quantidade Vendida</h3>
                      <p className="text-2xl font-bold text-green-700">
                        {formatNumber(traceabilityResult.summary.soldQuantity)} {traceabilityResult.summary.measureUnit}
                      </p>
                    </div>
                    
                    <div className="bg-amber-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-amber-700">Saldo Disponível</h3>
                      <p className="text-2xl font-bold text-amber-700">
                        {formatNumber(traceabilityResult.summary.remainingQuantity)} {traceabilityResult.summary.measureUnit}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Issued Certificates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-primary" />
                    Boletins Emitidos para Clientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {traceabilityResult.issuedCertificates.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nº Nota Fiscal</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Data Emissão</TableHead>
                          <TableHead>Quantidade</TableHead>
                          <TableHead>Lote Customizado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {traceabilityResult.issuedCertificates.map((cert) => (
                          <TableRow key={cert.id}>
                            <TableCell>{cert.invoiceNumber}</TableCell>
                            <TableCell>{cert.clientName || `Cliente #${cert.clientId}`}</TableCell>
                            <TableCell>{formatDate(cert.issueDate)}</TableCell>
                            <TableCell>
                              {formatNumber(cert.soldQuantity)} {cert.measureUnit}
                            </TableCell>
                            <TableCell>{cert.customLot}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">Nenhum boletim emitido para este lote ainda.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                  <ClipboardList className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="text-lg font-medium mb-2">Lote não encontrado</h3>
                <p className="text-gray-500">
                  Não foi possível encontrar informações para o lote "{supplierLot}".
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Verifique se o número do lote está correto e tente novamente.
                </p>
              </CardContent>
            </Card>
          )
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <ClipboardList className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium mb-2">Consulta de Rastreabilidade</h3>
              <p className="text-gray-500 max-w-lg mx-auto">
                Digite o número do lote do fornecedor no campo de busca acima para visualizar todos os detalhes
                e movimentações relacionadas a este lote.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
