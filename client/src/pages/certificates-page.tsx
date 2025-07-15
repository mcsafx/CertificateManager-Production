import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, FileText } from "lucide-react";
import { EntryCertificate } from "@shared/schema";

type EnhancedEntryCertificate = EntryCertificate & {
  productName?: string;
  supplierName?: string;
  manufacturerName?: string;
  results?: any[];
};
import { CertificateTable } from "@/components/certificates/certificate-table";
import { CertificateFilter, CertificateFilters } from "@/components/certificates/certificate-filter";
import { CertificateForm } from "@/components/certificates/certificate-form";
import { BatchRevalidationModal } from "@/components/certificates/batch-revalidation-modal";
import { useToast } from "@/hooks/use-toast";

export default function CertificatesPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editCertificateId, setEditCertificateId] = useState<number | null>(null);
  const [filters, setFilters] = useState<CertificateFilters>({});
  const [isRevalidationModalOpen, setIsRevalidationModalOpen] = useState(false);
  const [selectedCertificateForRevalidation, setSelectedCertificateForRevalidation] = useState<EnhancedEntryCertificate | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  const {
    data: certificates,
    isLoading,
    refetch,
  } = useQuery<EnhancedEntryCertificate[]>({
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
    // Abrir o certificado em formato HTML em uma nova aba
    window.open(`/api/certificates/view/${id}`, "_blank");
  };
  
  const handleDownload = (id: number) => {
    // Fazer download do arquivo original do certificado
    window.open(`/api/certificates/download/${id}`, "_blank");
  };
  
  const handleDelete = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este certificado? Esta ação não pode ser desfeita.")) {
      deleteMutation.mutate(id);
    }
  };
  
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      console.log(`[DELETE] Attempting to delete certificate ${id}`);
      setDeletingId(id);
      
      const response = await fetch(`/api/entry-certificates/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      console.log(`[DELETE] Response status: ${response.status}`);
      
      if (!response.ok) {
        let errorMessage = "Erro ao excluir certificado";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // Se não conseguir parsear JSON, usa mensagem padrão
          errorMessage = `Erro ${response.status}: ${response.statusText}`;
        }
        console.error(`[DELETE] Error:`, errorMessage);
        throw new Error(errorMessage);
      }
      
      console.log(`[DELETE] Certificate ${id} deleted successfully`);
    },
    onSuccess: () => {
      setDeletingId(null);
      refetch();
      toast({
        title: "Certificado excluído",
        description: "O certificado foi excluído com sucesso.",
      });
    },
    onError: (error) => {
      setDeletingId(null);
      console.error(`[DELETE] Frontend error:`, error);
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditCertificateId(null);
    refetch();
  };

  const handleRevalidate = (certificate: EnhancedEntryCertificate) => {
    setSelectedCertificateForRevalidation(certificate);
    setIsRevalidationModalOpen(true);
  };

  const handleRevalidationSuccess = () => {
    refetch();
    toast({
      title: "Lote revalidado com sucesso",
      description: "O novo lote foi criado e está disponível na lista.",
    });
  };

  const handleRevalidationModalClose = () => {
    setIsRevalidationModalOpen(false);
    setSelectedCertificateForRevalidation(null);
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
            onRevalidate={handleRevalidate}
            onDelete={handleDelete}
            deletingId={deletingId}
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

      <BatchRevalidationModal
        isOpen={isRevalidationModalOpen}
        onClose={handleRevalidationModalClose}
        certificate={selectedCertificateForRevalidation}
        onSuccess={handleRevalidationSuccess}
      />
    </Layout>
  );
}
