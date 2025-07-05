import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  AlertCircle, 
  User, 
  Package, 
  FileText, 
  ArrowRight, 
  Search, 
  Plus,
  Loader2,
  Eye,
  Edit,
  Save,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NFeImportData {
  invoice: {
    numero: string;
    serie: string;
    dataEmissao: string;
    tipoOperacao: string;
    naturezaOperacao: string;
    chaveAcesso: string;
    observacoes?: string;
  };
  emitente: {
    cnpj?: string;
    razaoSocial: string;
    endereco: any;
  };
  destinatario: {
    cnpj?: string;
    cpf?: string;
    razaoSocial: string;
    endereco: any;
  };
  itens: Array<{
    codigo: string;
    descricao: string;
    quantidade: number;
    unidade: string;
    valorUnitario: number;
    valorTotal: number;
    ncm?: string;
    cfop?: string;
    observacao?: string;
  }>;
  clientResolution?: {
    action: 'found' | 'create' | 'conflict';
    client?: any;
    conflicts?: any[];
    suggestedData?: any;
  };
  productMatches?: Array<{
    nfeItem: any;
    matches: any[];
    hasExactMatch: boolean;
    bestMatch?: any;
    suggestions: any;
  }>;
}

interface NFeImportReviewProps {
  importData: NFeImportData;
  onConfirm?: (processedData: any) => void;
  onCancel?: () => void;
}

