import { useParams, Link } from "wouter";
import React from "react";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  ArrowLeft, 
  Download, 
  FileText, 
  Calendar, 
  CircleDollarSign, 
  Package, 
  Store,
  Truck,
  BarChart,
  Beaker
} from "lucide-react";
import { IssuedCertificate, EntryCertificate, Client, EntryCertificateResult, Tenant, Product } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import { generateCertificatePdf, CertificateGenerationData } from "@/lib/html2pdfGenerator";

type IssuedCertificateWithRelations = IssuedCertificate & { 
  clientName?: string;
  productName?: string;
  client?: Client;
  entryCertificate?: EntryCertificate & {
    supplierName?: string;
    manufacturerName?: string;
    productName?: string;
    results?: EntryCertificateResult[];
  };
};

export default function IssuedCertificateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const certificateId = parseInt(id);

  // Fetch issued certificate with all related data
  const {
    data: certificate,
    isLoading,
    error,
  } = useQuery<IssuedCertificateWithRelations>({
    queryKey: [`/api/issued-certificates/${certificateId}`],
  });
  
  // Handle query error
  React.useEffect(() => {
    if (error) {
      toast({
        title: "Erro ao carregar certificado",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Extract data for convenience
  const entryCertificate = certificate?.entryCertificate;
  const client = certificate?.client;
  
  // Fetch tenant data
  const { data: tenantData } = useQuery<Tenant>({
    queryKey: ['/api/tenants/1'], // Assuming tenant ID 1 for now, this should be dynamic in production
    enabled: !!certificate,
  });

  // Handle download of certificate
  const handleDownload = async () => {
    if (!certificate || !certificate.entryCertificate || !tenantData || !client) {
      toast({
        title: "Erro ao gerar certificado",
        description: "Dados insuficientes para geração do PDF.",
        variant: "destructive",
      });
      return;
    }

    try {
      const entryCert = certificate.entryCertificate;
      
      // Verificar se temos resultados
      if (!entryCert.results || entryCert.results.length === 0) {
        toast({
          title: "Erro ao gerar certificado",
          description: "Não há resultados de análise disponíveis para este certificado.",
          variant: "destructive",
        });
        return;
      }

      // Preparar dados para o PDF
      const pdfData: CertificateGenerationData = {
        tenant: {
          name: tenantData.name,
          cnpj: tenantData.cnpj,
          address: tenantData.address,
          logoUrl: tenantData.logoUrl
        },
        product: {
          technicalName: entryCert.productName || `Produto #${entryCert.productId}`,
          commercialName: null, // Não temos esta informação aqui, poderia vir de API
          internalCode: null,   // Não temos esta informação aqui, poderia vir de API
        },
        client: {
          name: client.name,
          cnpj: client.cnpj,
        },
        certificate: {
          invoiceNumber: certificate.invoiceNumber,
          issueDate: certificate.issueDate,
          soldQuantity: String(certificate.soldQuantity),
          customLot: certificate.customLot,
          measureUnit: certificate.measureUnit,
        },
        entryCertificate: {
          referenceDocument: entryCert.referenceDocument,
          entryDate: entryCert.entryDate,
          manufacturingDate: entryCert.manufacturingDate,
          expirationDate: entryCert.expirationDate,
        },
        results: entryCert.results.map(result => ({
          characteristicName: result.characteristicName,
          unit: result.unit,
          minValue: result.minValue ? String(result.minValue) : null,
          maxValue: result.maxValue ? String(result.maxValue) : null,
          obtainedValue: String(result.obtainedValue),
          analysisMethod: result.analysisMethod,
        })),
      };

      // Gerar o PDF e obter a URL
      toast({
        title: "Gerando PDF",
        description: "Aguarde enquanto preparamos o documento...",
      });

      const pdfUrl = await generateCertificatePdf(pdfData);
      
      // Abrir o PDF em uma nova aba ao invés de fazer download
      window.open(pdfUrl, '_blank');

      toast({
        title: "Certificado gerado",
        description: "O certificado foi aberto em uma nova aba.",
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro ao gerar certificado",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido.",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" asChild>
              <Link to="/issued-certificates">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
            <h1 className="text-2xl font-medium">Boletim Emitido</h1>
            {certificate && (
              <Badge className="ml-2 text-sm">
                Nº {certificate.invoiceNumber}
              </Badge>
            )}
          </div>
          {certificate && (
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : certificate ? (
          <div className="space-y-6">
            {/* Main Information Card */}
            <Card>
              <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Informações do Certificado
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Certificate Info */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900 flex items-center">
                      <CircleDollarSign className="h-4 w-4 mr-2 text-primary" />
                      Detalhes da Venda
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-sm font-medium text-gray-500">Nota Fiscal</div>
                        <div className="text-gray-900">{certificate.invoiceNumber}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500">Data de Emissão</div>
                        <div className="text-gray-900">{formatDate(certificate.issueDate)}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500">Quantidade Vendida</div>
                        <div className="text-gray-900">{certificate.soldQuantity} {certificate.measureUnit}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500">Lote Personalizado</div>
                        <div className="text-gray-900">{certificate.customLot}</div>
                      </div>
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900 flex items-center">
                      <Store className="h-4 w-4 mr-2 text-primary" />
                      Dados do Cliente
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-sm font-medium text-gray-500">Cliente</div>
                        <div className="text-gray-900">
                          {client?.name || certificate.clientName || `Cliente #${certificate.clientId}`}
                        </div>
                      </div>
                      {client?.cnpj && (
                        <div>
                          <div className="text-sm font-medium text-gray-500">CNPJ</div>
                          <div className="text-gray-900">{client.cnpj}</div>
                        </div>
                      )}
                      {client?.address && (
                        <div>
                          <div className="text-sm font-medium text-gray-500">Endereço</div>
                          <div className="text-gray-900">{client.address}</div>
                        </div>
                      )}
                      {client?.phone && (
                        <div>
                          <div className="text-sm font-medium text-gray-500">Telefone</div>
                          <div className="text-gray-900">{client.phone}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900 flex items-center">
                      <Package className="h-4 w-4 mr-2 text-primary" />
                      Dados do Produto
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-sm font-medium text-gray-500">Produto</div>
                        <div className="text-gray-900">{certificate.productName || 
                          entryCertificate?.productName || `Produto #${entryCertificate?.productId}`}</div>
                      </div>
                      {entryCertificate && (
                        <>
                          <div>
                            <div className="text-sm font-medium text-gray-500">Lote Interno</div>
                            <div className="text-gray-900">{entryCertificate.internalLot}</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-500">Validade</div>
                            <div className="text-gray-900">{formatDate(entryCertificate.expirationDate)}</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-500">Status</div>
                            <div>
                              {entryCertificate.status === 'Aprovado' ? (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Aprovado</Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Reprovado</Badge>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results and Entry Certificate Info */}
            {entryCertificate && (
              <>
                {/* Results Section */}
                {entryCertificate.results && entryCertificate.results.length > 0 && (
                  <Card>
                    <CardHeader className="bg-primary/5">
                      <CardTitle className="flex items-center">
                        <Beaker className="h-5 w-5 mr-2" />
                        Resultados de Análise
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Característica</TableHead>
                            <TableHead>Unidade</TableHead>
                            <TableHead>Método</TableHead>
                            <TableHead>Mín.</TableHead>
                            <TableHead>Máx.</TableHead>
                            <TableHead>Resultado</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {entryCertificate.results.map((result) => {
                            const isWithinRange = 
                              (result.minValue === null || parseFloat(String(result.obtainedValue)) >= parseFloat(String(result.minValue))) && 
                              (result.maxValue === null || parseFloat(String(result.obtainedValue)) <= parseFloat(String(result.maxValue)));
                            
                            return (
                              <TableRow key={result.id}>
                                <TableCell>{result.characteristicName}</TableCell>
                                <TableCell>{result.unit}</TableCell>
                                <TableCell>{result.analysisMethod || '-'}</TableCell>
                                <TableCell>{result.minValue || '-'}</TableCell>
                                <TableCell>{result.maxValue || '-'}</TableCell>
                                <TableCell className="font-medium">{result.obtainedValue}</TableCell>
                                <TableCell>
                                  {isWithinRange ? (
                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                      Conforme
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                                      Não Conforme
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {/* Traceability Section */}
                <Card>
                  <CardHeader className="bg-primary/5">
                    <CardTitle className="flex items-center">
                      <BarChart className="h-5 w-5 mr-2" />
                      Rastreabilidade
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Supplier Info */}
                      <div className="space-y-4">
                        <h3 className="font-medium text-gray-900 flex items-center">
                          <Truck className="h-4 w-4 mr-2 text-primary" />
                          Dados do Fornecedor
                        </h3>
                        <div className="space-y-2">
                          <div>
                            <div className="text-sm font-medium text-gray-500">Fornecedor</div>
                            <div className="text-gray-900">
                              {entryCertificate.supplierName || `Fornecedor #${entryCertificate.supplierId}`}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-500">Fabricante</div>
                            <div className="text-gray-900">
                              {entryCertificate.manufacturerName || `Fabricante #${entryCertificate.manufacturerId}`}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-500">Lote do Fornecedor</div>
                            <div className="text-gray-900">{entryCertificate.supplierLot}</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-500">Documento de Referência</div>
                            <div className="text-gray-900">{entryCertificate.referenceDocument}</div>
                          </div>
                        </div>
                      </div>

                      {/* Certificate Origin Info */}
                      <div className="space-y-4">
                        <h3 className="font-medium text-gray-900 flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-primary" />
                          Datas e Quantidades
                        </h3>
                        <div className="space-y-2">
                          <div>
                            <div className="text-sm font-medium text-gray-500">Data de Fabricação</div>
                            <div className="text-gray-900">{formatDate(entryCertificate.manufacturingDate)}</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-500">Data de Entrada</div>
                            <div className="text-gray-900">{formatDate(entryCertificate.entryDate)}</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-500">Data de Inspeção</div>
                            <div className="text-gray-900">{formatDate(entryCertificate.inspectionDate)}</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-500">Quantidade Recebida</div>
                            <div className="text-gray-900">
                              {entryCertificate.receivedQuantity} {entryCertificate.measureUnit} ({entryCertificate.packageType})
                            </div>
                          </div>
                          {entryCertificate.conversionFactor && (
                            <div>
                              <div className="text-sm font-medium text-gray-500">Fator de Conversão</div>
                              <div className="text-gray-900">{entryCertificate.conversionFactor}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Boletim não encontrado</h3>
            <p className="text-gray-500 mb-6">
              O boletim solicitado não existe ou não está disponível.
            </p>
            <Button asChild>
              <Link to="/issued-certificates">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para lista
              </Link>
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}