import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Edit, Plus, Trash2, Package, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Link } from "wouter";

const packageTypeSchema = z.object({
  name: z.string().min(1, "Nome do tipo de embalagem é obrigatório"),
  active: z.boolean().default(true),
});

type PackageTypeFormValues = z.infer<typeof packageTypeSchema>;

export default function PackageTypesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isAddPackageTypeDialogOpen, setIsAddPackageTypeDialogOpen] = useState(false);
  const [editingPackageType, setEditingPackageType] = useState<null | { id: number; name: string; active: boolean }>(null);
  
  // Fetch package types
  const { data: packageTypes = [], isLoading: isLoadingPackageTypes } = useQuery<any[]>({
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
  
  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" asChild>
              <Link to="/products">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Produtos
              </Link>
            </Button>
            <h1 className="text-2xl font-medium">Tipos de Embalagem</h1>
          </div>
          <Button onClick={() => setIsAddPackageTypeDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Tipo
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Gerenciar Tipos de Embalagem
            </CardTitle>
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
                  {packageTypes?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                        <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        Nenhum tipo de embalagem cadastrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    packageTypes?.map((packageType) => (
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
                    ))
                  )}
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
                    {(addPackageTypeMutation.isPending || updatePackageTypeMutation.isPending) && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {editingPackageType ? "Atualizar" : "Adicionar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}