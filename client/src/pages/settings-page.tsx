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
  Key,
  Package
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SafeSelectItem } from "@/components/ui/safe-select-item";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

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
  phone: z.string().optional(),
  address: z.string().min(1, "Endereço é obrigatório"),
});

const newUserSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  username: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(1, "Confirme a senha"),
  role: z.string().min(1, "Perfil é obrigatório"),
  tenantId: z.string().optional(), // Only for admin users
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

const packageTypeSchema = z.object({
  name: z.string().min(1, "Nome do tipo de embalagem é obrigatório"),
  active: z.boolean().default(true),
});

type UserProfileFormValues = z.infer<typeof userProfileSchema>;
type TenantProfileFormValues = z.infer<typeof tenantProfileSchema>;
type NewUserFormValues = z.infer<typeof newUserSchema>;
type PackageTypeFormValues = z.infer<typeof packageTypeSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isAddPackageTypeDialogOpen, setIsAddPackageTypeDialogOpen] = useState(false);
  const [editingPackageType, setEditingPackageType] = useState<null | { id: number; name: string; active: boolean }>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
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
      phone: "",
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
    queryKey: ["/api/tenant/profile"],
    enabled: !!user?.tenantId,
  });
  
  // Fetch users for tenant
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: user?.role === "admin" ? ["/api/admin/users"] : ["/api/tenant/users"],
    queryFn: () => apiRequest(user?.role === "admin" ? "/api/admin/users" : "/api/tenant/users"),
    enabled: !!user && (user.role === "admin" || user.role === "admin_tenant"),
  });

  // Fetch user limits for tenant admins
  const { data: userLimits, isLoading: isLoadingLimits } = useQuery({
    queryKey: ["/api/tenant/user-limits"],
    queryFn: () => apiRequest("/api/tenant/user-limits"),
    enabled: !!user && user.role === "admin_tenant",
  });
  
  // Fetch package types
  const { data: packageTypes, isLoading: isLoadingPackageTypes } = useQuery({
    queryKey: ["/api/package-types"],
    enabled: !!user?.tenantId,
  });
  
  // Package type form
  const packageTypeForm = useForm<PackageTypeFormValues>({
    resolver: zodResolver(packageTypeSchema),
    defaultValues: {
      name: "",
      active: true,
    },
  });
  
  // Update tenant profile
  const updateTenantMutation = useMutation({
    mutationFn: async (data: TenantProfileFormValues) => {
      await apiRequest("PATCH", "/api/tenant/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/profile"] });
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
      const endpoint = user?.role === "admin" ? "/api/admin/users" : "/api/tenant/users";
      const payload = user?.role === "admin" ? {
        name: data.name,
        username: data.username,
        password: data.password,
        role: data.role,
        tenantId: data.tenantId || user?.tenantId,
        active: true,
      } : {
        name: data.name,
        username: data.username,
        password: data.password,
        role: data.role,
        active: true,
      };
      
      await apiRequest("POST", endpoint, payload);
    },
    onSuccess: () => {
      const queryKey = user?.role === "admin" ? ["/api/admin/users"] : ["/api/tenant/users"];
      queryClient.invalidateQueries({ queryKey });
      if (user?.role === "admin_tenant") {
        queryClient.invalidateQueries({ queryKey: ["/api/tenant/user-limits"] });
      }
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
        phone: tenant.phone || '',
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
  
  // Add package type mutation
  const addPackageTypeMutation = useMutation({
    mutationFn: async (data: PackageTypeFormValues) => {
      const payload = {
        ...data,
        tenantId: user?.tenantId,
      };
      
      await apiRequest("POST", "/api/package-types", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/package-types"] });
      setIsAddPackageTypeDialogOpen(false);
      packageTypeForm.reset({ name: "", active: true });
      setEditingPackageType(null);
      toast({
        title: "Tipo de embalagem adicionado",
        description: "O tipo de embalagem foi adicionado com sucesso.",
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
  
  // Update package type mutation
  const updatePackageTypeMutation = useMutation({
    mutationFn: async (data: PackageTypeFormValues & { id: number }) => {
      const { id, ...rest } = data;
      await apiRequest("PATCH", `/api/package-types/${id}`, rest);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/package-types"] });
      setIsAddPackageTypeDialogOpen(false);
      packageTypeForm.reset({ name: "", active: true });
      setEditingPackageType(null);
      toast({
        title: "Tipo de embalagem atualizado",
        description: "O tipo de embalagem foi atualizado com sucesso.",
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
  
  // Delete package type mutation
  const deletePackageTypeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/package-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/package-types"] });
      toast({
        title: "Tipo de embalagem removido",
        description: "O tipo de embalagem foi removido com sucesso.",
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
  
  // Handle edit package type
  const handleEditPackageType = (packageType: { id: number; name: string; active: boolean }) => {
    setEditingPackageType(packageType);
    packageTypeForm.reset({
      name: packageType.name,
      active: packageType.active,
    });
    setIsAddPackageTypeDialogOpen(true);
  };
  
  // Handle delete package type
  const handleDeletePackageType = (id: number) => {
    if (confirm("Você realmente deseja remover este tipo de embalagem?")) {
      deletePackageTypeMutation.mutate(id);
    }
  };
  
  // Handle package type form submit
  const onPackageTypeFormSubmit = (data: PackageTypeFormValues) => {
    if (editingPackageType) {
      updatePackageTypeMutation.mutate({ ...data, id: editingPackageType.id });
    } else {
      addPackageTypeMutation.mutate(data);
    }
  };
  
  // Upload da logomarca
  const uploadLogoMutation = useMutation({
    mutationFn: async (logoUrl: string) => {
      await apiRequest("PATCH", "/api/tenant/profile", {
        logoUrl
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/profile"] });
      toast({
        title: "Logomarca atualizada",
        description: "A logomarca da empresa foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar logomarca",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Função para lidar com o upload da logomarca
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Verificar o tamanho do arquivo (limite de 2MB para plano básico)
      const sizeInMB = file.size / (1024 * 1024);
      if (sizeInMB > 2) {
        toast({
          title: "Arquivo muito grande",
          description: "O tamanho máximo permitido é de 2MB.",
          variant: "destructive",
        });
        return;
      }

      // Criar uma URL temporária para preview
      const logoUrl = URL.createObjectURL(file);
      setLogoPreview(logoUrl);

      // Em um ambiente de produção real, você faria o upload do arquivo
      // Para este exemplo, usamos DataURL (Base64)
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          // Simular o URL que seria retornado pelo servidor após upload
          const simulatedServerUrl = reader.result;
          uploadLogoMutation.mutate(simulatedServerUrl);
        }
      };
      reader.readAsDataURL(file);
    }
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

            <TabsTrigger value="package-types" className="flex items-center">
              <Package className="h-4 w-4 mr-2" />
              Tipos de Embalagem
            </TabsTrigger>
            
            {(user?.role === "admin" || user?.role === "admin_tenant") && (
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
                            {logoPreview || tenant?.logoUrl ? (
                              <img 
                                src={logoPreview || tenant?.logoUrl} 
                                alt="Logo da empresa" 
                                className="max-w-full max-h-full p-2"
                              />
                            ) : (
                              <Building className="h-16 w-16 text-gray-400" />
                            )}
                          </div>
                          <div className="absolute bottom-0 right-0 flex gap-1">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="rounded-full"
                              type="button"
                              onClick={() => {
                                if (confirm('Deseja remover a logomarca?')) {
                                  uploadLogoMutation.mutate('');
                                  setLogoPreview(null);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="rounded-full"
                              type="button"
                              onClick={() => document.getElementById('logo-upload')?.click()}
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                          </div>
                          <input
                            id="logo-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLogoUpload}
                          />
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
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input placeholder="(00) 0000-0000" {...field} />
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
          
          <TabsContent value="package-types">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Tipos de Embalagem</CardTitle>
                  <CardDescription>
                    Gerenciar os tipos de embalagem utilizados nos certificados.
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddPackageTypeDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Tipo
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingPackageTypes ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {packageTypes?.map((packageType) => (
                        <TableRow key={packageType.id}>
                          <TableCell className="font-medium">{packageType.name}</TableCell>
                          <TableCell>
                            {packageType.active ? (
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
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditPackageType(packageType)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeletePackageType(packageType.id)}
                            >
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
            
            <Dialog open={isAddPackageTypeDialogOpen} onOpenChange={setIsAddPackageTypeDialogOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingPackageType ? "Editar Tipo de Embalagem" : "Adicionar Tipo de Embalagem"}
                  </DialogTitle>
                </DialogHeader>
                <Form {...packageTypeForm}>
                  <form onSubmit={packageTypeForm.handleSubmit(onPackageTypeFormSubmit)} className="space-y-4">
                    <FormField
                      control={packageTypeForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do tipo de embalagem" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={packageTypeForm.control}
                      name="active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Ativo</FormLabel>
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
                    
                    <div className="flex justify-end gap-3 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setIsAddPackageTypeDialogOpen(false);
                          setEditingPackageType(null);
                          packageTypeForm.reset();
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit"
                        disabled={addPackageTypeMutation.isPending || updatePackageTypeMutation.isPending}
                      >
                        {(addPackageTypeMutation.isPending || updatePackageTypeMutation.isPending) ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          editingPackageType ? "Atualizar" : "Adicionar"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </TabsContent>
          
          {(user?.role === "admin" || user?.role === "admin_tenant") && (
            <TabsContent value="users">
              {/* Alert com informações do plano para admin_tenant */}
              {user?.role === "admin_tenant" && userLimits && (
                <div className="mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-blue-800 mb-2">Informações do Plano</h3>
                    <div className="text-sm text-blue-700">
                      <p><strong>Plano:</strong> {userLimits.planName} ({userLimits.planCode})</p>
                      <p><strong>Usuários:</strong> {userLimits.currentUsers}/{userLimits.maxUsers}</p>
                      <p><strong>Tenant:</strong> {userLimits.tenantName}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Gerenciar Usuários</CardTitle>
                    <CardDescription>
                      {user?.role === "admin" 
                        ? "Adicione e gerencie usuários com acesso ao sistema." 
                        : "Gerencie os usuários do seu tenant."
                      }
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => setIsAddUserDialogOpen(true)}
                    disabled={user?.role === "admin_tenant" && userLimits && !userLimits.canAddUser}
                  >
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
                                  Admin Global
                                </Badge>
                              ) : user.role === "admin_tenant" ? (
                                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                  Admin Tenant
                                </Badge>
                              ) : (
                                <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
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
                                <SafeSelectItem value="user">Usuário</SafeSelectItem>
                                {user?.role === "admin" && (
                                  <>
                                    <SafeSelectItem value="admin_tenant">Admin Tenant</SafeSelectItem>
                                    <SafeSelectItem value="admin">Admin Global</SafeSelectItem>
                                  </>
                                )}
                                {user?.role === "admin_tenant" && (
                                  <SafeSelectItem value="admin_tenant">Admin Tenant</SafeSelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Campo tenantId apenas para administradores globais */}
                      {user?.role === "admin" && (
                        <FormField
                          control={newUserForm.control}
                          name="tenantId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tenant ID (apenas para admin global)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="ID do tenant (deixe vazio para usar o seu)" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      
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