export function NFeImportReview({ importData, onConfirm, onCancel }: NFeImportReviewProps) {
  const { toast } = useToast();
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [newClientData, setNewClientData] = useState<any>(null);
  const [productMappings, setProductMappings] = useState<{ [key: string]: number }>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'review' | 'client' | 'products' | 'confirm'>('review');

  // Fetch available clients for manual selection
  const { data: availableClients } = useQuery({
    queryKey: ['/api/clients'],
    enabled: importData.clientResolution?.action === 'conflict'
  });

  // Fetch available products for manual mapping
  const { data: availableProducts } = useQuery({
    queryKey: ['/api/products'],
  });

  // Fetch entry certificates for product selection
  const { data: entryCertificates } = useQuery({
    queryKey: ['/api/entry-certificates'],
  });

  useEffect(() => {
    // Pre-select found client
    if (importData.clientResolution?.action === 'found' && importData.clientResolution.client) {
      setSelectedClientId(importData.clientResolution.client.id);
    }

    // Pre-select exact product matches
    if (importData.productMatches) {
      const mappings: { [key: string]: number } = {};
      importData.productMatches.forEach((match, index) => {
        if (match.hasExactMatch && match.bestMatch) {
          mappings[index.toString()] = match.bestMatch.id;
        }
      });
      setProductMappings(mappings);
    }
  }, [importData]);

  const handleClientSelection = (clientId: number) => {
    setSelectedClientId(clientId);
    setNewClientData(null);
  };

  const handleCreateNewClient = () => {
    if (importData.clientResolution?.suggestedData) {
      setNewClientData(importData.clientResolution.suggestedData);
      setSelectedClientId(null);
    }
  };

  const handleProductMapping = (itemIndex: number, productId: number) => {
    setProductMappings(prev => ({
      ...prev,
      [itemIndex.toString()]: productId
    }));
  };

  const handleConfirmImport = async () => {
    if (!selectedClientId && !newClientData) {
      toast({
        title: "Cliente não selecionado",
        description: "Por favor, selecione um cliente ou confirme a criação de um novo.",
        variant: "destructive",
      });
      return;
    }

    const unmappedItems = importData.itens.filter((_, index) => 
      !productMappings[index.toString()]
    );

    if (unmappedItems.length > 0) {
      toast({
        title: "Produtos não mapeados",
        description: `${unmappedItems.length} item(ns) ainda não foram mapeados para produtos do sistema.`,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const processedData = {
        nfeData: importData,
        clientId: selectedClientId,
        newClientData,
        productMappings,
      };

      if (onConfirm) {
        await onConfirm(processedData);
      }

      toast({
        title: "Importação confirmada",
        description: "NFe processada com sucesso. Certificados serão gerados.",
      });
    } catch (error) {
      toast({
        title: "Erro na importação",
        description: error instanceof Error ? error.message : "Erro ao processar importação da NFe",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatCNPJ = (cnpj: string) => {
    if (!cnpj) return '';
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  const getClientStatusBadge = () => {
    if (!importData.clientResolution) return null;
    
    switch (importData.clientResolution.action) {
      case 'found':
        return <Badge className="bg-green-100 text-green-800">Cliente Encontrado</Badge>;
      case 'create':
        return <Badge className="bg-blue-100 text-blue-800">Novo Cliente</Badge>;
      case 'conflict':
        return <Badge className="bg-yellow-100 text-yellow-800">Conflito Detectado</Badge>;
      default:
        return null;
    }
  };

  const getProductMatchBadge = (match: any) => {
    if (match.hasExactMatch) {
      return <Badge className="bg-green-100 text-green-800">Correspondência Exata</Badge>;
    } else if (match.bestMatch && match.bestMatch.similarity > 0.7) {
      return <Badge className="bg-blue-100 text-blue-800">Boa Correspondência</Badge>;
    } else if (match.matches.length > 0) {
      return <Badge className="bg-yellow-100 text-yellow-800">Requer Revisão</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">Não Encontrado</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Revisão da Importação NFe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">NFe</Label>
              <div className="font-medium">
                {importData.invoice.numero}/{importData.invoice.serie}
              </div>
              <div className="text-sm text-gray-600">
                {importData.invoice.dataEmissao}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Destinatário</Label>
              <div className="font-medium">{importData.destinatario.razaoSocial}</div>
              <div className="text-sm text-gray-600">
                {importData.destinatario.cnpj ? formatCNPJ(importData.destinatario.cnpj) : importData.destinatario.cpf}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Itens</Label>
              <div className="font-medium">{importData.itens.length} produtos</div>
              <div className="text-sm text-gray-600">
                {formatCurrency(importData.itens.reduce((sum, item) => sum + item.valorTotal, 0))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="client" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="client" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Cliente
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Resumo
          </TabsTrigger>
        </TabsList>

        {/* Client Resolution Tab */}
        <TabsContent value="client" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Resolução do Cliente
                {getClientStatusBadge()}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {importData.clientResolution?.action === 'found' && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Cliente encontrado no sistema: <strong>{importData.clientResolution.client.name}</strong>
                  </AlertDescription>
                </Alert>
              )}

              {importData.clientResolution?.action === 'create' && (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Cliente não encontrado. Será criado um novo cliente com os dados da NFe.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <Label>Razão Social</Label>
                      <div className="font-medium">{importData.clientResolution.suggestedData?.name}</div>
                    </div>
                    <div>
                      <Label>CNPJ/CPF</Label>
                      <div className="font-medium">
                        {importData.clientResolution.suggestedData?.cnpj ? 
                          formatCNPJ(importData.clientResolution.suggestedData.cnpj) : 
                          importData.clientResolution.suggestedData?.cpf}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <Label>Endereço</Label>
                      <div className="font-medium">{importData.clientResolution.suggestedData?.address}</div>
                    </div>
                  </div>
                </div>
              )}

              {importData.clientResolution?.action === 'conflict' && (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Encontrados clientes similares. Selecione um cliente existente ou crie um novo.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <Label>Clientes Similares Encontrados</Label>
                    {importData.clientResolution.conflicts?.map((conflict, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{conflict.name}</div>
                          <div className="text-sm text-gray-600">
                            {conflict.cnpj ? formatCNPJ(conflict.cnpj) : conflict.cpf}
                          </div>
                          <div className="text-xs text-gray-500">{conflict.reason}</div>
                        </div>
                        <Button
                          variant={selectedClientId === conflict.id ? "default" : "outline"}
                          onClick={() => handleClientSelection(conflict.id)}
                        >
                          {selectedClientId === conflict.id ? "Selecionado" : "Selecionar"}
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div>
                    <Button
                      variant={newClientData ? "default" : "outline"}
                      onClick={handleCreateNewClient}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Novo Cliente
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Mapping Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Mapeamento de Produtos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {importData.productMatches?.map((match, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="font-medium">{match.nfeItem.descricao}</div>
                        <div className="text-sm text-gray-600">
                          Código: {match.nfeItem.codigo} | 
                          Qtd: {match.nfeItem.quantidade} {match.nfeItem.unidade} | 
                          Valor: {formatCurrency(match.nfeItem.valorTotal)}
                        </div>
                      </div>
                      {getProductMatchBadge(match)}
                    </div>

                    {match.hasExactMatch && match.bestMatch && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="font-medium text-green-800">
                          Correspondência Automática
                        </div>
                        <div className="text-sm text-green-700">
                          {match.bestMatch.technicalName}
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          Razões: {match.bestMatch.matchReasons.join(", ")}
                        </div>
                      </div>
                    )}

                    {!match.hasExactMatch && (
                      <div className="space-y-3">
                        <Label>Selecionar Produto do Sistema</Label>
                        <Select
                          value={productMappings[index.toString()]?.toString() || ""}
                          onValueChange={(value) => handleProductMapping(index, parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um produto..." />
                          </SelectTrigger>
                          <SelectContent>
                            {match.matches.map((productMatch) => (
                              <SelectItem key={productMatch.id} value={productMatch.id.toString()}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{productMatch.technicalName}</span>
                                  <Badge variant="outline" className="ml-2">
                                    {Math.round(productMatch.similarity * 100)}%
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {match.matches.length > 0 && (
                          <div className="text-sm text-gray-600">
                            {match.matches.length} produto(s) encontrado(s) com similaridade
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Resumo da Importação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Import Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status do Cliente</Label>
                  <div className="flex items-center gap-2">
                    {selectedClientId ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Cliente selecionado</span>
                      </>
                    ) : newClientData ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">Novo cliente será criado</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-sm">Cliente não definido</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status dos Produtos</Label>
                  <div className="flex items-center gap-2">
                    {Object.keys(productMappings).length === importData.itens.length ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Todos os produtos mapeados</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm">
                          {Object.keys(productMappings).length} de {importData.itens.length} produtos mapeados
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                {onCancel && (
                  <Button variant="outline" onClick={onCancel}>
                    Cancelar
                  </Button>
                )}
                
                <Button
                  onClick={handleConfirmImport}
                  disabled={isProcessing || (!selectedClientId && !newClientData) || Object.keys(productMappings).length !== importData.itens.length}
                  className="min-w-[150px]"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirmar Importação
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}