import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { Plus, FileText } from "lucide-react";
import { EntryCertificate } from "@shared/schema";
import { CertificateTable } from "@/components/certificates/certificate-table";
import { CertificateFilter, CertificateFilters } from "@/components/certificates/certificate-filter";
import { CertificateForm } from "@/components/certificates/certificate-form";
import { useToast } from "@/hooks/use-toast";

export default function CertificatesPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editCertificateId, setEditCertificateId] = useState<number | null>(null);
  const [filters, setFilters] = useState<CertificateFilters>({});
  
  const {
    data: certificates,
    isLoading,
    refetch,
  } = useQuery<EntryCertificate[]>({
    queryKey: ["/api/entry-certificates", filters],
    queryFn: async ({ queryKey }) => {
      const [_, filterParams] = queryKey;
      
      // Construct URL with query parameters
      const url = new URL("/api/entry-certificates", window.location.origin);
      
      // Add filter parameters to URL
      Object.entries(filterParams as Record<string, string>).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, value);
      });
      
      const response = await fetch(url.toString(), {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch certificates");
      }
      
      return await response.json();
    },
  });
  
  const handleFilterChange = (newFilters: CertificateFilters) => {
    setFilters(newFilters);
  };
  
  const handleAddNew = () => {
    setEditCertificateId(null);
    setIsDialogOpen(true);
  };
  
  const handleEdit = (id: number) => {
    setEditCertificateId(id);
    setIsDialogOpen(true);
  };
  
  const handleView = (id: number) => {
    setEditCertificateId(id);
    setIsDialogOpen(true);
  };
  
  const handleDownload = (id: number) => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "O download de boletins será implementado em breve.",
    });
  };
  
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditCertificateId(null);
    refetch();
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-medium">Boletins de Entrada</h1>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Boletim
          </Button>
        </div>
        
        <CertificateFilter onFilterChange={handleFilterChange} />
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : certificates && certificates.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum boletim encontrado</h3>
            <p className="text-gray-500 mb-6">
              Comece a cadastrar os boletins de análise recebidos dos seus fornecedores.
            </p>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Boletim
            </Button>
          </div>
        ) : (
          <CertificateTable 
            certificates={certificates} 
            loading={isLoading}
            onView={handleView}
            onEdit={handleEdit}
            onDownload={handleDownload}
          />
        )}
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editCertificateId ? "Editar Boletim de Entrada" : "Novo Boletim de Entrada"}
            </DialogTitle>
          </DialogHeader>
          <CertificateForm 
            certificateId={editCertificateId || undefined} 
            onSuccess={handleDialogClose}
          />
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
