import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate, toISODateString } from "@/lib/utils";
import { Client, EntryCertificate, Product } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface IssueCertificateFormProps {
  entryCertificateId?: number;
  onSuccess?: () => void;
}

export function IssueCertificateForm({ entryCertificateId, onSuccess }: IssueCertificateFormProps) {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    clientId: "",
    invoiceNumber: "",
    issueDate: toISODateString(new Date()),
    soldQuantity: "",
    measureUnit: "",
    customLot: "",
  });
  
  // Fetch entry certificate if ID is provided
  const { data: entryCertificate, isLoading: isLoadingCertificate } = useQuery<EntryCertificate & { product: Product }>({
    queryKey: [`/api/entry-certificates/${entryCertificateId}`],
    enabled: !!entryCertificateId,
  });
  
  // Fetch clients for dropdown
  const { data: clients, isLoading: isLoadingClients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });
  
  // Set default values based on entry certificate
  useEffect(() => {
    if (entryCertificate) {
      setFormData(prev => ({
        ...prev,
        measureUnit: entryCertificate.measureUnit,
        customLot: entryCertificate.internalLot,
      }));
    }
  }, [entryCertificate]);
  
  // Create issued certificate
  const issueMutation = useMutation({
    mutationFn: async () => {
      if (!entryCertificateId) {
        throw new Error("Nenhum boletim de entrada selecionado");
      }
      
      const payload = {
        entryCertificateId,
        clientId: parseInt(formData.clientId),
        invoiceNumber: formData.invoiceNumber,
        issueDate: formData.issueDate,
        soldQuantity: parseFloat(formData.soldQuantity),
        measureUnit: formData.measureUnit,
        customLot: formData.customLot,
      };
      
      return await apiRequest("POST", "/api/issued-certificates", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/issued-certificates"] });
      
      toast({
        title: "Boletim emitido",
        description: "O boletim foi emitido com sucesso.",
      });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Form change handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.clientId || !formData.invoiceNumber || !formData.soldQuantity || !formData.customLot) {
      toast({
        title: "Erro de validação",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    
    issueMutation.mutate();
  };
  
  if (isLoadingCertificate || isLoadingClients) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!entryCertificate) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">Erro: Boletim de entrada não encontrado</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h3 className="font-medium mb-2">Detalhes do Boletim de Entrada</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Produto:</span>{" "}
              <span className="font-medium">{entryCertificate.product?.technicalName}</span>
            </div>
            <div>
              <span className="text-gray-500">Lote Interno:</span>{" "}
              <span className="font-medium">{entryCertificate.internalLot}</span>
            </div>
            <div>
              <span className="text-gray-500">Quantidade Recebida:</span>{" "}
              <span className="font-medium">
                {entryCertificate.receivedQuantity} {entryCertificate.measureUnit}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Validade:</span>{" "}
              <span className="font-medium">{formatDate(entryCertificate.expirationDate)}</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="clientId">Cliente *</Label>
            <Select
              value={formData.clientId}
              onValueChange={(value) => handleSelectChange("clientId", value)}
              required
            >
              <SelectTrigger id="clientId">
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients?.map((client) => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="invoiceNumber">Número da Nota Fiscal de Saída *</Label>
            <Input
              id="invoiceNumber"
              name="invoiceNumber"
              value={formData.invoiceNumber}
              onChange={handleChange}
              placeholder="Ex: NF-e 12345"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="issueDate">Data da Emissão *</Label>
            <Input
              id="issueDate"
              name="issueDate"
              type="date"
              value={formData.issueDate}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="soldQuantity">Quantidade Vendida *</Label>
              <Input
                id="soldQuantity"
                name="soldQuantity"
                type="number"
                step="0.01"
                min="0"
                value={formData.soldQuantity}
                onChange={handleChange}
                placeholder="0,00"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="measureUnit">Unidade *</Label>
              <Input
                id="measureUnit"
                name="measureUnit"
                value={formData.measureUnit}
                onChange={handleChange}
                placeholder="Ex: kg"
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="customLot">Lote Personalizado *</Label>
            <Input
              id="customLot"
              name="customLot"
              value={formData.customLot}
              onChange={handleChange}
              placeholder="Lote para o cliente"
              required
            />
          </div>
        </div>
        
        <div className="pt-6 border-t flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            disabled={issueMutation.isPending}
          >
            {issueMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Emitindo...
              </>
            ) : (
              "Emitir Boletim"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
