import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { NFeUploadForm } from "@/components/certificates/nfe-upload-form";
import { NFeImportReview } from "@/components/certificates/nfe-import-review";
import { FeatureGate } from "@/components/ui/feature-gate";
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft, 
  Upload,
  Package,
  User,
  FileOutput
} from "lucide-react";

type ImportStep = 'upload' | 'review' | 'success';

interface ImportStats {
  totalItems: number;
  exactMatches: number;
  goodMatches: number;
  noMatches: number;
  needsReview: number;
}

export default function NFeImportPage() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [importData, setImportData] = useState<any>(null);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [importResults, setImportResults] = useState<any>(null);

  // Process NFe import mutation
  const processImportMutation = useMutation({
    mutationFn: async (processedData: any) => {
      const response = await apiRequest('/api/nfe/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processedData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao processar importação');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setImportResults(data);
      setCurrentStep('success');
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/issued-certificates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      
      toast({
        title: "Importação concluída",
        description: `${data.totalProcessed} certificado(s) gerado(s) com sucesso.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUploadSuccess = (data: any) => {
    setImportData(data);
    setImportStats(data.stats);
    setCurrentStep('review');
  };

  const handleReviewConfirm = async (processedData: any) => {
    await processImportMutation.mutateAsync(processedData);
  };

  const handleRestart = () => {
    setCurrentStep('upload');
    setImportData(null);
    setImportStats(null);
    setImportResults(null);
  };

  const getStepIcon = (step: ImportStep, isActive: boolean, isCompleted: boolean) => {
    if (isCompleted) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    
    if (isActive) {
      switch (step) {
        case 'upload':
          return <Upload className="w-5 h-5 text-blue-500" />;
        case 'review':
          return <FileText className="w-5 h-5 text-blue-500" />;
        case 'success':
          return <CheckCircle className="w-5 h-5 text-blue-500" />;
      }
    }
    
    switch (step) {
      case 'upload':
        return <Upload className="w-5 h-5 text-gray-400" />;
      case 'review':
        return <FileText className="w-5 h-5 text-gray-400" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStepTitle = (step: ImportStep) => {
    switch (step) {
      case 'upload':
        return 'Upload da NFe';
      case 'review':
        return 'Revisão dos Dados';
      case 'success':
        return 'Importação Concluída';
    }
  };

  return (
    <FeatureGate featurePath="/api/nfe/*">
      <Layout>
        <div className="container mx-auto py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Importar NFe</h1>
              <p className="text-gray-600 mt-1">
                Importe dados de Nota Fiscal Eletrônica para gerar certificados automaticamente
              </p>
            </div>
            
            {currentStep !== 'upload' && (
              <Button variant="outline" onClick={handleRestart}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Nova Importação
              </Button>
            )}
          </div>

          {/* Step Indicator */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                {(['upload', 'review', 'success'] as ImportStep[]).map((step, index) => {
                  const isActive = currentStep === step;
                  const isCompleted = 
                    (step === 'upload' && ['review', 'success'].includes(currentStep)) ||
                    (step === 'review' && currentStep === 'success');
                  
                  return (
                    <div key={step} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div className={`
                          flex items-center justify-center w-10 h-10 rounded-full border-2
                          ${isCompleted ? 'border-green-500 bg-green-50' : 
                            isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
                        `}>
                          {getStepIcon(step, isActive, isCompleted)}
                        </div>
                        <span className={`
                          text-sm font-medium mt-2
                          ${isCompleted ? 'text-green-600' : 
                            isActive ? 'text-blue-600' : 'text-gray-500'}
                        `}>
                          {getStepTitle(step)}
                        </span>
                      </div>
                      
                      {index < 2 && (
                        <div className={`
                          w-16 h-0.5 mx-4 
                          ${isCompleted || (currentStep === 'success' && step === 'review') 
                            ? 'bg-green-500' : 'bg-gray-300'}
                        `} />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Import Stats (if available) */}
          {importStats && currentStep !== 'upload' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Estatísticas da Importação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {importStats.totalItems}
                    </div>
                    <div className="text-sm text-gray-600">Total de Itens</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {importStats.exactMatches}
                    </div>
                    <div className="text-sm text-gray-600">Correspondências Exatas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {importStats.goodMatches}
                    </div>
                    <div className="text-sm text-gray-600">Boas Correspondências</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {importStats.needsReview}
                    </div>
                    <div className="text-sm text-gray-600">Requer Revisão</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {importStats.noMatches}
                    </div>
                    <div className="text-sm text-gray-600">Não Encontrados</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step Content */}
          {currentStep === 'upload' && (
            <NFeUploadForm onSuccess={handleUploadSuccess} />
          )}

          {currentStep === 'review' && importData && (
            <NFeImportReview
              importData={importData}
              onConfirm={handleReviewConfirm}
              onCancel={handleRestart}
            />
          )}

          {currentStep === 'success' && importResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-6 h-6" />
                  Importação Concluída com Sucesso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Success Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {importResults.totalProcessed}
                    </div>
                    <div className="text-sm text-green-700">
                      Certificados Gerados
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {importData?.nfeData?.invoice?.numero}/{importData?.nfeData?.invoice?.serie}
                    </div>
                    <div className="text-sm text-blue-700">
                      NFe Processada
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {importData?.nfeData?.destinatario?.razaoSocial}
                    </div>
                    <div className="text-sm text-purple-700">
                      Cliente
                    </div>
                  </div>
                </div>

                {/* Errors (if any) */}
                {importResults.errors && importResults.errors.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium mb-2">
                        {importResults.totalErrors} erro(s) encontrado(s):
                      </div>
                      <ul className="list-disc list-inside space-y-1">
                        {importResults.errors.map((error: string, index: number) => (
                          <li key={index} className="text-sm">{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Action Buttons */}
                <div className="flex justify-center gap-4">
                  <Button onClick={handleRestart}>
                    <Upload className="w-4 h-4 mr-2" />
                    Nova Importação
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = '/issued-certificates'}
                  >
                    <FileOutput className="w-4 h-4 mr-2" />
                    Ver Certificados
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </Layout>
    </FeatureGate>
  );
}