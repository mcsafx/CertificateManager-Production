import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import AdminLayout from "@/components/layout/admin-layout";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Loader2,
  MoreHorizontal,
  User,
  Shield,
  Building,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

// Esquema para edição do usuário
const userEditSchema = z.object({
  username: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres"),
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido").optional().nullable(),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional(),
  role: z.enum(["admin", "tenant_admin", "user"]),
  active: z.boolean().default(true)
});

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [userToEdit, setUserToEdit] = useState<any | null>(null);
  const queryClient = useQueryClient();

  // Buscar todos os usuários
  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/users");
      if (!response.ok) {
        throw new Error("Erro ao carregar usuários");
      }
      return response.json();
    },
  });

  // Filtrar usuários por termo de pesquisa
  const filteredUsers = users
    ? users.filter(
        (user: any) =>
          user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.tenantName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Configuração do formulário de edição
  const form = useForm<z.infer<typeof userEditSchema>>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      username: "",
      name: "",
      email: "",
      password: "",
      role: "user",
      active: true
    }
  });
  
  // Mutação para atualizar usuários
  const updateUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PUT', `/api/admin/users/${data.id}`, {
        username: data.username,
        name: data.name,
        email: data.email,
        password: data.password || undefined, // Apenas enviar se tiver valor
        role: data.role,
        active: data.active
      });
      if (!response.ok) {
        throw new Error('Erro ao atualizar usuário');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setOpenEditDialog(false);
      setUserToEdit(null);
      toast({
        title: "Usuário atualizado",
        description: "O usuário foi atualizado com sucesso."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Função para abrir diálogo de edição
  function openEditUserDialog(user: any) {
    setUserToEdit(user);
    form.reset({
      username: user.username,
      name: user.name,
      email: user.email || "",
      password: "", // Não preencher a senha
      role: user.role,
      active: user.active
    });
    setOpenEditDialog(true);
  }
  
  // Função para lidar com o envio do formulário
  function onSubmitEditUser(values: z.infer<typeof userEditSchema>) {
    if (!userToEdit) return;
    
    updateUserMutation.mutate({
      id: userToEdit.id,
      ...values
    });
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Usuários</h1>
            <p className="text-muted-foreground">
              Gerencie todos os usuários do sistema.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Todos os Usuários</CardTitle>
            <CardDescription>
              Visualize e gerencie todos os usuários de todos os tenants.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filtros e pesquisa */}
            <div className="flex items-center py-4">
              <Input
                placeholder="Pesquisar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">
                        <p className="text-muted-foreground">
                          Nenhum usuário encontrado.
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span>{user.tenantName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.role === "admin" ? (
                            <Badge variant="outline" className="bg-red-50">
                              <Shield className="h-3 w-3 mr-1 text-red-500" />
                              Admin
                            </Badge>
                          ) : user.role === "tenant_admin" ? (
                            <Badge variant="outline" className="bg-amber-50">
                              <Shield className="h-3 w-3 mr-1 text-amber-500" />
                              Admin Tenant
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-slate-50">
                              Usuário
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Abrir menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => openEditUserDialog(user)}
                              >
                                Editar usuário
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  // Atualizar apenas o status ativo/inativo
                                  updateUserMutation.mutate({
                                    id: user.id,
                                    active: !user.active,
                                    username: user.username,
                                    name: user.name,
                                    email: user.email,
                                    role: user.role
                                  });
                                }}
                              >
                                {user.active ? "Desativar" : "Ativar"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  // Abrir formulário com foco na senha
                                  openEditUserDialog(user);
                                  setTimeout(() => {
                                    const passwordInput = document.getElementById('password');
                                    if (passwordInput) {
                                      passwordInput.focus();
                                    }
                                  }, 100);
                                }}
                              >
                                Redefinir senha
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Diálogo de edição de usuário */}
      <Dialog open={openEditDialog} onOpenChange={(open) => {
        setOpenEditDialog(open);
        if (!open) setUserToEdit(null);
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              {userToEdit ? (
                <>Edite os dados do usuário <span className="font-medium">{userToEdit.username}</span></>
              ) : (
                'Edite os dados do usuário'
              )}
            </DialogDescription>
          </DialogHeader>
          
          {userToEdit && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitEditUser)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome de Usuário</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        Nome de usuário para login no sistema
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova Senha</FormLabel>
                      <FormControl>
                        <Input 
                          id="password"
                          type="password" 
                          placeholder="Deixe em branco para manter a senha atual" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Deixe em branco para manter a senha atual
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Função</FormLabel>
                      <Select 
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma função" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Administrador do Sistema</SelectItem>
                          <SelectItem value="tenant_admin">Administrador do Tenant</SelectItem>
                          <SelectItem value="user">Usuário Regular</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        A função determina as permissões do usuário no sistema
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Usuário Ativo</FormLabel>
                        <FormDescription>
                          Quando desativado, o usuário não poderá acessar o sistema
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
                  <Button 
                    type="submit" 
                    disabled={updateUserMutation.isPending}
                  >
                    {updateUserMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Salvar alterações
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