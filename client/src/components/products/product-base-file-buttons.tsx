import { Button } from "@/components/ui/button";
import { Eye, Download, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ProductBaseFile } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface FileButtonsProps {
  file: ProductBaseFile;
  onDelete?: () => void;
}

export function ProductBaseFileButtons({ file, onDelete }: FileButtonsProps) {
  const { toast } = useToast();
  const [editDescription, setEditDescription] = useState(file.description || "");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await apiRequest("DELETE", `/api/product-base-files/${file.id}`);
      toast({ 
        title: "Arquivo removido com sucesso",
        description: `O arquivo "${file.fileName}" foi removido.`
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/product-base/${file.baseProductId}/files`] 
      });
      if (onDelete) onDelete();
    } catch (error: any) {
      toast({ 
        title: "Erro ao remover arquivo", 
        description: error.message || "Não foi possível remover o arquivo.",
        variant: "destructive" 
      });
    }
  };

  const handleEditDescription = async () => {
    try {
      await apiRequest("PATCH", `/api/product-base-files/${file.id}`, {
        description: editDescription
      });
      
      toast({ 
        title: "Descrição atualizada com sucesso",
        description: "A descrição do arquivo foi alterada."
      });
      
      queryClient.invalidateQueries({ 
        queryKey: [`/api/product-base/${file.baseProductId}/files`] 
      });
      
      setIsEditDialogOpen(false);
    } catch (error: any) {
      toast({ 
        title: "Erro ao atualizar descrição", 
        description: error.message || "Não foi possível atualizar a descrição.",
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => {
          // Usar a API para visualizar o arquivo
          const fileViewUrl = `/api/files/view/${file.id}?type=base`;
          window.open(fileViewUrl, '_blank');
        }}
      >
        <Eye className="h-4 w-4 mr-1" /> Visualizar
      </Button>
      
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => {
          // Usar a API para download do arquivo
          const fileDownloadUrl = `/api/files/download/${file.id}?type=base`;
          const link = document.createElement('a');
          link.href = fileDownloadUrl;
          link.download = file.fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }}
      >
        <Download className="h-4 w-4 mr-1" /> Baixar
      </Button>

      {/* Botão de Editar Descrição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-1" /> Editar
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Descrição do Arquivo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Arquivo</Label>
              <Input value={file.fileName} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Digite uma descrição para o arquivo"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditDescription}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Botão de Remover com Confirmação */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-1" /> Remover
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja remover o arquivo "{file.fileName}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}