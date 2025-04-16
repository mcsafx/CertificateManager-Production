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
// Importando apenas o tipo CertificateGenerationData
import { CertificateGenerationData } from "@/lib/html2pdfGenerator";
import html2pdf from 'html2pdf.js';

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

  // Função para gerar o HTML do certificado
  const generateCertificateHTML = (pdfData: CertificateGenerationData): string => {
    // Formatação das datas
    const formatDate = (dateString: string | null): string => {
      if (!dateString) return 'N/A';
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
      } catch (e) {
        return dateString || '';
      }
    };

    // Cálculo do período de validade
    const calcValidityPeriod = (mfgDate: string | null, expDate: string | null): string => {
      if (!mfgDate || !expDate) return 'N/A';
      
      try {
        const mfg = new Date(mfgDate);
        const exp = new Date(expDate);
        
        // Calcula diferença em meses
        const diffMonths = (exp.getFullYear() - mfg.getFullYear()) * 12 + 
                            (exp.getMonth() - mfg.getMonth());
        
        return `${diffMonths} MESES`;
      } catch (e) {
        return 'N/A';
      }
    };

    // Gera linhas para a tabela de resultados
    const generateResultRows = () => {
      return pdfData.results.map((result, index) => {
        const specificationValue = result.minValue && result.maxValue 
          ? `${result.minValue} - ${result.maxValue}`
          : result.minValue || result.maxValue || 'N/A';
        
        const isWithinRange = 
          (result.minValue === null || parseFloat(result.obtainedValue) >= parseFloat(result.minValue)) && 
          (result.maxValue === null || parseFloat(result.obtainedValue) <= parseFloat(result.maxValue));

        const bgColor = index % 2 === 0 ? 'transparent' : '#f9f9f9';
        const valueColor = isWithinRange ? '#388e3c' : '#d32f2f';

        return `
          <tr style="background-color: ${bgColor};">
            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${result.characteristicName}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center;">${result.unit || '-'}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center;">${specificationValue}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center; font-weight: bold; color: ${valueColor};">${result.obtainedValue}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center;">${result.analysisMethod || '-'}</td>
          </tr>
        `;
      }).join('');
    };

    // Criar o HTML do certificado com design moderno e corporativo
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Certificado de Qualidade - ${pdfData.product.technicalName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
          
          body {
            font-family: 'Roboto', sans-serif;
            margin: 0;
            padding: 0;
            color: #333;
            background-color: #fff;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .page {
            width: 210mm;
            min-height: 297mm;
            padding: 15mm;
            position: relative;
          }
          
          .watermark {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: -1;
            opacity: 0.035;
            pointer-events: none;
          }
          
          .watermark img {
            width: 60%;
            max-width: 400px;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #2196f3;
          }
          
          .logo-container {
            flex: 0 0 150px;
            margin-right: 20px;
          }
          
          .logo {
            max-width: 100%;
            max-height: 80px;
            object-fit: contain;
          }
          
          .title-container {
            flex: 1;
          }
          
          h1 {
            font-size: 24px;
            margin: 0 0 5px 0;
            background: linear-gradient(45deg, #2196f3, #0d47a1);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            font-weight: 700;
          }
          
          .certificate-number {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
          }
          
          .company-info {
            text-align: right;
            flex: 1;
            font-size: 12px;
          }
          
          .company-name {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 5px;
          }
          
          .section {
            margin-bottom: 25px;
            padding: 20px;
            background-color: #f9f9f9;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }
          
          .section-title {
            font-size: 16px;
            font-weight: 500;
            margin: 0 0 15px 0;
            padding-bottom: 8px;
            color: #0d47a1;
            border-bottom: 1px solid #e0e0e0;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
          }
          
          .info-item {
            margin-bottom: 10px;
          }
          
          .info-label {
            font-weight: 500;
            font-size: 12px;
            color: #666;
            margin-bottom: 2px;
          }
          
          .info-value {
            font-size: 14px;
          }
          
          .product-info {
            margin-bottom: 5px;
          }
          
          .product-name {
            font-size: 18px;
            font-weight: 500;
            color: #0d47a1;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            border-radius: 5px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }
          
          th {
            background-color: #0d47a1;
            color: white;
            padding: 12px;
            text-align: center;
            font-weight: 500;
          }
          
          td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
          }
          
          .table-container {
            margin-top: 10px;
            width: 100%;
            overflow-x: auto;
          }
          
          .approval-section {
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
          }
          
          .approval {
            font-weight: 500;
            font-size: 14px;
          }
          
          .approved {
            color: #388e3c;
            font-weight: bold;
          }
          
          .signature-area {
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #e0e0e0;
            text-align: center;
          }
          
          .signature-line {
            margin: 40px auto 5px auto;
            width: 200px;
            border-top: 1px solid #333;
          }
          
          .signature-name {
            font-size: 12px;
            font-weight: 500;
          }
          
          .signature-title {
            font-size: 11px;
            color: #666;
          }
          
          .footer {
            position: absolute;
            bottom: 15mm;
            left: 15mm;
            right: 15mm;
            text-align: center;
            font-size: 10px;
            color: #888;
            padding-top: 10px;
            border-top: 1px solid #e0e0e0;
          }
          
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            
            .page {
              width: 100%;
              min-height: auto;
              box-shadow: none;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="page">
          ${pdfData.tenant.logoUrl ? `
            <div class="watermark">
              <img src="${pdfData.tenant.logoUrl}" alt="Marca d'água">
            </div>
          ` : ''}
          
          <div class="header">
            <div class="logo-container">
              ${pdfData.tenant.logoUrl ? `<img src="${pdfData.tenant.logoUrl}" class="logo" alt="${pdfData.tenant.name} Logo">` : '<div style="width: 150px; height: 60px; background-color: #f0f0f0; display: flex; justify-content: center; align-items: center; color: #aaa;">Logo</div>'}
            </div>
            
            <div class="title-container">
              <h1>CERTIFICADO DE QUALIDADE</h1>
              <div class="certificate-number">Certificado Nº ${pdfData.certificate.customLot}-${pdfData.certificate.invoiceNumber}</div>
            </div>
            
            <div class="company-info">
              <div class="company-name">${pdfData.tenant.name}</div>
              ${pdfData.tenant.cnpj ? `<div>${pdfData.tenant.cnpj}</div>` : ''}
              ${pdfData.tenant.address ? `<div>${pdfData.tenant.address}</div>` : ''}
            </div>
          </div>

          <div class="section">
            <div class="section-title">Informações do Produto</div>
            <div class="product-info">
              <div class="product-name">${pdfData.product.technicalName}</div>
              ${pdfData.product.commercialName ? `<div>Nome Comercial: ${pdfData.product.commercialName}</div>` : ''}
            </div>
            
            <div class="info-grid" style="margin-top: 15px;">
              <div class="info-item">
                <div class="info-label">Nota Fiscal</div>
                <div class="info-value">${pdfData.certificate.invoiceNumber}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Data de Emissão</div>
                <div class="info-value">${formatDate(pdfData.certificate.issueDate)}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Lote Personalizado</div>
                <div class="info-value">${pdfData.certificate.customLot}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Quantidade</div>
                <div class="info-value">${pdfData.certificate.soldQuantity} ${pdfData.certificate.measureUnit}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Data de Fabricação</div>
                <div class="info-value">${formatDate(pdfData.entryCertificate.manufacturingDate)}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Validade</div>
                <div class="info-value">${formatDate(pdfData.entryCertificate.expirationDate)}</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Dados do Cliente</div>
            <div class="info-grid">
              <div class="info-item" style="grid-column: span 2;">
                <div class="info-label">Nome</div>
                <div class="info-value">${pdfData.client.name}</div>
              </div>
              ${pdfData.client.cnpj ? `
                <div class="info-item">
                  <div class="info-label">CNPJ</div>
                  <div class="info-value">${pdfData.client.cnpj}</div>
                </div>
              ` : ''}
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Resultados de Análise</div>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>CARACTERÍSTICA</th>
                    <th>UNIDADE</th>
                    <th>ESPECIFICAÇÃO</th>
                    <th>RESULTADO</th>
                    <th>MÉTODO</th>
                  </tr>
                </thead>
                <tbody>
                  ${generateResultRows()}
                </tbody>
              </table>
            </div>
          </div>
          
          <div class="approval-section">
            <div class="approval">
              Status: <span class="approved">APROVADO</span>
            </div>
            <div class="validity">
              Validade: ${pdfData.entryCertificate.expirationDate ? 
                calcValidityPeriod(pdfData.entryCertificate.manufacturingDate, pdfData.entryCertificate.expirationDate) : 'N/A'}
            </div>
          </div>
          
          <div class="signature-area">
            <div class="signature-line"></div>
            <div class="signature-name">Controle de Qualidade</div>
            <div class="signature-title">${pdfData.tenant.name}</div>
          </div>
          
          <div class="footer">
            Este certificado foi gerado eletronicamente e é válido sem assinatura. 
            Para verificar a autenticidade deste documento, entre em contato com nosso departamento de qualidade.
          </div>
        </div>
      </body>
      </html>
    `;
  };

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

      toast({
        title: "Gerando PDF",
        description: "Aguarde enquanto preparamos o documento...",
      });

      // Gerar o HTML do certificado
      const html = generateCertificateHTML(pdfData);
      
      // Configurações do PDF
      const options = {
        margin: [5, 5],
        filename: `certificado-${pdfData.certificate.invoiceNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      // Método direto do html2pdf para fazer download
      html2pdf().from(html).set(options).save();
      
      toast({
        title: "Certificado gerado",
        description: "O download do certificado foi iniciado automaticamente.",
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
              Gerar Certificado PDF
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