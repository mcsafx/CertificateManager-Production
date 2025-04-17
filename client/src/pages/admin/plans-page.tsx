import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, PlusCircle, Trash2, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AdminLayout from "@/components/layout/admin-layout";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Página de Administração de Planos
export default function PlansPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [openNewPlan, setOpenNewPlan] = useState(false);
  const [openEditPlan, setOpenEditPlan] = useState(false);
  const [openNewModule, setOpenNewModule] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<number | null>(null);
  const [planToEdit, setPlanToEdit] = useState<any>(null);
  const [moduleToDelete, setModuleToDelete] = useState<number | null>(null);
  const [openDeletePlanDialog, setOpenDeletePlanDialog] = useState(false);
  const [openDeleteModuleDialog, setOpenDeleteModuleDialog] = useState(false);
  const [selectedTab, setSelectedTab] = useState("plans");
  const [openPlanModuleEditor, setOpenPlanModuleEditor] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  // Buscar lista de planos disponíveis
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['/api/admin/plans'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/plans');
      if (!response.ok) {
        throw new Error('Erro ao carregar planos');
      }
      return response.json();
    }
  });

  // Buscar lista de módulos
  const { data: modules, isLoading: modulesLoading } = useQuery({
    queryKey: ['/api/admin/modules'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/modules');
      if (!response.ok) {
        throw new Error('Erro ao carregar módulos');
      }
      return response.json();
    }
  });

  // Buscar relação de plano-módulos quando um plano é selecionado
  const { data: planModules, isLoading: planModulesLoading, refetch: refetchPlanModules } = useQuery({
    queryKey: ['/api/admin/plan-modules', selectedPlan?.id],
    queryFn: async () => {
      if (!selectedPlan) return [];
      
      const response = await apiRequest('GET', `/api/admin/plans/${selectedPlan.id}/modules`);
      if (!response.ok) {
        throw new Error('Erro ao carregar módulos do plano');
      }
      return response.json();
    },
    enabled: !!selectedPlan
  });

  // Schema para validação do formulário de plano
  const planSchema = z.object({
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    code: z.string().min(2, "Código deve ter pelo menos 2 caracteres"),
    description: z.string().min(1, "Descrição é obrigatória"),
    maxStorage: z.coerce.number().min(1, "Armazenamento deve ser no mínimo 1MB"),
    maxFileSize: z.coerce.number().min(1, "Tamanho máximo de arquivo deve ser no mínimo 1MB"),
    price: z.coerce.number().min(0, "Preço não pode ser negativo"),
  });

  // Schema para validação do formulário de módulo
  const moduleSchema = z.object({
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    code: z.string().min(2, "Código deve ter pelo menos 2 caracteres"),
    description: z.string().optional(),
  });

  // Configuração do formulário de plano
  const planForm = useForm<z.infer<typeof planSchema>>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      maxStorage: 2,
      maxFileSize: 2,
      price: 0,
    }
  });

  // Configuração do formulário de módulo
  const moduleForm = useForm<z.infer<typeof moduleSchema>>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
    }
  });

  // Configuração do formulário de associação de módulos ao plano
  const [moduleSelections, setModuleSelections] = useState<Record<number, boolean>>({});

  // Inicializar seleções de módulos quando planModules são carregados
  useState(() => {
    if (planModules && modules) {
      const selections: Record<number, boolean> = {};
      
      modules.forEach((module: any) => {
        selections[module.id] = planModules.some((pm: any) => pm.moduleId === module.id);
      });
      
      setModuleSelections(selections);
    }
  });

  // Mutação para criar novo plano
  const createPlanMutation = useMutation({
    mutationFn: async (data: z.infer<typeof planSchema>) => {
      const response = await apiRequest('POST', '/api/admin/plans', data);
      if (!response.ok) {
        throw new Error('Erro ao criar plano');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/plans'] });
      setOpenNewPlan(false);
      planForm.reset();
      toast({
        title: "Plano criado com sucesso",
        description: "O novo plano foi adicionado ao sistema",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar plano",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutação para criar novo módulo
  const createModuleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof moduleSchema>) => {
      const response = await apiRequest('POST', '/api/admin/modules', data);
      if (!response.ok) {
        throw new Error('Erro ao criar módulo');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/modules'] });
      setOpenNewModule(false);
      moduleForm.reset();
      toast({
        title: "Módulo criado com sucesso",
        description: "O novo módulo foi adicionado ao sistema",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar módulo",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutação para atualizar módulos do plano
  const updatePlanModulesMutation = useMutation({
    mutationFn: async ({ planId, moduleIds }: { planId: number, moduleIds: number[] }) => {
      const response = await apiRequest('PUT', `/api/admin/plans/${planId}/modules`, { moduleIds });
      if (!response.ok) {
        throw new Error('Erro ao atualizar módulos do plano');
      }
      // Se for 204 (No Content), não tente processar como JSON
      if (response.status === 204) {
        return null;
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/plan-modules'] });
      refetchPlanModules();
      setOpenPlanModuleEditor(false);
      toast({
        title: "Módulos atualizados",
        description: "Os módulos do plano foram atualizados com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar módulos",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutação para editar plano existente
  const editPlanMutation = useMutation({
    mutationFn: async (data: any) => {
      // Log dos dados sendo enviados para depuração
      console.log("Dados enviados para atualização:", data);
      
      const response = await apiRequest('PUT', `/api/admin/plans/${data.id}`, {
        price: data.price,
        storageLimit: data.maxStorage, // Alinhando com o nome usado no backend
        maxFileSize: data.maxFileSize,
        description: data.description
      });
      if (!response.ok) {
        throw new Error('Erro ao editar plano');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/plans'] });
      setOpenEditPlan(false);
      setPlanToEdit(null);
      toast({
        title: "Plano atualizado",
        description: "O plano foi atualizado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar plano",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutação para excluir plano
  const deletePlanMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/plans/${id}`);
      if (!response.ok) {
        throw new Error('Erro ao excluir plano');
      }
      // Se for 204 (No Content), não tente processar como JSON
      if (response.status === 204) {
        return null;
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/plans'] });
      setOpenDeletePlanDialog(false);
      toast({
        title: "Plano excluído",
        description: "O plano foi excluído com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir plano",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutação para excluir módulo
  const deleteModuleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/modules/${id}`);
      if (!response.ok) {
        throw new Error('Erro ao excluir módulo');
      }
      // Se for 204 (No Content), não tente processar como JSON
      if (response.status === 204) {
        return null;
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/modules'] });
      setOpenDeleteModuleDialog(false);
      toast({
        title: "Módulo excluído",
        description: "O módulo foi excluído com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir módulo",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Função para lidar com o envio do formulário de plano
  function onSubmitPlan(values: z.infer<typeof planSchema>) {
    createPlanMutation.mutate(values);
  }
  
  // Função para lidar com o envio do formulário de edição de plano
  function onSubmitEditPlan(values: z.infer<typeof planSchema>) {
    if (!planToEdit) return;
    
    // Garantir que descrição não seja vazia
    if (!values.description || values.description.trim() === "") {
      toast({
        title: "Erro ao atualizar plano",
        description: "A descrição é obrigatória",
        variant: "destructive",
      });
      return;
    }
    
    editPlanMutation.mutate({
      id: planToEdit.id,
      ...values
    });
  }

  // Função para lidar com o envio do formulário de módulo
  function onSubmitModule(values: z.infer<typeof moduleSchema>) {
    createModuleMutation.mutate(values);
  }

  // Função para lidar com o envio do formulário de módulos do plano
  function onSubmitPlanModules() {
    if (!selectedPlan) return;
    
    const moduleIds = Object.entries(moduleSelections)
      .filter(([_, isSelected]) => isSelected)
      .map(([moduleId]) => parseInt(moduleId));
    
    updatePlanModulesMutation.mutate({
      planId: selectedPlan.id,
      moduleIds,
    });
  }

  // Função para confirmar exclusão de plano
  function confirmDeletePlan() {
    if (planToDelete) {
      deletePlanMutation.mutate(planToDelete);
    }
  }

  // Função para confirmar exclusão de módulo
  function confirmDeleteModule() {
    if (moduleToDelete) {
      deleteModuleMutation.mutate(moduleToDelete);
    }
  }

  // Função para abrir o editor de módulos do plano
  function openModuleEditor(plan: any) {
    setSelectedPlan(plan);
    
    // Reinicializar as seleções
    if (modules) {
      const initialSelections: Record<number, boolean> = {};
      modules.forEach((module: any) => {
        initialSelections[module.id] = false;
      });
      setModuleSelections(initialSelections);
    }
    
    setOpenPlanModuleEditor(true);
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Gerenciamento de Planos e Módulos</h1>
            <p className="text-muted-foreground">
              Configure os planos e módulos disponíveis no sistema.
            </p>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="plans">Planos</TabsTrigger>
            <TabsTrigger value="modules">Módulos</TabsTrigger>
          </TabsList>
          
          {/* Aba de Planos */}
          <TabsContent value="plans">
            <div className="flex justify-end mb-4">
              <Dialog open={openNewPlan} onOpenChange={setOpenNewPlan}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Novo Plano
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Cadastrar Novo Plano</DialogTitle>
                    <DialogDescription>
                      Preencha as informações abaixo para cadastrar um novo plano no sistema.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...planForm}>
                    <form onSubmit={planForm.handleSubmit(onSubmitPlan)} className="space-y-4">
                      <FormField
                        control={planForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Plano</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Básico, Intermediário, Completo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={planForm.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: BASIC, INTER, COMPLETE" {...field} />
                            </FormControl>
                            <FormDescription>
                              Código único para identificação interna do plano.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={planForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descrição</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Descreva as características do plano" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={planForm.control}
                          name="maxStorage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Armazenamento Máximo (MB)</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormDescription>
                                Limite total de armazenamento em MB.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={planForm.control}
                          name="maxFileSize"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tamanho Máximo de Arquivo (MB)</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormDescription>
                                Tamanho máximo por arquivo em MB.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={planForm.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preço (R$)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button type="submit" disabled={createPlanMutation.isPending}>
                          {createPlanMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Cadastrar Plano
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Planos Cadastrados</CardTitle>
                <CardDescription>
                  Lista de planos disponíveis no sistema.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {plansLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : plans?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum plano cadastrado.
                  </div>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Código</TableHead>
                          <TableHead>Armazenamento</TableHead>
                          <TableHead>Tamanho Máx. Arquivo</TableHead>
                          <TableHead>Preço</TableHead>
                          <TableHead>Módulos</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {plans?.map((plan: any) => (
                          <TableRow key={plan.id}>
                            <TableCell className="font-medium">{plan.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{plan.code}</Badge>
                            </TableCell>
                            <TableCell>{plan.maxStorage} MB</TableCell>
                            <TableCell>{plan.maxFileSize} MB</TableCell>
                            <TableCell>R$ {typeof plan.price === 'number' ? plan.price.toFixed(2) : parseFloat(plan.price).toFixed(2)}</TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openModuleEditor(plan)}
                              >
                                Configurar Módulos
                              </Button>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setPlanToEdit(plan);
                                    // Reset o form com os valores atuais do plano
                                    planForm.reset({
                                      name: plan.name,
                                      code: plan.code,
                                      description: plan.description || "",
                                      maxStorage: plan.maxStorage || plan.storageLimit,
                                      maxFileSize: plan.maxFileSize || 2,
                                      price: parseFloat(plan.price),
                                    });
                                    setOpenEditPlan(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4 text-blue-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setPlanToDelete(plan.id);
                                    setOpenDeletePlanDialog(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Aba de Módulos */}
          <TabsContent value="modules">
            <div className="flex justify-end mb-4">
              <Dialog open={openNewModule} onOpenChange={setOpenNewModule}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Novo Módulo
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Cadastrar Novo Módulo</DialogTitle>
                    <DialogDescription>
                      Preencha as informações abaixo para cadastrar um novo módulo no sistema.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...moduleForm}>
                    <form onSubmit={moduleForm.handleSubmit(onSubmitModule)} className="space-y-4">
                      <FormField
                        control={moduleForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Módulo</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Rastreabilidade, Certificados Avançados" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={moduleForm.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: TRACE, ADV_CERT" {...field} />
                            </FormControl>
                            <FormDescription>
                              Código único para identificação interna do módulo.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={moduleForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descrição</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Descreva as funcionalidades deste módulo" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button type="submit" disabled={createModuleMutation.isPending}>
                          {createModuleMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Cadastrar Módulo
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Módulos Cadastrados</CardTitle>
                <CardDescription>
                  Lista de módulos funcionais disponíveis no sistema.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {modulesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : modules?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum módulo cadastrado.
                  </div>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Código</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {modules?.map((module: any) => (
                          <TableRow key={module.id}>
                            <TableCell className="font-medium">{module.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{module.code}</Badge>
                            </TableCell>
                            <TableCell className="max-w-md truncate">
                              {module.description || "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setModuleToDelete(module.id);
                                  setOpenDeleteModuleDialog(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Diálogo para edição de plano */}
      <Dialog open={openEditPlan} onOpenChange={(open) => {
        setOpenEditPlan(open);
        if (!open) setPlanToEdit(null);
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Plano</DialogTitle>
            <DialogDescription>
              Atualize as informações do plano {planToEdit?.name}.
            </DialogDescription>
          </DialogHeader>
          {planToEdit && (
            <Form {...planForm}>
              <form onSubmit={planForm.handleSubmit(onSubmitEditPlan)} className="space-y-4">
                <FormField
                  control={planForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva as características do plano" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={planForm.control}
                    name="maxStorage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Armazenamento Máximo (MB)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Limite total de armazenamento em MB.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={planForm.control}
                    name="maxFileSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tamanho Máximo de Arquivo (MB)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Tamanho máximo por arquivo em MB.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={planForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={editPlanMutation.isPending}>
                    {editPlanMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Atualizar Plano
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar módulos de um plano */}
      <Dialog open={openPlanModuleEditor} onOpenChange={setOpenPlanModuleEditor}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurar Módulos do Plano</DialogTitle>
            <DialogDescription>
              Selecione os módulos que estarão disponíveis para o plano {selectedPlan?.name}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {planModulesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              modules?.map((module: any) => (
                <div key={module.id} className="flex items-center space-x-2 border p-4 rounded-md">
                  <Checkbox
                    id={`module-${module.id}`}
                    checked={moduleSelections[module.id] || false}
                    onCheckedChange={(checked) => {
                      setModuleSelections({
                        ...moduleSelections,
                        [module.id]: !!checked,
                      });
                    }}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor={`module-${module.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {module.name}
                    </label>
                    <p className="text-sm text-muted-foreground">
                      {module.description || "Sem descrição"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={onSubmitPlanModules} disabled={updatePlanModulesMutation.isPending}>
              {updatePlanModulesMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Salvar Configuração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação para exclusão de plano */}
      <AlertDialog open={openDeletePlanDialog} onOpenChange={(open) => {
        setOpenDeletePlanDialog(open);
        if (!open) setPlanToDelete(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o plano e pode afetar tenants que o utilizam.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPlanToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePlan} className="bg-red-600 hover:bg-red-700">
              {deletePlanMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de confirmação para exclusão de módulo */}
      <AlertDialog open={openDeleteModuleDialog} onOpenChange={setOpenDeleteModuleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o módulo e pode afetar planos que o utilizam.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setModuleToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteModule} className="bg-red-600 hover:bg-red-700">
              {deleteModuleMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}