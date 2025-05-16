import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, PlusCircle, Trash2, Pencil, Calendar, RefreshCw, LockIcon, UnlockIcon, CreditCard } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// Página de Administração de Tenants
export default function TenantsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [openNewTenant, setOpenNewTenant] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<number | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openEditPlanDialog, setOpenEditPlanDialog] = useState(false);
  const [tenantToEdit, setTenantToEdit] = useState<any>(null);
  
  // Estados para gerenciamento de assinatura
  const [openSubscriptionDialog, setOpenSubscriptionDialog] = useState(false);
  const [openRenewDialog, setOpenRenewDialog] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);

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

  // Buscar lista de tenants
  const tenantsQuery = useQuery({
    queryKey: ['/api/admin/tenants'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/tenants');
      if (!response.ok) {
        throw new Error('Erro ao carregar tenants');
      }
      return response.json();
    }
  });
  
  const { data: tenants, isLoading } = tenantsQuery;

  // Schema para validação do formulário
  const tenantSchema = z.object({
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    cnpj: z.string().min(14, "CNPJ deve ter 14 dígitos"),
    address: z.string().optional(),
    planId: z.coerce.number().min(1, "Selecione um plano"),
    active: z.boolean().default(true),
  });
  
  // Schema para edição de plano
  const planEditSchema = z.object({
    planId: z.coerce.number().min(1, "Selecione um plano"),
  });
  
  // Schema para renovação de assinatura
  const renewalSchema = z.object({
    paymentDate: z.string().optional(),
    durationMonths: z.coerce.number().min(1, "O período mínimo é de 1 mês").default(1),
  });

  // Configuração do formulário de renovação de assinatura
  const renewalForm = useForm<z.infer<typeof renewalSchema>>({
    resolver: zodResolver(renewalSchema),
    defaultValues: {
      durationMonths: 1,
    }
  });

  // Configuração do formulário de criação
  const form = useForm<z.infer<typeof tenantSchema>>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: "",
      cnpj: "",
      address: "",
      active: true,
    }
  });
  
  // Configuração do formulário de edição de plano
  const planEditForm = useForm<z.infer<typeof planEditSchema>>({
    resolver: zodResolver(planEditSchema),
    defaultValues: {
      planId: 0,
    }
  });

  // Mutação para criar novo tenant
  const createTenantMutation = useMutation({
    mutationFn: async (data: z.infer<typeof tenantSchema>) => {
      const response = await apiRequest('POST', '/api/admin/tenants', data);
      if (!response.ok) {
        throw new Error('Erro ao criar tenant');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenants'] });
      setOpenNewTenant(false);
      form.reset();
      toast({
        title: "Tenant criado com sucesso",
        description: "O novo tenant foi adicionado ao sistema",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar tenant",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutação para alternar status do tenant (ativo/inativo)
  const toggleTenantStatusMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number, active: boolean }) => {
      const response = await apiRequest('PATCH', `/api/admin/tenants/${id}`, { active });
      if (!response.ok) {
        throw new Error('Erro ao atualizar status');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenants'] });
      toast({
        title: "Status atualizado",
        description: "O status do tenant foi atualizado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutação para excluir tenant
  const deleteTenantMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/tenants/${id}`);
      if (!response.ok) {
        const errorText = await response.text().catch(() => "Erro desconhecido");
        throw new Error(errorText || 'Erro ao excluir tenant');
      }
      // Para respostas 204 No Content, não tentamos fazer response.json()
      if (response.status === 204) {
        return { success: true };
      }
      
      // Outras respostas de sucesso
      try {
        return await response.json();
      } catch (e) {
        return { success: true };
      }
    },
    onSuccess: () => {
      // Importante: invalidar a consulta para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenants'] });
      setOpenDeleteDialog(false);
      toast({
        title: "Tenant excluído",
        description: "O tenant foi excluído com sucesso",
      });
      
      // Forçar uma recarga da lista de tenants
      tenantsQuery.refetch();
    },
    onError: (error: any) => {
      console.error("Erro na exclusão do tenant:", error);
      toast({
        title: "Erro ao excluir tenant",
        description: error.message || "Não foi possível excluir o tenant",
        variant: "destructive",
      });
    }
  });
  
  // Mutação para atualizar plano do tenant
  const updateTenantPlanMutation = useMutation({
    mutationFn: async ({ id, planId }: { id: number, planId: number }) => {
      const response = await apiRequest('PATCH', `/api/admin/tenants/${id}`, { planId });
      if (!response.ok) {
        throw new Error('Erro ao atualizar plano');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenants'] });
      setOpenEditPlanDialog(false);
      setTenantToEdit(null);
      planEditForm.reset();
      toast({
        title: "Plano atualizado",
        description: "O plano do tenant foi atualizado com sucesso",
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
  
  // Mutação para obter detalhes da assinatura
  const getSubscriptionDetailsMutation = useMutation({
    mutationFn: async (tenantId: number) => {
      const response = await apiRequest('GET', `/api/admin/tenants/${tenantId}/subscription`);
      if (!response.ok) {
        throw new Error('Erro ao obter detalhes da assinatura');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setSelectedTenant(data);
      setOpenSubscriptionDialog(true);
    },
    onError: (error) => {
      toast({
        title: "Erro ao obter detalhes da assinatura",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutação para renovar assinatura
  const renewSubscriptionMutation = useMutation({
    mutationFn: async ({ tenantId, paymentDate, durationMonths }: { tenantId: number, paymentDate?: string, durationMonths?: number }) => {
      // Garantir que o durationMonths seja um número válido
      const duration = typeof durationMonths === 'number' && !isNaN(durationMonths) 
        ? durationMonths 
        : 1;
        
      const response = await apiRequest('POST', `/api/admin/tenants/${tenantId}/renew-subscription`, {
        paymentDate,
        durationMonths: duration
      });
      
      if (!response.ok) {
        throw new Error('Erro ao renovar assinatura');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenants'] });
      setOpenRenewDialog(false);
      setSelectedTenant(null);
      toast({
        title: "Assinatura renovada",
        description: "A assinatura foi renovada com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao renovar assinatura",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutação para bloquear tenant
  const blockTenantMutation = useMutation({
    mutationFn: async (tenantId: number) => {
      const response = await apiRequest('POST', `/api/admin/tenants/${tenantId}/block`);
      if (!response.ok) {
        throw new Error('Erro ao bloquear tenant');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenants'] });
      toast({
        title: "Tenant bloqueado",
        description: "O tenant foi bloqueado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao bloquear tenant",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutação para desbloquear tenant
  const unblockTenantMutation = useMutation({
    mutationFn: async (tenantId: number) => {
      const response = await apiRequest('POST', `/api/admin/tenants/${tenantId}/unblock`);
      if (!response.ok) {
        throw new Error('Erro ao desbloquear tenant');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenants'] });
      toast({
        title: "Tenant desbloqueado",
        description: "O tenant foi desbloqueado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao desbloquear tenant",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Função para lidar com o envio do formulário
  function onSubmit(values: z.infer<typeof tenantSchema>) {
    createTenantMutation.mutate(values);
  }

  // Função para confirmar exclusão
  function confirmDelete() {
    if (tenantToDelete) {
      deleteTenantMutation.mutate(tenantToDelete);
    }
  }
  
  // Função para abrir o diálogo de detalhes da assinatura
  function handleViewSubscription(tenant: any) {
    setSelectedTenant(tenant);
    getSubscriptionDetailsMutation.mutate(tenant.id);
  }
  
  // Função para abrir o diálogo de renovação de assinatura
  function handleRenewSubscription(tenant: any) {
    setSelectedTenant(tenant);
    renewalForm.reset({
      durationMonths: 1,
      paymentDate: new Date().toISOString().split('T')[0]
    });
    setOpenRenewDialog(true);
  }
  
  // Função para processar a renovação da assinatura
  function onRenewSubmit(values: z.infer<typeof renewalSchema>) {
    if (selectedTenant) {
      // Garantir que o tenant ID seja um número válido
      const tenantId = typeof selectedTenant.id === 'number' && !isNaN(selectedTenant.id)
        ? selectedTenant.id
        : (selectedTenant.tenantId || selectedTenant.id);
      
      renewSubscriptionMutation.mutate({
        tenantId,
        ...values
      });
    }
  }
  
  // Função para bloquear um tenant
  function handleBlockTenant(tenantId: number) {
    blockTenantMutation.mutate(tenantId);
  }
  
  // Função para desbloquear um tenant
  function handleUnblockTenant(tenantId: number) {
    unblockTenantMutation.mutate(tenantId);
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Gerenciamento de Tenants</h1>
            <p className="text-muted-foreground">
              Administre os tenants (empresas clientes) do sistema.
            </p>
          </div>
          <Dialog open={openNewTenant} onOpenChange={setOpenNewTenant}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Novo Tenant
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Tenant</DialogTitle>
                <DialogDescription>
                  Preencha as informações abaixo para cadastrar uma nova empresa no sistema.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Empresa</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da empresa" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ</FormLabel>
                        <FormControl>
                          <Input placeholder="CNPJ (apenas números)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Input placeholder="Endereço (opcional)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="planId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plano</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um plano" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {plansLoading ? (
                              <div className="flex justify-center p-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            ) : (
                              plans?.map((plan: any) => (
                                <SelectItem key={plan.id} value={plan.id.toString()}>
                                  {plan.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Ativo</FormLabel>
                          <FormDescription>
                            Determina se o tenant estará ativo no sistema.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={createTenantMutation.isPending}>
                      {createTenantMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Cadastrar Tenant
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tenants Cadastrados</CardTitle>
            <CardDescription>
              Lista de empresas cadastradas no sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : tenants?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum tenant cadastrado.
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Status Assinatura</TableHead>
                      <TableHead>Uso de Armazenamento</TableHead>
                      <TableHead>Próximo Pagamento</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenants?.map((tenant: any) => (
                      <TableRow key={tenant.id}>
                        <TableCell className="font-medium">{tenant.name}</TableCell>
                        <TableCell>{tenant.cnpj}</TableCell>
                        <TableCell>
                          {plans?.find((p: any) => p.id === tenant.planId)?.name || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Switch
                              checked={tenant.active}
                              onCheckedChange={(checked) => {
                                toggleTenantStatusMutation.mutate({
                                  id: tenant.id,
                                  active: checked,
                                });
                              }}
                              disabled={toggleTenantStatusMutation.isPending}
                              className="mr-2"
                            />
                            <Badge variant={tenant.active ? "default" : "secondary"}>
                              {tenant.active ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {tenant.paymentStatus && (
                            <Badge variant={
                              tenant.paymentStatus === "active" ? "default" :
                              tenant.paymentStatus === "pending" ? "outline" : "destructive"
                            }>
                              {tenant.paymentStatus === "active" ? "Em dia" :
                               tenant.paymentStatus === "pending" ? "Pendente" : "Atrasado"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {tenant.storageUsed} MB
                        </TableCell>
                        <TableCell>
                          {tenant.nextPaymentDate ? formatDate(new Date(tenant.nextPaymentDate)) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {/* Botão para visualizar detalhes da assinatura */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewSubscription(tenant)}
                              title="Detalhes da assinatura"
                            >
                              <CreditCard className="h-4 w-4 text-gray-500" />
                            </Button>
                            
                            {/* Botão para renovar assinatura */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRenewSubscription(tenant)}
                              title="Renovar assinatura"
                            >
                              <RefreshCw className="h-4 w-4 text-green-500" />
                            </Button>
                            
                            {/* Botão para bloquear/desbloquear tenant */}
                            {tenant.paymentStatus !== "overdue" ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleBlockTenant(tenant.id)}
                                title="Bloquear tenant"
                              >
                                <LockIcon className="h-4 w-4 text-orange-500" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleUnblockTenant(tenant.id)}
                                title="Desbloquear tenant"
                              >
                                <UnlockIcon className="h-4 w-4 text-green-500" />
                              </Button>
                            )}
                            
                            {/* Botão para editar plano */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setTenantToEdit(tenant);
                                planEditForm.setValue('planId', tenant.planId);
                                setOpenEditPlanDialog(true);
                              }}
                              title="Editar plano"
                            >
                              <Pencil className="h-4 w-4 text-blue-500" />
                            </Button>
                            
                            {/* Botão para excluir tenant */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setTenantToDelete(tenant.id);
                                setOpenDeleteDialog(true);
                              }}
                              title="Excluir tenant"
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
      </div>

      {/* Diálogo de confirmação para exclusão de tenant */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o tenant e todos os seus dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTenantToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              {deleteTenantMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Diálogo para edição de plano do tenant */}
      <Dialog open={openEditPlanDialog} onOpenChange={setOpenEditPlanDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Alterar Plano do Tenant</DialogTitle>
            <DialogDescription>
              {tenantToEdit && (
                <>
                  Selecione um novo plano para <strong>{tenantToEdit.name}</strong>.
                  <br />
                  Esta ação pode alterar as funcionalidades disponíveis para o tenant.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...planEditForm}>
            <form onSubmit={planEditForm.handleSubmit((values) => {
              if (tenantToEdit) {
                updateTenantPlanMutation.mutate({
                  id: tenantToEdit.id,
                  planId: values.planId
                });
              }
            })} className="space-y-4">
              <FormField
                control={planEditForm.control}
                name="planId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plano</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um plano" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {plansLoading ? (
                          <div className="flex justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : (
                          plans?.map((plan: any) => (
                            <SelectItem key={plan.id} value={plan.id.toString()}>
                              {plan.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpenEditPlanDialog(false);
                    setTenantToEdit(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateTenantPlanMutation.isPending}>
                  {updateTenantPlanMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Salvar Alteração
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para visualizar detalhes da assinatura */}
      <Dialog open={openSubscriptionDialog} onOpenChange={setOpenSubscriptionDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalhes da Assinatura</DialogTitle>
            <DialogDescription>
              Informações sobre a assinatura do tenant.
            </DialogDescription>
          </DialogHeader>
          
          {selectedTenant && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">Tenant</h3>
                  <p className="text-sm text-muted-foreground">{selectedTenant.tenantName}</p>
                </div>
                <div>
                  <h3 className="font-medium">Plano</h3>
                  <p className="text-sm text-muted-foreground">{selectedTenant.planName}</p>
                </div>
                <div>
                  <h3 className="font-medium">Status</h3>
                  <Badge variant={
                    selectedTenant.paymentStatus === "active" ? "default" :
                    selectedTenant.paymentStatus === "pending" ? "outline" : "destructive"
                  }>
                    {selectedTenant.paymentStatus === "active" ? "Em dia" :
                    selectedTenant.paymentStatus === "pending" ? "Pendente" : "Atrasado"}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-medium">Ativo</h3>
                  <Badge variant={selectedTenant.isActive ? "default" : "secondary"}>
                    {selectedTenant.isActive ? "Sim" : "Não"}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-medium">Último Pagamento</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedTenant.lastPaymentDate 
                      ? formatDate(new Date(selectedTenant.lastPaymentDate))
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Próximo Pagamento</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedTenant.nextPaymentDate 
                      ? formatDate(new Date(selectedTenant.nextPaymentDate))
                      : "N/A"}
                  </p>
                </div>
                {selectedTenant.daysToExpiration !== null && (
                  <div className="col-span-2">
                    <h3 className="font-medium">Dias até o vencimento</h3>
                    <Badge variant={
                      selectedTenant.daysToExpiration > 10 ? "default" :
                      selectedTenant.daysToExpiration > 5 ? "outline" : "destructive"
                    }>
                      {selectedTenant.daysToExpiration > 0 
                        ? `${selectedTenant.daysToExpiration} dias` 
                        : "Vencido"}
                    </Badge>
                  </div>
                )}
              </div>
              <Separator />
              <div className="flex justify-end gap-2">
                <Button 
                  onClick={() => {
                    setOpenSubscriptionDialog(false);
                    handleRenewSubscription(selectedTenant);
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Renovar Assinatura
                </Button>
                <DialogTrigger asChild>
                  <Button variant="outline">Fechar</Button>
                </DialogTrigger>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo para renovar assinatura */}
      <Dialog open={openRenewDialog} onOpenChange={setOpenRenewDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Renovar Assinatura</DialogTitle>
            <DialogDescription>
              Preencha os dados para renovar a assinatura do tenant.
            </DialogDescription>
          </DialogHeader>
          
          {selectedTenant && (
            <Form {...renewalForm}>
              <form onSubmit={renewalForm.handleSubmit(onRenewSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Tenant: {selectedTenant.name}</h3>
                  <h3 className="text-sm font-medium">Plano: {plans?.find((p: any) => p.id === selectedTenant.planId)?.name || "Não definido"}</h3>
                </div>
                
                <FormField
                  control={renewalForm.control}
                  name="paymentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data do Pagamento</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          placeholder="Data do pagamento" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={renewalForm.control}
                  name="durationMonths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração (meses)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1}
                          placeholder="Duração em meses" 
                          {...field} 
                          onChange={(e) => {
                            // Garantir que o valor seja sempre um número
                            const value = parseInt(e.target.value, 10);
                            field.onChange(isNaN(value) ? 1 : value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Número de meses a renovar a partir da data de pagamento
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={renewSubscriptionMutation.isPending}
                    className="w-full"
                  >
                    {renewSubscriptionMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Renovar Assinatura
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}