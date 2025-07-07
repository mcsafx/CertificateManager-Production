import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Settings, 
  Package, 
  CheckCircle, 
  XCircle,
  Loader2,
  Wand2
} from "lucide-react";

interface Plan {
  id: number;
  code: string;
  name: string;
  description: string;
  price: number;
  storageLimit: number;
  maxUsers: number;
  active: boolean;
}

interface Module {
  id: number;
  code: string;
  name: string;
  description: string;
  active: boolean;
  isCore: boolean;
  featureCount?: number;
}

interface PlanModuleWizardProps {
  plan: Plan;
  modules: Module[];
  currentModules: number[];
  onComplete: () => void;
}

export function PlanModuleWizard({ plan, modules, currentModules, onComplete }: PlanModuleWizardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedModules, setSelectedModules] = useState<number[]>(currentModules);
  const [isOpen, setIsOpen] = useState(false);

  const updatePlanModulesMutation = useMutation({
    mutationFn: async (moduleIds: number[]) => {
      const response = await apiRequest('PUT', `/api/admin/plans/${plan.id}/modules`, {
        moduleIds
      });
      if (!response.ok) {
        throw new Error('Erro ao atualizar módulos do plano');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/plans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/plans', plan.id, 'modules'] });
      toast({
        title: "Módulos atualizados",
        description: `Os módulos do plano ${plan.name} foram atualizados com sucesso`,
      });
      setIsOpen(false);
      onComplete();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar módulos",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleModuleToggle = (moduleId: number, isCore: boolean) => {
    if (isCore) return; // Core modules can't be toggled
    
    setSelectedModules(prev => {
      if (prev.includes(moduleId)) {
        return prev.filter(id => id !== moduleId);
      } else {
        return [...prev, moduleId];
      }
    });
  };

  const handleSave = () => {
    const coreModules = modules.filter(m => m.isCore).map(m => m.id);
    const allModules = Array.from(new Set([...coreModules, ...selectedModules]));
    updatePlanModulesMutation.mutate(allModules);
  };

  const getPlanBadgeColor = (code: string) => {
    switch (code) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-blue-100 text-blue-800'; 
      case 'C': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Wand2 className="h-4 w-4" />
          Configurar Módulos
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurar Módulos - {plan.name}
            <Badge className={getPlanBadgeColor(plan.code)}>
              {plan.code}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Selecione quais módulos devem estar incluídos no plano {plan.name}.
            Módulos marcados como "Core" são obrigatórios e não podem ser removidos.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {modules.map((module) => {
              const isSelected = selectedModules.includes(module.id);
              const isCore = module.isCore;
              
              return (
                <Card key={module.id} className={`cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-primary' : ''
                } ${isCore ? 'bg-blue-50' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isSelected || isCore}
                          disabled={isCore}
                          onCheckedChange={() => handleModuleToggle(module.id, isCore)}
                        />
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          <CardTitle className="text-base">{module.name}</CardTitle>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {isCore && (
                          <Badge variant="secondary">Core</Badge>
                        )}
                        <Badge variant={isSelected ? "default" : "outline"}>
                          {isSelected ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {isSelected ? 'Incluído' : 'Não Incluído'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-2">
                      {module.description}
                    </CardDescription>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>Código: {module.code}</span>
                      <span>{module.featureCount || 0} funcionalidades</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
        
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedModules.length} módulos selecionados
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={updatePlanModulesMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={updatePlanModulesMutation.isPending}
            >
              {updatePlanModulesMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Salvar Alterações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}