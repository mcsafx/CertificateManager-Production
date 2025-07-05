import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Calendar, User, FileText, ArrowRight, ChevronDown, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BatchRevalidation {
  id: number;
  originalBatchId: number;
  newBatchId: number;
  revalidationDate: string;
  revalidationReason: string;
  originalExpirationDate: string;
  newExpirationDate: string;
  labCertificateUrl?: string;
  labCertificateFileName?: string;
  revalidatedBy: number;
  createdAt: string;
  tenantId: number;
  originalBatch?: {
    id: number;
    internalLot: string;
    expirationDate: string;
  };
  newBatch?: {
    id: number;
    internalLot: string;
    expirationDate: string;
  };
  revalidatedByUser?: {
    id: number;
    name: string;
  };
}

interface BatchRevalidationHistoryProps {
  batchId: number;
}

export function BatchRevalidationHistory({ batchId }: BatchRevalidationHistoryProps) {
  const [revalidations, setRevalidations] = useState<BatchRevalidation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const fetchRevalidations = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("GET", `/api/batch-revalidations/batch/${batchId}`);
      if (response.ok) {
        const data = await response.json();
        setRevalidations(data);
      } else {
        console.error("Erro ao buscar revalidações");
      }
    } catch (error) {
      console.error("Erro ao buscar revalidações:", error);
      toast({
        title: "Erro ao carregar histórico",
        description: "Não foi possível carregar o histórico de revalidações",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (batchId) {
      fetchRevalidations();
    }
  }, [batchId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <RefreshCw className="h-5 w-5 mr-2 text-primary animate-spin" />
            Carregando Histórico de Revalidações
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (revalidations.length === 0) {
    return null; // Não mostrar o card se não há revalidações
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <RefreshCw className="h-5 w-5 mr-2 text-primary" />
            Histórico de Revalidações
            <Badge variant="secondary" className="ml-2">
              {revalidations.length}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          <div className="space-y-4">
            {revalidations.map((revalidation, index) => (
              <div key={revalidation.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Revalidação #{index + 1}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {formatDate(new Date(revalidation.revalidationDate))}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    {revalidation.revalidatedByUser?.name || `Usuário #${revalidation.revalidatedBy}`}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* Lote Original */}
                  <div className="bg-white p-3 rounded border">
                    <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                      <FileText className="h-4 w-4 mr-1" />
                      Lote Original
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-gray-500">Lote:</span>
                        <span className="ml-1 font-medium">{revalidation.originalBatch?.internalLot}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Validade:</span>
                        <span className="ml-1">{formatDate(new Date(revalidation.originalExpirationDate))}</span>
                      </div>
                    </div>
                  </div>

                  {/* Seta */}
                  <div className="flex items-center justify-center">
                    <ArrowRight className="h-6 w-6 text-blue-500" />
                  </div>

                  {/* Novo Lote */}
                  <div className="bg-white p-3 rounded border border-green-200">
                    <h4 className="font-medium text-green-700 mb-2 flex items-center">
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Novo Lote
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-gray-500">Lote:</span>
                        <span className="ml-1 font-medium">{revalidation.newBatch?.internalLot}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Nova Validade:</span>
                        <span className="ml-1 text-green-600 font-medium">
                          {formatDate(new Date(revalidation.newExpirationDate))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Razão da Revalidação */}
                <div className="bg-white p-3 rounded border">
                  <h4 className="font-medium text-gray-700 mb-2">Razão da Revalidação</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {revalidation.revalidationReason}
                  </p>
                </div>

                {/* Certificado de Laboratório */}
                {revalidation.labCertificateUrl && (
                  <div className="bg-white p-3 rounded border mt-3">
                    <h4 className="font-medium text-gray-700 mb-2">Certificado de Laboratório</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(revalidation.labCertificateUrl, '_blank')}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {revalidation.labCertificateFileName || 'Abrir Certificado'}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}