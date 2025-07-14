import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Loader2 } from "lucide-react";
import { ResponsiveFormGrid, ResponsiveFormSection } from "@/components/ui/responsive-form-grid";

interface ModuleCreateModalProps {
  onSuccess?: () => void;
}

export function ModuleCreateModal({ onSuccess }: ModuleCreateModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    active: true,
    isCore: false
  });

  const createModuleMutation = useMutation({
    mutationFn: async (moduleData: typeof formData) => {
      const response = await apiRequest('POST', '/api/admin/modules', moduleData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar módulo');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/modules'] });
      toast({
        title: "Módulo criado",
        description: "O módulo foi criado com sucesso",
      });
      setIsOpen(false);
      setFormData({
        code: "",
        name: "",
        description: "",
        active: true,
        isCore: false
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar módulo",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.description) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }
    createModuleMutation.mutate(formData);
  };

  const updateField = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Módulo
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md lg:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Novo Módulo</DialogTitle>
          <DialogDescription>
            Adicione um novo módulo ao sistema
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <ResponsiveFormSection>
            <ResponsiveFormGrid columns={{ mobile: 1, tablet: 1, desktop: 2, widescreen: 2 }}>
          <div>
            <Label htmlFor="code">Código *</Label>
            <Input
              id="code"
              placeholder="ex: new_module"
              value={formData.code}
              onChange={(e) => updateField('code', e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Código único, use apenas letras minúsculas e underscore
            </p>
          </div>
          
          <div>
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              placeholder="ex: Novo Módulo"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              required
            />
          </div>
          
          <div className="md:col-span-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              placeholder="Descreva a finalidade do módulo..."
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
              required
            />
          </div>
          
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="active">Módulo Ativo</Label>
                <p className="text-sm text-muted-foreground">
                  Determina se o módulo estará disponível
                </p>
              </div>
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => updateField('active', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isCore">Módulo Core</Label>
                <p className="text-sm text-muted-foreground">
                  Módulos core são obrigatórios em todos os planos
                </p>
              </div>
              <Switch
                id="isCore"
                checked={formData.isCore}
                onCheckedChange={(checked) => updateField('isCore', checked)}
              />
            </div>
          </div>
            </ResponsiveFormGrid>
          </ResponsiveFormSection>
          
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={createModuleMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createModuleMutation.isPending}
            >
              {createModuleMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Criar Módulo
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}