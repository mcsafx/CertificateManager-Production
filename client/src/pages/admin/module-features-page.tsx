import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { InsertModuleFeature, ModuleFeature, Module } from "@shared/schema";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const moduleFeatureFormSchema = z.object({
  moduleId: z.coerce.number().min(1, "Selecione um módulo"),
  featurePath: z.string().min(1, "Informe o caminho da funcionalidade"),
  featureName: z.string().min(1, "Informe o nome da funcionalidade"),
  description: z.string().min(1, "Forneça uma descrição"),
});

type ModuleFeatureFormValues = z.infer<typeof moduleFeatureFormSchema>;

export default function ModuleFeaturesPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<ModuleFeature | null>(null);
  const [activeTab, setActiveTab] = useState("modules");
  
  // Formulário para criar/editar funcionalidades
  const form = useForm<ModuleFeatureFormValues>({
    resolver: zodResolver(moduleFeatureFormSchema),
    defaultValues: {
      moduleId: 0,
      featurePath: "",
      featureName: "",
      description: "",
    },
  });
  
  // Carrega a lista de módulos
  const { data: modules = [], isLoading: isLoadingModules } = useQuery<Module[]>({
    queryKey: ["/api/modules"],
    queryFn: async () => {
      const response = await fetch("/api/modules");
      if (!response.ok) {
        throw new Error("Erro ao carregar módulos");
      }
      return response.json();
    },
  });
  
  // Carrega a lista de funcionalidades
  const { data: features = [], isLoading: isLoadingFeatures } = useQuery<ModuleFeature[]>({
    queryKey: ["/api/module-features"],
    queryFn: async () => {
      const response = await fetch("/api/module-features");
      if (!response.ok) {
        throw new Error("Erro ao carregar funcionalidades");
      }
      return response.json();
    },
  });
  
  // Mutation para criar uma nova funcionalidade
  const createFeatureMutation = useMutation({
    mutationFn: async (data: InsertModuleFeature) => {
      const response = await fetch("/api/module-features", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao criar funcionalidade");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Funcionalidade criada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/module-features"] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation para atualizar uma funcionalidade
  const updateFeatureMutation = useMutation({
    mutationFn: async (data: ModuleFeature) => {
      const response = await fetch(`/api/module-features/${data.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao atualizar funcionalidade");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Funcionalidade atualizada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/module-features"] });
      setIsEditDialogOpen(false);
      setSelectedFeature(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation para excluir uma funcionalidade
  const deleteFeatureMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/module-features/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao excluir funcionalidade");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Funcionalidade excluída com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/module-features"] });
      setIsDeleteDialogOpen(false);
      setSelectedFeature(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Manipuladores para o formulário de criação
  const onCreateSubmit = (data: ModuleFeatureFormValues) => {
    createFeatureMutation.mutate(data);
  };
  
  // Manipuladores para o formulário de edição
  const handleEdit = (feature: ModuleFeature) => {
    setSelectedFeature(feature);
    form.reset({
      moduleId: feature.moduleId,
      featurePath: feature.featurePath,
      featureName: feature.featureName,
      description: feature.description,
    });
    setIsEditDialogOpen(true);
  };
  
  const onEditSubmit = (data: ModuleFeatureFormValues) => {
    if (!selectedFeature) return;
    
    updateFeatureMutation.mutate({
      ...selectedFeature,
      ...data,
    });
  };
  
  // Manipuladores para exclusão
  const handleDelete = (feature: ModuleFeature) => {
    setSelectedFeature(feature);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (!selectedFeature) return;
    deleteFeatureMutation.mutate(selectedFeature.id);
  };
  
  // Definição das colunas da tabela de funcionalidades
  const featureColumns: ColumnDef<ModuleFeature>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="text-center">{row.getValue("id")}</div>,
    },
    {
      accessorKey: "featureName",
      header: "Nome da Funcionalidade",
    },
    {
      accessorKey: "featurePath",
      header: "Caminho",
      cell: ({ row }) => (
        <code className="rounded bg-muted px-1 py-0.5 text-sm">
          {row.getValue("featurePath")}
        </code>
      ),
    },
    {
      accessorKey: "moduleId",
      header: "Módulo",
      cell: ({ row }) => {
        const moduleId = row.getValue("moduleId") as number;
        const module = modules.find((m) => m.id === moduleId);
        return module ? (
          <Badge variant="outline" className="capitalize">
            {module.name}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Descrição",
      cell: ({ row }) => {
        const description = row.getValue("description") as string;
        return description.length > 50 
          ? `${description.substring(0, 50)}...` 
          : description;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const feature = row.original;
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(feature)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(feature)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];
  
  // Definição das colunas da tabela de módulos
  const moduleColumns: ColumnDef<Module>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="text-center">{row.getValue("id")}</div>,
    },
    {
      accessorKey: "name",
      header: "Nome do Módulo",
    },
    {
      accessorKey: "code",
      header: "Código",
      cell: ({ row }) => (
        <code className="rounded bg-muted px-1 py-0.5 text-sm">
          {row.getValue("code")}
        </code>
      ),
    },
    {
      accessorKey: "description",
      header: "Descrição",
      cell: ({ row }) => {
        const description = row.getValue("description") as string;
        return description.length > 50 
          ? `${description.substring(0, 50)}...` 
          : description;
      },
    },
    {
      accessorKey: "isCore",
      header: "Core",
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Switch
            checked={row.getValue("isCore") as boolean}
            disabled
            className="cursor-not-allowed"
          />
        </div>
      ),
    },
    {
      accessorKey: "active",
      header: "Ativo",
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Switch 
            checked={row.getValue("active") as boolean}
            disabled
            className="cursor-not-allowed"
          />
        </div>
      ),
    },
    {
      id: "features",
      header: "Funcionalidades",
      cell: ({ row }) => {
        const moduleId = row.original.id;
        const featureCount = features.filter(f => f.moduleId === moduleId).length;
        return (
          <Badge variant="secondary">
            {featureCount}
          </Badge>
        );
      },
    },
  ];
  
  return (
    <AdminLayout>
      <div className="flex flex-col gap-8 p-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Módulos e Funcionalidades</h1>
          <p className="text-muted-foreground">
            Gerencie os módulos do sistema e suas funcionalidades associadas.
          </p>
        </div>
        
        <Tabs defaultValue="modules" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="modules">Módulos</TabsTrigger>
              <TabsTrigger value="features">Funcionalidades</TabsTrigger>
            </TabsList>
            
            {activeTab === "features" && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Funcionalidade
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Nova Funcionalidade</DialogTitle>
                    <DialogDescription>
                      Adicione uma nova funcionalidade a um módulo existente.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="moduleId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Módulo</FormLabel>
                            <Select 
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              defaultValue={field.value.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um módulo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {modules.map((module) => (
                                  <SelectItem key={module.id} value={module.id.toString()}>
                                    {module.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="featureName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome da Funcionalidade</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Emissão de Certificados" {...field} />
                            </FormControl>
                            <FormDescription>
                              Nome descritivo da funcionalidade.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="featurePath"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Caminho da Funcionalidade</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: certificates/issue" {...field} />
                            </FormControl>
                            <FormDescription>
                              Caminho usado para verificar permissões de acesso.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descrição</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Descreva a funcionalidade..." 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsCreateDialogOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit"
                          disabled={createFeatureMutation.isPending}
                        >
                          {createFeatureMutation.isPending ? "Criando..." : "Criar"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          <TabsContent value="modules" className="space-y-4">
            <DataTable
              columns={moduleColumns}
              data={modules}
              searchColumn="name"
              searchPlaceholder="Buscar módulos..."
              isLoading={isLoadingModules}
            />
          </TabsContent>
          
          <TabsContent value="features" className="space-y-4">
            <DataTable
              columns={featureColumns}
              data={features}
              searchColumn="featureName"
              searchPlaceholder="Buscar funcionalidades..."
              isLoading={isLoadingFeatures}
            />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Diálogo de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Funcionalidade</DialogTitle>
            <DialogDescription>
              Modifique os detalhes da funcionalidade selecionada.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="moduleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Módulo</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                      value={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um módulo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {modules.map((module) => (
                          <SelectItem key={module.id} value={module.id.toString()}>
                            {module.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="featureName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Funcionalidade</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="featurePath"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Caminho da Funcionalidade</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      Caminho usado para verificar permissões de acesso.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={updateFeatureMutation.isPending}
                >
                  {updateFeatureMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de Exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a funcionalidade{" "}
              <strong>{selectedFeature?.featureName}</strong>?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteFeatureMutation.isPending}
            >
              {deleteFeatureMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}