import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { EntryCertificate } from "@shared/schema";
import { 
  Eye, 
  FileEdit, 
  Download, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileText 
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface CertificateTableProps {
  certificates: EntryCertificate[] | undefined;
  loading: boolean;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDownload: (id: number) => void;
}

export function CertificateTable({ 
  certificates, 
  loading, 
  onView, 
  onEdit, 
  onDownload 
}: CertificateTableProps) {
  // Format date strings
  const formatDateStr = (dateStr: string | Date) => {
    return formatDate(new Date(dateStr));
  };
  
  // Get status badge based on certificate status
  const getStatusBadge = (status: string) => {
    if (status === 'Aprovado') {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Aprovado</Badge>;
    } else if (status === 'Reprovado') {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Reprovado</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!certificates || certificates.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum boletim encontrado</h3>
        <p className="text-gray-500">
          Não existem boletins de entrada cadastrados ou que correspondam aos filtros aplicados.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Produto</TableHead>
              <TableHead>Lote Interno</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Lote Fornecedor</TableHead>
              <TableHead>Data Entrada</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {certificates.map((certificate) => (
              <TableRow key={certificate.id}>
                <TableCell className="font-medium">{certificate.productName || `Produto #${certificate.productId}`}</TableCell>
                <TableCell>{certificate.internalLot}</TableCell>
                <TableCell>{certificate.supplierName || `Fornecedor #${certificate.supplierId}`}</TableCell>
                <TableCell>{certificate.supplierLot}</TableCell>
                <TableCell>{formatDateStr(certificate.entryDate)}</TableCell>
                <TableCell>{formatDateStr(certificate.expirationDate)}</TableCell>
                <TableCell>
                  {getStatusBadge(certificate.status)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => onView(certificate.id)}>
                      <Eye className="h-4 w-4 text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onEdit(certificate.id)}>
                      <FileEdit className="h-4 w-4 text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDownload(certificate.id)}>
                      <Download className="h-4 w-4 text-primary" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Mostrando 1-{Math.min(certificates.length, 10)} de {certificates.length} resultados
        </div>
        <div className="flex space-x-1">
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
          </Button>
          <Button variant="outline" size="sm" className="bg-primary text-white hover:bg-primary/90">
            1
          </Button>
          <Button variant="outline" size="sm" disabled={certificates.length <= 10}>
            Próxima <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
