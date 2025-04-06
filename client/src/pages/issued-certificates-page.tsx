import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SafeSelectItem } from "@/components/ui/safe-select-item";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  FileOutput, 
  Plus, 
  Search, 
  Eye, 
  Download, 
  Calendar, 
  FileText 
} from "lucide-react";
import { IssuedCertificate, EntryCertificate, Client } from "@shared/schema";
import { IssueCertificateForm } from "@/components/certificates/issue-certificate-form";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function IssuedCertificatesPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCertificateId, setSelectedCertificateId] = useState<number | null>(null);
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    clientId: "",
    productId: "",
    startDate: "",
    endDate: "",
    invoiceNumber: "",
    customLot: "",
  });
  
  // Fetch issued certificates
  const {
    data: issuedCertificates,
    isLoading: isLoadingCertificates,
    refetch,
  } = useQuery<IssuedCertificate[]>({
    queryKey: ["/api/issued-certificates"],
  });
  
  // Fetch entry certificates for selection
  const { data: entryCertificates, isLoading: isLoadingEntries } = useQuery<EntryCertificate[]>({
    queryKey: ["/api/entry-certificates"],
  });
  
  // Fetch clients for filtering
  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });
  
  // Filter certificates based on filter criteria
  const filteredCertificates = issuedCertificates 
    ? issuedCertificates.filter(cert => {
        let matches = true;
        
        if (filters.clientId && cert.clientId.toString() !== filters.clientId) {
          matches = false;
        }
        
        if (filters.productId && cert.productName && 
            !cert.productName.toLowerCase().includes(filters.productId.toLowerCase())) {
          matches = false;
        }
        
        if (filters.invoiceNumber && 
            !cert.invoiceNumber.toLowerCase().includes(filters.invoiceNumber.toLowerCase())) {
          matches = false;
        }
        
        if (filters.customLot && 
            !cert.customLot.toLowerCase().includes(filters.customLot.toLowerCase())) {
          matches = false;
        }
        
        if (filters.startDate) {
          const certDate = new Date(cert.issueDate);
          const startDate = new Date(filters.startDate);
          if (certDate < startDate) {
            matches = false;
          }
        }
        
        if (filters.endDate) {
          const certDate = new Date(cert.issueDate);
          const endDate = new Date(filters.endDate);
          endDate.setHours(23, 59, 59);
          if (certDate > endDate) {
            matches = false;
          }
        }
        
        return matches;
      })
    : [];
  
  // Handle opening the issue dialog
  const handleIssueNew = () => {
    setSelectedCertificateId(null);
    setIsDialogOpen(true);
  };
  
  // Handle viewing a certificate
  const handleView = (id: number) => {
    setSelectedCertificateId(id);
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "A visualização de boletins emitidos será implementada em breve.",
    });
  };
  
  // Handle downloading a certificate
  const handleDownload = (id: number) => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "O download de boletins será implementado em breve.",
    });
  };
  
  // Handle selecting an entry certificate to issue from
  const handleSelectEntry = (id: number) => {
    setSelectedEntryId(id);
    setIsDialogOpen(true);
  };
  
  // Handle filter changes
  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  
  // Apply filters
  const applyFilters = () => {
    // Filters are already applied in the filtered certificates
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({
      clientId: "",
      productId: "",
      startDate: "",
      endDate: "",
      invoiceNumber: "",
      customLot: "",
    });
  };
  
  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-medium">Boletins Emitidos</h1>
          <Button onClick={handleIssueNew}>
            <Plus className="h-4 w-4 mr-2" />
            Emitir Boletim
          </Button>
        </div>
        
        {/* Filter Panel */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 block">Cliente</label>
                <Select
                  value={filters.clientId}
                  onValueChange={(value) => handleFilterChange('clientId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os clientes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SafeSelectItem value="">Todos os clientes</SafeSelectItem>
                    {clients?.map((client) => (
                      <SafeSelectItem key={client.id} value={client.id.toString()}>
                        {client.name}
                      </SafeSelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 block">Produto</label>
                <Input
                  placeholder="Nome do produto"
                  value={filters.productId}
                  onChange={(e) => handleFilterChange('productId', e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 block">Nota Fiscal</label>
                <Input
                  placeholder="Número da NF"
                  value={filters.invoiceNumber}
                  onChange={(e) => handleFilterChange('invoiceNumber', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 block">Lote Personalizado</label>
                <Input
                  placeholder="Lote para cliente"
                  value={filters.customLot}
                  onChange={(e) => handleFilterChange('customLot', e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 block">Data Inicial</label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 block">Data Final</label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                className="mr-2"
                onClick={clearFilters}
              >
                Limpar Filtros
              </Button>
              <Button onClick={applyFilters}>
                <Search className="h-4 w-4 mr-2" /> Aplicar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Certificates Table */}
        <Card>
          <CardContent className="p-0">
            {isLoadingCertificates ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredCertificates && filteredCertificates.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº Nota Fiscal</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Data Emissão</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCertificates.map((certificate) => (
                      <TableRow key={certificate.id}>
                        <TableCell>{certificate.invoiceNumber}</TableCell>
                        <TableCell>{certificate.clientName || `Cliente #${certificate.clientId}`}</TableCell>
                        <TableCell>{certificate.productName || '-'}</TableCell>
                        <TableCell>{certificate.customLot}</TableCell>
                        <TableCell>
                          {certificate.soldQuantity} {certificate.measureUnit}
                        </TableCell>
                        <TableCell>{formatDate(certificate.issueDate)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => handleView(certificate.id)}>
                              <Eye className="h-4 w-4 text-primary" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDownload(certificate.id)}>
                              <Download className="h-4 w-4 text-primary" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-lg">
                <FileOutput className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum boletim emitido encontrado</h3>
                <p className="text-gray-500 mb-6">
                  Emita boletins para seus clientes a partir dos boletins de entrada.
                </p>
                <Button onClick={handleIssueNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Emitir Boletim
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Select Entry Certificate Dialog */}
        {isDialogOpen && !selectedEntryId && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Selecionar Boletim de Entrada</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Selecione um boletim de entrada para emitir um novo boletim para cliente.
                </p>
                
                {isLoadingEntries ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : entryCertificates && entryCertificates.length > 0 ? (
                  <div className="overflow-y-auto max-h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>Lote Interno</TableHead>
                          <TableHead>Data Entrada</TableHead>
                          <TableHead>Validade</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {entryCertificates.map((cert) => (
                          <TableRow key={cert.id}>
                            <TableCell>{cert.productName || `Produto #${cert.productId}`}</TableCell>
                            <TableCell>{cert.internalLot}</TableCell>
                            <TableCell>{formatDate(cert.entryDate)}</TableCell>
                            <TableCell>{formatDate(cert.expirationDate)}</TableCell>
                            <TableCell>
                              {cert.status === 'Aprovado' ? (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Aprovado</Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Reprovado</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="default" 
                                size="sm"
                                disabled={cert.status !== 'Aprovado'}
                                onClick={() => handleSelectEntry(cert.id)}
                              >
                                Selecionar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Nenhum boletim de entrada disponível.</p>
                  </div>
                )}
                
                <div className="flex justify-end mt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
        
        {/* Issue Certificate Dialog */}
        {isDialogOpen && selectedEntryId && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Emitir Boletim para Cliente</DialogTitle>
              </DialogHeader>
              <IssueCertificateForm 
                entryCertificateId={selectedEntryId} 
                onSuccess={() => {
                  setIsDialogOpen(false);
                  setSelectedEntryId(null);
                  refetch();
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Layout>
  );
}
