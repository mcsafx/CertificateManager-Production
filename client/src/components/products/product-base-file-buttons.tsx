import { Button } from "@/components/ui/button";
import { Eye, Download, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ProductBaseFile } from "@shared/schema";

interface FileButtonsProps {
  file: ProductBaseFile;
  onDelete?: () => void;
}

export function ProductBaseFileButtons({ file, onDelete }: FileButtonsProps) {
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      await apiRequest("DELETE", `/api/product-base-files/${file.id}`);
      toast({ title: "Arquivo removido com sucesso" });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/product-base/${file.baseProductId}/files`] 
      });
      if (onDelete) onDelete();
    } catch (error) {
      toast({ 
        title: "Erro ao remover arquivo", 
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
      <Button 
        variant="destructive" 
        size="sm"
        onClick={handleDelete}
      >
        <Trash2 className="h-4 w-4 mr-1" /> Remover
      </Button>
    </div>
  );
}