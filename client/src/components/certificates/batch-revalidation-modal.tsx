import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import { Calendar, FileText, Clock, AlertTriangle, Upload, X, CheckCircle } from "lucide-react";

const revalidationSchema = z.object({
  newInternalLot: z.string().min(1, "Novo lote interno é obrigatório"),
  newExpirationDate: z.string().min(1, "Nova data de validade é obrigatória"),
  revalidationReason: z.string().min(10, "Razão deve ter pelo menos 10 caracteres"),
});

type RevalidationFormData = z.infer<typeof revalidationSchema>;

interface BatchRevalidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: {
    id: number;
    internalLot: string;
    expirationDate: string;
    productName?: string;
    receivedQuantity: string | number;
    measureUnit: string;
  } | null;
  onSuccess: () => void;
}

export function BatchRevalidationModal({
  isOpen,
  onClose,
  certificate,
  onSuccess,
}: BatchRevalidationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [labCertificateFile, setLabCertificateFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<RevalidationFormData>({
    resolver: zodResolver(revalidationSchema),
    defaultValues: {
      newInternalLot: "",
      newExpirationDate: "",
      revalidationReason: "",
    },
  });

  const uploadLabCertificate = async (): Promise<{ url: string; fileName: string } | null> => {
    if (!labCertificateFile) return null;

    setUploadProgress("Enviando arquivo...");
    
    try {
      const formData = new FormData();
      formData.append('file', labCertificateFile);
      formData.append('fileCategory', 'lab_certificate');
      formData.append('description', 'Certificado de laboratório para revalidação');
      formData.append('entityType', 'batch_revalidation');

      const response = await fetch('/api/files', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro no upload do arquivo');
      }

      const result = await response.json();
      setUploadProgress("Arquivo enviado com sucesso!");
      
      return {
        url: result.publicUrl,
        fileName: result.fileName
      };
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar o certificado de laboratório",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadProgress(null);
    }
  };

  const onSubmit = async (data: RevalidationFormData) => {
    if (!certificate) return;

    setIsLoading(true);
    try {
      // Upload do certificado laboratorial se fornecido
      const labCertificateData = await uploadLabCertificate();

      const response = await apiRequest("POST", "/api/batch-revalidations", {
        originalBatchId: certificate.id,
        newInternalLot: data.newInternalLot,
        newExpirationDate: data.newExpirationDate,
        revalidationReason: data.revalidationReason,
        labCertificateUrl: labCertificateData?.url,
        labCertificateFileName: labCertificateData?.fileName,
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Lote revalidado com sucesso",
          description: `Novo lote ${data.newInternalLot} criado com validade para ${formatDate(new Date(data.newExpirationDate))}`,
        });
        form.reset();
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        toast({
          title: "Erro ao revalidar lote",
          description: error.message || "Ocorreu um erro inesperado",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao revalidar lote:", error);
      toast({
        title: "Erro ao revalidar lote",
        description: "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setLabCertificateFile(null);
    setUploadProgress(null);
    onClose();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLabCertificateFile(file);
    }
  };

  const removeFile = () => {
    setLabCertificateFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!certificate) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Revalidação de Lote
          </DialogTitle>
          <DialogDescription>
            Revalide o lote criando uma nova versão com data de validade estendida.
            O lote original será marcado como "Revalidado" e um novo lote será criado.
          </DialogDescription>
        </DialogHeader>

        {/* Informações do lote atual */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Informações do Lote Atual</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3 text-gray-500" />
              <span className="text-gray-600">Lote:</span>
              <span className="font-medium truncate">{certificate.internalLot}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-gray-500" />
              <span className="text-gray-600">Validade:</span>
              <span className="font-medium">{formatDate(new Date(certificate.expirationDate))}</span>
            </div>
            <div className="flex items-center gap-1 col-span-2 md:col-span-1">
              <span className="text-gray-600">Produto:</span>
              <span className="font-medium truncate">{certificate.productName || `Produto #${certificate.id}`}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-600">Qtd:</span>
              <span className="font-medium">{certificate.receivedQuantity} {certificate.measureUnit}</span>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Campos principais em layout horizontal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="newInternalLot"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Novo Lote Interno</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex: L001-REV-001"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newExpirationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Data de Validade</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        disabled={isLoading}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Razão da revalidação e upload lado a lado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="revalidationReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razão da Revalidação</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Descreva o motivo da revalidação, incluindo referências aos laudos de laboratório..."
                        rows={3}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Upload de Certificado Laboratorial */}
              <div className="space-y-2">
                <Label htmlFor="labCertificate">
                  Certificado de Laboratório (Opcional)
                </Label>
                <div className="space-y-2">
                  {!labCertificateFile ? (
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-6 w-6 mx-auto text-gray-400 mb-1" />
                      <p className="text-xs text-gray-600 mb-1">
                        Clique para selecionar
                      </p>
                      <p className="text-xs text-gray-500">
                        PDF, JPG, PNG (máx. 10MB)
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-xs font-medium text-green-800 truncate max-w-[120px]">
                            {labCertificateFile.name}
                          </p>
                          <p className="text-xs text-green-600">
                            {(labCertificateFile.size / 1024 / 1024).toFixed(1)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeFile}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  {uploadProgress && (
                    <div className="text-xs text-blue-600 flex items-center gap-1">
                      <Clock className="h-3 w-3 animate-spin" />
                      {uploadProgress}
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 mb-1">Importante:</p>
                  <ul className="text-amber-700 space-y-1">
                    <li>• O lote original será marcado como "Revalidado"</li>
                    <li>• Um novo lote será criado com as mesmas características</li>
                    <li>• Todas as análises serão copiadas para o novo lote</li>
                    <li>• Esta operação não pode ser desfeita</li>
                  </ul>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Revalidando...
                  </>
                ) : (
                  "Revalidar Lote"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}