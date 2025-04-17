import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

type Module = {
  id: number;
  name: string;
  code: string;
  description: string;
  isCore: boolean;
  active: boolean;
  createdAt: string;
};

type ModuleFeature = {
  id: number;
  moduleId: number;
  featurePath: string;
  featureName: string;
  description: string;
  createdAt: string;
};

const featureSchema = z.object({
  moduleId: z.coerce.number().min(1, "Selecione um módulo"),
  featurePath: z.string().min(1, "Caminho da funcionalidade é obrigatório"),
  featureName: z.string().min(1, "Nome da funcionalidade é obrigatório"),
  description: z.string().optional(),
});

export default function ModuleFeaturesPage() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<ModuleFeature | null>(null);
  
  // Buscar módulos
  const { data: modules = [] } = useQuery<Module[]>({
    queryKey: ["/api/admin/modules"],
  });
  
  // Buscar funcionalidades
  const { data: features = [], isLoading: featuresLoading } = useQuery<ModuleFeature[]>({
    queryKey: ["/api/admin/module-features"],
  });
  
  // Form para adicionar/editar funcionalidade
  const form = useForm<z.infer<typeof featureSchema>>({
    resolver: zodResolver(featureSchema),
    defaultValues: {
      moduleId: 0,
      featurePath: "",
      featureName: "",
      description: "",
    },
  });
  
  // Mutation para adicionar funcionalidade
  const addFeatureMutation = useMutation({
    mutationFn: async (data: z.infer<typeof featureSchema>) => {
      const res = await apiRequest("POST", "/api/admin/module-features", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/module-features"] });
      form.reset();
      setIsOpen(false);
      toast({
        title: "Funcionalidade adicionada",
        description: "A funcionalidade foi adicionada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar funcionalidade",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation para editar funcionalidade
  const updateFeatureMutation = useMutation({
    mutationFn: async (data: z.infer<typeof featureSchema> & { id: number }) => {
      const { id, ...featureData } = data;
      const res = await apiRequest("PUT", `/api/admin/module-features/${id}`, featureData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/module-features"] });
      form.reset();
      setEditingFeature(null);
      setIsOpen(false);
      toast({
        title: "Funcionalidade atualizada",
        description: "A funcionalidade foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar funcionalidade",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation para excluir funcionalidade
  const deleteFeatureMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/module-features/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/module-features"] });
      toast({
        title: "Funcionalidade excluída",
        description: "A funcionalidade foi excluída com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir funcionalidade",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handler para abrir o modal de edição
  const handleEditFeature = (feature: ModuleFeature) => {
    setEditingFeature(feature);
    form.reset({
      moduleId: feature.moduleId,
      featurePath: feature.featurePath,
      featureName: feature.featureName,
      description: feature.description,
    });
    setIsOpen(true);
  };
  
  // Handler para abrir o modal de adição
  const handleAddFeature = () => {
    setEditingFeature(null);
    form.reset({
      moduleId: 0,
      featurePath: "",
      featureName: "",
      description: "",
    });
    setIsOpen(true);
  };
  
  // Handler para submeter o formulário
  const onSubmit = (data: z.infer<typeof featureSchema>) => {
    if (editingFeature) {
      updateFeatureMutation.mutate({ ...data, id: editingFeature.id });
    } else {
      addFeatureMutation.mutate(data);
    }
  };
  
  // Handler para excluir funcionalidade
  const handleDeleteFeature = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta funcionalidade?")) {
      deleteFeatureMutation.mutate(id);
    }
  };
  
  // Definição das colunas da tabela
  const columns: ColumnDef<ModuleFeature>[] = [
    {
      accessorKey: "featureName",
      header: "Nome",
    },
    {
      accessorKey: "featurePath",
      header: "Caminho",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono text-xs">
          {row.original.featurePath}
        </Badge>
      ),
    },
    {
      accessorKey: "moduleId",
      header: "Módulo",
      cell: ({ row }) => {
        const module = modules.find(m => m.id === row.original.moduleId);
        return module ? (
          <Badge className={module.isCore ? "bg-blue-500" : "bg-green-500"}>
            {module.name}
          </Badge>
        ) : "—";
      },
    },
    {
      accessorKey: "description",
      header: "Descrição",
      cell: ({ row }) => row.original.description || "—",
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEditFeature(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteFeature(row.original.id)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gerenciamento de Funcionalidades</h1>
        <Button onClick={handleAddFeature}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar Funcionalidade
        </Button>
      </div>
      
      <Tabs defaultValue="list">
        <TabsList className="mb-4">
          <TabsTrigger value="list">Lista de Funcionalidades</TabsTrigger>
          <TabsTrigger value="info">Informações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Funcionalidades Disponíveis</CardTitle>
              <CardDescription>
                Gerenciamento de funcionalidades por módulo. Cada funcionalidade representa um recurso ou ação no sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={columns} 
                data={features} 
                loading={featuresLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Sobre Funcionalidades e Módulos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-lg mb-2">O que são funcionalidades?</h3>
                <p>Funcionalidades são recursos específicos do sistema que podem ser habilitados ou desabilitados por módulo. 
                   Cada funcionalidade é identificada por um caminho, como por exemplo "/api/certificates" ou "/admin/users".</p>
              </div>
              
              <div>
                <h3 className="font-medium text-lg mb-2">Como funcionam os módulos?</h3>
                <p>Módulos são conjuntos de funcionalidades relacionadas. Cada tenant tem acesso aos módulos definidos em seu plano.
                   O sistema verifica dinamicamente se o usuário tem acesso a determinada funcionalidade com base nos módulos disponíveis para seu tenant.</p>
              </div>
              
              <div>
                <h3 className="font-medium text-lg mb-2">Recomendações</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Caminhos de funcionalidades devem começar com "/" e ser descritivos</li>
                  <li>É possível usar caracteres curinga em caminhos de funcionalidades (ex: "/api/users/*")</li>
                  <li>O módulo "Core" contém funcionalidades essenciais que devem estar disponíveis em todos os planos</li>
                  <li>Evite mover funcionalidades entre módulos após o sistema estar em produção</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Modal para adicionar/editar funcionalidade */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFeature ? "Editar Funcionalidade" : "Adicionar Funcionalidade"}
            </DialogTitle>
            <DialogDescription>
              {editingFeature 
                ? "Edite os detalhes da funcionalidade selecionada" 
                : "Preencha os detalhes da nova funcionalidade"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="moduleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Módulo</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
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
                            {module.name} {module.isCore && "(Core)"}
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
                      <Input {...field} placeholder="Ex: Gerenciamento de Usuários" />
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
                      <Input {...field} placeholder="Ex: /api/users" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Descrição da funcionalidade" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={addFeatureMutation.isPending || updateFeatureMutation.isPending}>
                  {(addFeatureMutation.isPending || updateFeatureMutation.isPending) ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}