import { useState, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, FileText, AlertCircle, CheckCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NFeSummary {
  numeroNFe: string;
  serie: string;
  dataEmissao: string;
  destinatario: string;
  cnpjDestinatario: string;
  totalItens: number;
  valorTotal: number;
}

interface NFeUploadFormProps {
  onSuccess?: (data: any) => void;
  onCancel?: () => void;
}

export function NFeUploadForm({ onSuccess, onCancel }: NFeUploadFormProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [nfeSummary, setNfeSummary] = useState<NFeSummary | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);

  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    const validTypes = ['text/xml', 'application/xml', 'application/zip'];
    const validExtensions = ['.xml', '.zip'];
    
    const hasValidType = validTypes.includes(file.type);
    const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!hasValidType && !hasValidExtension) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Por favor, selecione um arquivo XML ou ZIP contendo XMLs de NFe.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setValidationErrors([]);
    setNfeSummary(null);
    setParsedData(null);
    
    // Auto-validate XML
    validateXmlFile(file);
  }, [toast]);

  const validateXmlFile = async (file: File) => {
    setIsValidating(true);
    setValidationErrors([]);

    try {
      const text = await file.text();
      
      // Quick validation of XML structure
      if (!text.trim()) {
        setValidationErrors(['Arquivo vazio']);
        return;
      }

      if (!text.includes('<?xml') && !text.includes('<nfeProc') && !text.includes('<NFe')) {
        setValidationErrors(['Arquivo não parece ser um XML válido']);
        return;
      }

      // Check for NFe indicators
      const hasNFeIndicators = text.includes('NFe') || 
                              text.includes('nfe') ||
                              text.includes('infNFe') ||
                              text.includes('emit') ||
                              text.includes('dest');

      if (!hasNFeIndicators) {
        setValidationErrors(['XML não parece ser uma NFe válida']);
        return;
      }

      // Try to get summary
      const response = await fetch('/api/nfe/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ xmlContent: text }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.summary) {
          setNfeSummary(data.summary);
        }
        if (data.errors && data.errors.length > 0) {
          setValidationErrors(data.errors);
        }
      } else {
        const error = await response.json();
        setValidationErrors([error.message || 'Erro ao validar XML']);
      }
    } catch (error) {
      setValidationErrors(['Erro ao ler arquivo XML']);
    } finally {
      setIsValidating(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('nfeFile', selectedFile);

      const response = await fetch('/api/nfe/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setParsedData(data);
        
        toast({
          title: "Upload realizado com sucesso",
          description: "NFe processada e pronta para revisão.",
        });

        if (onSuccess) {
          onSuccess(data);
        }
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Erro no upload');
      }
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: error instanceof Error ? error.message : "Erro ao processar arquivo NFe",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setValidationErrors([]);
    setNfeSummary(null);
    setParsedData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatCNPJ = (cnpj: string) => {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Upload de NFe
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Area */}
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300",
            selectedFile ? "border-green-500 bg-green-50" : ""
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xml,.zip"
            onChange={handleFileInputChange}
            className="hidden"
          />
          
          {selectedFile ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle className="w-6 h-6" />
                <span className="font-medium">Arquivo selecionado</span>
              </div>
              
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{selectedFile.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFile}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
              
              {isValidating && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validando XML...</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="w-12 h-12 text-gray-400 mx-auto" />
              <div>
                <p className="text-lg font-medium">Selecione um arquivo NFe</p>
                <p className="text-sm text-gray-500 mt-1">
                  Arraste um arquivo XML ou ZIP aqui, ou clique para selecionar
                </p>
              </div>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
              >
                Selecionar Arquivo
              </Button>
            </div>
          )}
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                {validationErrors.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* NFe Summary */}
        {nfeSummary && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo da NFe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Número/Série
                  </Label>
                  <div className="font-medium">
                    {nfeSummary.numeroNFe}/{nfeSummary.serie}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Data de Emissão
                  </Label>
                  <div className="font-medium">{nfeSummary.dataEmissao}</div>
                </div>
                
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-gray-600">
                    Destinatário
                  </Label>
                  <div className="font-medium">{nfeSummary.destinatario}</div>
                  <div className="text-sm text-gray-600">
                    CNPJ: {formatCNPJ(nfeSummary.cnpjDestinatario)}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Total de Itens
                  </Label>
                  <div className="font-medium">
                    <Badge variant="outline">{nfeSummary.totalItens}</Badge>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Valor Total
                  </Label>
                  <div className="font-medium">
                    {formatCurrency(nfeSummary.valorTotal)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <Progress value={uploadProgress} className="w-full" />
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Processando NFe...
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || validationErrors.length > 0 || isUploading || isValidating}
            className="min-w-[120px]"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Processar NFe
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}