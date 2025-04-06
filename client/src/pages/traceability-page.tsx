import { useState } from "react";
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
  Users
} from "lucide-react";

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

export default function TraceabilityPage() {
  const { toast } = useToast();
  const [internalLot, setInternalLot] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [traceabilityResult, setTraceabilityResult] = useState<TraceabilityResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!internalLot.trim()) {
      toast({
        title: "Campo vazio",
        description: "Por favor, informe o lote interno para consultar.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const response = await apiRequest("GET", `/api/traceability/${internalLot.trim()}`, undefined);
      const data = await response.json();
      setTraceabilityResult(data);
    } catch (error: any) {
      toast({
        title: "Erro na consulta",
        description: error.message || "Não foi possível encontrar o lote informado.",
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
          <CardHeader>
            <CardTitle>Consultar Lote</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input 
                  placeholder="Digite o número do lote interno..." 
                  className="pl-10"
                  value={internalLot}
                  onChange={(e) => setInternalLot(e.target.value)}
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
                  Não foi possível encontrar informações para o lote "{internalLot}".
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
                Digite o número do lote interno no campo de busca acima para visualizar todos os detalhes
                e movimentações relacionadas a este lote.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
