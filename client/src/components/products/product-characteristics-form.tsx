import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertProductCharacteristicSchema, ProductCharacteristic } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface ProductCharacteristicsFormProps {
  productId: number;
}

export function ProductCharacteristicsForm({ productId }: ProductCharacteristicsFormProps) {
  const { toast } = useToast();
  const [newCharacteristic, setNewCharacteristic] = useState({
    name: "",
    unit: "",
    minValue: "",
    maxValue: "",
    analysisMethod: "",
  });

  // Fetch product characteristics
  const { data: characteristics, isLoading } = useQuery<ProductCharacteristic[]>({
    queryKey: [`/api/products/${productId}/characteristics`],
  });

  // Mutation for adding a characteristic
  const addMutation = useMutation({
    mutationFn: async (data: typeof newCharacteristic) => {
      const payload = {
        ...data,
        productId,
        minValue: data.minValue ? parseFloat(data.minValue) : null,
        maxValue: data.maxValue ? parseFloat(data.maxValue) : null,
      };
      
      await apiRequest("POST", "/api/product-characteristics", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/characteristics`] });
      setNewCharacteristic({
        name: "",
        unit: "",
        minValue: "",
        maxValue: "",
        analysisMethod: "",
      });
      toast({
        title: "Característica adicionada",
        description: "A característica foi adicionada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting a characteristic
  const deleteMutation = useMutation({
    mutationFn: async (characteristicId: number) => {
      await apiRequest("DELETE", `/api/product-characteristics/${characteristicId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/characteristics`] });
      toast({
        title: "Característica removida",
        description: "A característica foi removida com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCharacteristic({
      ...newCharacteristic,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddCharacteristic = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate form data
      insertProductCharacteristicSchema.parse({
        ...newCharacteristic,
        productId,
        minValue: newCharacteristic.minValue ? parseFloat(newCharacteristic.minValue) : null,
        maxValue: newCharacteristic.maxValue ? parseFloat(newCharacteristic.maxValue) : null,
        tenantId: 1, // This will be assigned by the server based on the authenticated user
      });
      
      addMutation.mutate(newCharacteristic);
    } catch (error: any) {
      toast({
        title: "Erro de validação",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteCharacteristic = (characteristicId: number) => {
    if (window.confirm("Tem certeza que deseja remover esta característica?")) {
      deleteMutation.mutate(characteristicId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-md">
        <h3 className="text-sm font-medium mb-4">Adicionar Nova Característica</h3>
        <form onSubmit={handleAddCharacteristic} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              name="name"
              value={newCharacteristic.name}
              onChange={handleChange}
              placeholder="Ex: Pureza"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="unit">Unidade *</Label>
            <Input
              id="unit"
              name="unit"
              value={newCharacteristic.unit}
              onChange={handleChange}
              placeholder="Ex: %"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="minValue">Valor Mínimo</Label>
            <Input
              id="minValue"
              name="minValue"
              type="number"
              step="any"
              value={newCharacteristic.minValue}
              onChange={handleChange}
              placeholder="Ex: 98.0"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="maxValue">Valor Máximo</Label>
            <Input
              id="maxValue"
              name="maxValue"
              type="number"
              step="any"
              value={newCharacteristic.maxValue}
              onChange={handleChange}
              placeholder="Ex: 99.9"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="analysisMethod">Método de Análise</Label>
            <div className="flex">
              <Input
                id="analysisMethod"
                name="analysisMethod"
                value={newCharacteristic.analysisMethod}
                onChange={handleChange}
                placeholder="Ex: ASTM D-123"
                className="rounded-r-none flex-1"
              />
              <Button 
                type="submit" 
                className="rounded-l-none"
                disabled={addMutation.isPending}
              >
                {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </form>
      </div>
      
      <div>
        <h3 className="text-sm font-medium mb-4">Características Cadastradas</h3>
        
        {characteristics && characteristics.length > 0 ? (
          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Mínimo</TableHead>
                  <TableHead>Máximo</TableHead>
                  <TableHead>Método de Análise</TableHead>
                  <TableHead className="w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {characteristics.map((characteristic) => (
                  <TableRow key={characteristic.id}>
                    <TableCell>{characteristic.name}</TableCell>
                    <TableCell>{characteristic.unit}</TableCell>
                    <TableCell>{characteristic.minValue !== null ? characteristic.minValue : "-"}</TableCell>
                    <TableCell>{characteristic.maxValue !== null ? characteristic.maxValue : "-"}</TableCell>
                    <TableCell>{characteristic.analysisMethod || "-"}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCharacteristic(characteristic.id)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-500" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center p-8 border rounded-md bg-gray-50">
            <p className="text-gray-500">Nenhuma característica cadastrada para este produto.</p>
            <p className="text-sm text-gray-400 mt-1">Adicione características usando o formulário acima.</p>
          </div>
        )}
      </div>
    </div>
  );
}
