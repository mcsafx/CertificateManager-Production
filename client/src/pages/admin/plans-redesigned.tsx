import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  CreditCard, 
  Users, 
  HardDrive, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Settings,
  CheckCircle,
  XCircle,
  Package
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PlanModuleWizard } from "@/components/admin/plan-module-wizard";

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

export default function PlansRedesignedPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    storageLimit: "",
    maxUsers: ""
  });

  // Fetch plans
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['/api/admin/plans'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/plans');
      if (!response.ok) throw new Error('Erro ao carregar planos');
      return response.json();
    }
  });

  // Fetch modules
  const { data: modules = [], isLoading: modulesLoading } = useQuery({
    queryKey: ['/api/admin/modules'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/modules');
      if (!response.ok) throw new Error('Erro ao carregar módulos');
      return response.json();
    }
  });

  // Fetch plan modules for selected plan
  const { data: planModules = [], isLoading: planModulesLoading } = useQuery({
    queryKey: ['/api/admin/plans', selectedPlan?.id, 'modules'],
    queryFn: async () => {
      if (!selectedPlan) return [];
      const response = await apiRequest('GET', `/api/admin/plans/${selectedPlan.id}/modules`);
      if (!response.ok) throw new Error('Erro ao carregar módulos do plano');
      return response.json();
    },
    enabled: !!selectedPlan
  });

  // Fetch all plan modules for comparison
  const { data: allPlanModules = [] } = useQuery({
    queryKey: ['/api/admin/all-plan-modules'],
    queryFn: async () => {
      const allAssociations: any[] = [];
      
      // Fetch modules for each plan
      for (const plan of plans) {
        try {
          const response = await apiRequest('GET', `/api/admin/plans/${plan.id}/modules`);
          if (response.ok) {
            const planModules = await response.json();
            planModules.forEach((pm: any) => {
              allAssociations.push({
                planId: plan.id,
                moduleId: pm.moduleId || pm.id
              });
            });
          }
        } catch (error) {
          console.warn(`Failed to load modules for plan ${plan.id}`);
        }
      }
      
      return allAssociations;
    },
    enabled: plans.length > 0
  });

  const getPlanBadgeColor = (code: string) => {
    switch (code) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-blue-100 text-blue-800'; 
      case 'C': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanIcon = (code: string) => {
    switch (code) {
      case 'A': return <Package className="h-5 w-5" />;
      case 'B': return <CreditCard className="h-5 w-5" />;
      case 'C': return <Settings className="h-5 w-5" />;
      default: return <Package className="h-5 w-5" />;
    }
  };

  const hasModule = (moduleId: number) => {
    return planModules.some((pm: any) => pm.moduleId === moduleId);
  };

  const planHasModule = (planId: number, moduleId: number) => {
    return allPlanModules.some((pm: any) => pm.planId === planId && pm.moduleId === moduleId);
  };

  // Edit plan mutation
  const editPlanMutation = useMutation({
    mutationFn: async (planData: any) => {
      const response = await apiRequest('PUT', `/api/admin/plans/${editingPlan?.id}`, {
        ...planData,
        price: parseFloat(planData.price),
        storageLimit: parseInt(planData.storageLimit),
        maxUsers: parseInt(planData.maxUsers)
      });
      if (!response.ok) throw new Error('Erro ao atualizar plano');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/plans'] });
      setEditDialogOpen(false);
      setEditingPlan(null);
      toast({ title: "Plano atualizado com sucesso" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar plano", description: error.message, variant: "destructive" });
    }
  });

  // Delete plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      const response = await apiRequest('DELETE', `/api/admin/plans/${planId}`);
      if (!response.ok) throw new Error('Erro ao deletar plano');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/plans'] });
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
      toast({ title: "Plano deletado com sucesso" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao deletar plano", description: error.message, variant: "destructive" });
    }
  });

  const handleEditClick = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price.toString(),
      storageLimit: plan.storageLimit.toString(),
      maxUsers: plan.maxUsers.toString()
    });
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (plan: Plan) => {
    setPlanToDelete(plan);
    setDeleteDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingPlan) {
      editPlanMutation.mutate(formData);
    }
  };

  const handleConfirmDelete = () => {
    if (planToDelete) {
      deletePlanMutation.mutate(planToDelete.id);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Planos</h1>
            <p className="text-muted-foreground">
              Gerencie planos de assinatura, preços e configurações
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Plano
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="comparison">Comparativo</TabsTrigger>
            <TabsTrigger value="modules">Configurar Módulos</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan: Plan) => (
                <Card key={plan.id} className="relative overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getPlanIcon(plan.code)}
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                      </div>
                      <Badge className={getPlanBadgeColor(plan.code)}>
                        {plan.code}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Price */}
                    <div className="text-center p-4 bg-muted/20 rounded-lg">
                      <div className="text-2xl font-bold">
                        {formatCurrency(plan.price)}
                      </div>
                      <div className="text-sm text-muted-foreground">por mês</div>
                    </div>

                    {/* Limits */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>Usuários</span>
                        </div>
                        <span className="font-medium">{plan.maxUsers}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <HardDrive className="h-4 w-4" />
                          <span>Storage</span>
                        </div>
                        <span className="font-medium">
                          {(plan.storageLimit / 1024).toFixed(1)} GB
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <PlanModuleWizard
                        plan={plan}
                        modules={modules}
                        currentModules={allPlanModules.filter((pm: any) => pm.planId === plan.id).map((pm: any) => pm.moduleId)}
                        onComplete={() => {
                          setSelectedPlan(plan);
                          setActiveTab("modules");
                        }}
                      />
                      <Button size="sm" variant="outline" onClick={() => handleEditClick(plan)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteClick(plan)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Comparativo de Planos</CardTitle>
                <CardDescription>
                  Compare recursos e módulos incluídos em cada plano
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium">Recurso</th>
                        {plans.map((plan: Plan) => (
                          <th key={plan.id} className="text-center p-4 min-w-[120px]">
                            <div className="space-y-1">
                              <div className="font-medium">{plan.name}</div>
                              <Badge className={`text-xs ${getPlanBadgeColor(plan.code)}`}>
                                {plan.code}
                              </Badge>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-4 font-medium">Preço Mensal</td>
                        {plans.map((plan: Plan) => (
                          <td key={plan.id} className="text-center p-4">
                            <div className="font-bold text-lg">
                              {formatCurrency(plan.price)}
                            </div>
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="p-4">Máximo de Usuários</td>
                        {plans.map((plan: Plan) => (
                          <td key={plan.id} className="text-center p-4">
                            {plan.maxUsers}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="p-4">Armazenamento</td>
                        {plans.map((plan: Plan) => (
                          <td key={plan.id} className="text-center p-4">
                            {(plan.storageLimit / 1024).toFixed(1)} GB
                          </td>
                        ))}
                      </tr>
                      
                      {/* Modules comparison */}
                      {modules.map((module: Module) => (
                        <tr key={module.id} className="border-b">
                          <td className="p-4">
                            <div>
                              <div className="font-medium">{module.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {module.description}
                              </div>
                            </div>
                          </td>
                          {plans.map((plan: Plan) => (
                            <td key={plan.id} className="text-center p-4">
                              <div className="flex justify-center">
                                {module.isCore || planHasModule(plan.id, module.id) ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-gray-300" />
                                )}
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Modules Configuration Tab */}
          <TabsContent value="modules" className="space-y-6">
            {selectedPlan ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getPlanIcon(selectedPlan.code)}
                      Módulos do {selectedPlan.name}
                      <Badge className={getPlanBadgeColor(selectedPlan.code)}>
                        {selectedPlan.code}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Configure quais módulos estão incluídos neste plano
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {modules.map((module: Module) => {
                        const isIncluded = hasModule(module.id);
                        const isCore = module.isCore;
                        
                        return (
                          <Card key={module.id} className={`relative ${
                            isIncluded ? 'ring-2 ring-green-500' : ''
                          } ${isCore ? 'bg-blue-50' : ''}`}>
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-base">{module.name}</CardTitle>
                                <div className="flex gap-2">
                                  {isCore && (
                                    <Badge variant="secondary">Core</Badge>
                                  )}
                                  {isIncluded ? (
                                    <Badge className="bg-green-100 text-green-800">
                                      Incluído
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline">
                                      Não Incluído
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground mb-3">
                                {module.description}
                              </p>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">
                                  {module.featureCount || 0} funcionalidades
                                </span>
                                <Button 
                                  size="sm" 
                                  variant={isIncluded ? "destructive" : "default"}
                                  disabled={isCore}
                                >
                                  {isCore ? 'Obrigatório' : isIncluded ? 'Remover' : 'Adicionar'}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Selecione um Plano</h3>
                  <p className="text-muted-foreground">
                    Selecione um plano na aba "Visão Geral" para configurar seus módulos
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Plan Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Plano</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nome
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Descrição
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">
                  Preço
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="storageLimit" className="text-right">
                  Storage (MB)
                </Label>
                <Input
                  id="storageLimit"
                  type="number"
                  value={formData.storageLimit}
                  onChange={(e) => setFormData({...formData, storageLimit: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="maxUsers" className="text-right">
                  Max Usuários
                </Label>
                <Input
                  id="maxUsers"
                  type="number"
                  value={formData.maxUsers}
                  onChange={(e) => setFormData({...formData, maxUsers: e.target.value})}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} disabled={editPlanMutation.isPending}>
                {editPlanMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Plan Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>Tem certeza que deseja excluir o plano "{planToDelete?.name}"?</p>
              <p className="text-sm text-muted-foreground mt-2">
                Esta ação não pode ser desfeita.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete} disabled={deletePlanMutation.isPending}>
                {deletePlanMutation.isPending ? "Excluindo..." : "Excluir"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}