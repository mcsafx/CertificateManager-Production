import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Loader2, 
  User, 
  Building, 
  Shield, 
  Upload, 
  Edit, 
  Plus, 
  Trash2,
  UserPlus,
  Key
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const userProfileSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  username: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres"),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine(data => {
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  return true;
}, {
  message: "Senha atual é obrigatória para alterar a senha",
  path: ["currentPassword"],
}).refine(data => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

const tenantProfileSchema = z.object({
  name: z.string().min(1, "Nome da empresa é obrigatório"),
  cnpj: z.string().min(14, "CNPJ deve ter pelo menos 14 dígitos"),
  address: z.string().min(1, "Endereço é obrigatório"),
});

const newUserSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  username: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(1, "Confirme a senha"),
  role: z.string().min(1, "Perfil é obrigatório"),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type UserProfileFormValues = z.infer<typeof userProfileSchema>;
type TenantProfileFormValues = z.infer<typeof tenantProfileSchema>;
type NewUserFormValues = z.infer<typeof newUserSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  
  // User profile form
  const userProfileForm = useForm<UserProfileFormValues>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      name: user?.name || "",
      username: user?.username || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Tenant profile form
  const tenantProfileForm = useForm<TenantProfileFormValues>({
    resolver: zodResolver(tenantProfileSchema),
    defaultValues: {
      name: "",
      cnpj: "",
      address: "",
    },
  });
  
  // New user form
  const newUserForm = useForm<NewUserFormValues>({
    resolver: zodResolver(newUserSchema),
    defaultValues: {
      name: "",
      username: "",
      password: "",
      confirmPassword: "",
      role: "user",
    },
  });
  
  // Fetch tenant data
  const { data: tenant, isLoading: isLoadingTenant } = useQuery({
    queryKey: [`/api/tenants/${user?.tenantId}`],
    enabled: !!user?.tenantId,
  });
  
  // Fetch users for tenant
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users"],
    enabled: !!user,
  });
  
  // Update tenant profile
  const updateTenantMutation = useMutation({
    mutationFn: async (data: TenantProfileFormValues) => {
      await apiRequest("PATCH", `/api/tenants/${user?.tenantId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${user?.tenantId}`] });
      toast({
        title: "Perfil da empresa atualizado",
        description: "Os dados da empresa foram atualizados com sucesso.",
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
  
  // Update user profile
  const updateUserProfileMutation = useMutation({
    mutationFn: async (data: UserProfileFormValues) => {
      const payload = {
        name: data.name,
        username: data.username,
        ...(data.newPassword ? { 
          currentPassword: data.currentPassword,
          newPassword: data.newPassword 
        } : {})
      };
      
      await apiRequest("PATCH", `/api/users/${user?.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Perfil atualizado",
        description: "Seu perfil foi atualizado com sucesso.",
      });
      userProfileForm.reset({
        name: user?.name || "",
        username: user?.username || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
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
  
  // Add new user
  const addUserMutation = useMutation({
    mutationFn: async (data: NewUserFormValues) => {
      const payload = {
        name: data.name,
        username: data.username,
        password: data.password,
        role: data.role,
        tenantId: user?.tenantId,
        active: true,
      };
      
      await apiRequest("POST", "/api/register", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsAddUserDialogOpen(false);
      newUserForm.reset();
      toast({
        title: "Usuário adicionado",
        description: "O novo usuário foi adicionado com sucesso.",
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
  
  // Update tenant form when data is loaded
  useEffect(() => {
    if (tenant) {
      tenantProfileForm.reset({
        name: tenant.name,
        cnpj: tenant.cnpj,
        address: tenant.address,
      });
    }
  }, [tenant, tenantProfileForm]);
  
  // Update user form when user data changes
  useEffect(() => {
    if (user) {
      userProfileForm.reset({
        name: user.name,
        username: user.username,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [user, userProfileForm]);
  
  // Handle tenant profile form submit
  const onTenantProfileSubmit = (data: TenantProfileFormValues) => {
    updateTenantMutation.mutate(data);
  };
  
  // Handle user profile form submit
  const onUserProfileSubmit = (data: UserProfileFormValues) => {
    updateUserProfileMutation.mutate(data);
  };
  
  // Handle new user form submit
  const onNewUserSubmit = (data: NewUserFormValues) => {
    addUserMutation.mutate(data);
  };
  
  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-medium">Configurações</h1>
        </div>
        
        <Tabs defaultValue="company" className="space-y-6">
          <TabsList className="mb-6">
            <TabsTrigger value="company" className="flex items-center">
              <Building className="h-4 w-4 mr-2" />
              Empresa
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              Seu Perfil
            </TabsTrigger>
            {user?.role === "admin" && (
              <TabsTrigger value="users" className="flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Usuários
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>Perfil da Empresa</CardTitle>
                <CardDescription>
                  Atualize as informações da sua empresa que serão usadas nos boletins emitidos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTenant ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Form {...tenantProfileForm}>
                    <form onSubmit={tenantProfileForm.handleSubmit(onTenantProfileSubmit)} className="space-y-6">
                      <div className="flex items-center justify-center mb-6">
                        <div className="relative">
                          <div className="w-32 h-32 bg-gray-200 rounded-md flex items-center justify-center">
                            {tenant?.logoUrl ? (
                              <img 
                                src={tenant.logoUrl} 
                                alt="Logo da empresa" 
                                className="max-w-full max-h-full p-2"
                              />
                            ) : (
                              <Building className="h-16 w-16 text-gray-400" />
                            )}
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="absolute bottom-0 right-0 rounded-full"
                            type="button"
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <FormField
                        control={tenantProfileForm.control}
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
                        control={tenantProfileForm.control}
                        name="cnpj"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CNPJ</FormLabel>
                            <FormControl>
                              <Input placeholder="00.000.000/0000-00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={tenantProfileForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Endereço</FormLabel>
                            <FormControl>
                              <Input placeholder="Endereço completo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end">
                        <Button 
                          type="submit"
                          disabled={updateTenantMutation.isPending}
                        >
                          {updateTenantMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            "Salvar Alterações"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Seu Perfil</CardTitle>
                <CardDescription>
                  Atualize suas informações pessoais e senha.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...userProfileForm}>
                  <form onSubmit={userProfileForm.handleSubmit(onUserProfileSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={userProfileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo</FormLabel>
                            <FormControl>
                              <Input placeholder="Seu nome completo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={userProfileForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome de Usuário</FormLabel>
                            <FormControl>
                              <Input placeholder="Seu nome de usuário" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="pt-4 border-t">
                      <h3 className="text-sm font-medium text-gray-500 mb-4">Alterar Senha</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField
                          control={userProfileForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Senha Atual</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Sua senha atual" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={userProfileForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nova Senha</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Nova senha" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={userProfileForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirmar Nova Senha</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Confirme a nova senha" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit"
                        disabled={updateUserProfileMutation.isPending}
                      >
                        {updateUserProfileMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          "Salvar Alterações"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {user?.role === "admin" && (
            <TabsContent value="users">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Gerenciar Usuários</CardTitle>
                    <CardDescription>
                      Adicione e gerencie usuários com acesso ao sistema.
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsAddUserDialogOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Novo Usuário
                  </Button>
                </CardHeader>
                <CardContent>
                  {isLoadingUsers ? (
                    <div className="flex justify-center items-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Usuário</TableHead>
                          <TableHead>Perfil</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users?.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>
                              {user.role === "admin" ? (
                                <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                                  Administrador
                                </Badge>
                              ) : (
                                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                  Usuário
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {user.active ? (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                  Ativo
                                </Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                                  Inativo
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Key className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
              
              <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                <DialogContent className="sm:max-w-[550px]">
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                  </DialogHeader>
                  
                  <Form {...newUserForm}>
                    <form onSubmit={newUserForm.handleSubmit(onNewUserSubmit)} className="space-y-4">
                      <FormField
                        control={newUserForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome completo do usuário" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={newUserForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome de Usuário</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome de usuário para login" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={newUserForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Senha</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Senha" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={newUserForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirmar Senha</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Confirme a senha" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={newUserForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Perfil</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o perfil" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="user">Usuário</SelectItem>
                                <SelectItem value="admin">Administrador</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAddUserDialogOpen(false)}
                          disabled={addUserMutation.isPending}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit"
                          disabled={addUserMutation.isPending}
                        >
                          {addUserMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            "Adicionar Usuário"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </Layout>
  );
}
