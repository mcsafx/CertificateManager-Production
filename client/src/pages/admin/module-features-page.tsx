import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash, Loader2, Info, ChevronRight } from "lucide-react";
import { Label } from "@/components/ui/label";
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
import { ModuleFeature, Module } from "@shared/schema";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useModuleFeatures } from "@/hooks/use-module-features";
import { CheckboxFeatureSelect } from "@/components/ui/checkbox-feature-select";
import { MultiCheckboxFeatureSelect } from "@/components/ui/multi-checkbox-feature-select";
import { findFeatureById, findFeatureByPath } from "@/lib/feature-catalog";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

const moduleFeatureFormSchema = z.object({
  moduleId: z.coerce.number().min(1, "Selecione um módulo"),
  featureId: z.string().min(1, "Selecione uma funcionalidade"),
  description: z.string().min(1, "Forneça uma descrição"),
  featureIds: z.array(z.string()).optional(),
});

type ModuleFeatureFormValues = z.infer<typeof moduleFeatureFormSchema>;

export default function ModuleFeaturesPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<ModuleFeature | null>(null);
  const [activeTab, setActiveTab] = useState("modules");
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(true); // Por padrão, usamos o modo múltiplo
  
  // Utilizando o hook personalizado para módulos e funcionalidades
  const {
    modules,
    features,
    isLoadingModules,
    isLoadingFeatures,
    createFeature,
    updateFeature,
    deleteFeature,
    isCreating,
    isUpdating,
    isDeleting
  } = useModuleFeatures();
  
  // Formulário para criar/editar funcionalidades
  const form = useForm<ModuleFeatureFormValues>({
    resolver: zodResolver(moduleFeatureFormSchema),
    defaultValues: {
      moduleId: 0,
      featureId: "",
      description: "",
      featureIds: [] // Para seleção múltipla
    },
  });
  
  // Manipuladores para o formulário de criação
  const onCreateSubmit = async (data: ModuleFeatureFormValues) => {
    // No modo de seleção múltipla
    if (isMultiSelectMode && data.featureIds && data.featureIds.length > 0) {
      let success = 0;
      let failed = 0;
      
      // Processo de adição em lote
      const promises = data.featureIds.map(featureId => {
        const feature = findFeatureById(featureId);
        if (!feature) return null;
        
        const apiData = {
          moduleId: data.moduleId,
          featurePath: feature.path,
          featureName: feature.name,
          description: data.description || feature.description,
        };
        
        return new Promise<void>((resolve) => {
          createFeature(apiData, {
            onSuccess: () => { 
              success++; 
              resolve();
            },
            onError: () => { 
              failed++; 
              resolve();
            },
          });
        });
      });
      
      // Aguarde todas as operações serem concluídas
      await Promise.all(promises.filter(Boolean));
      
      // Reporte os resultados
      if (success > 0) {
        toast({
          title: "Sucesso",
          description: `${success} funcionalidade(s) adicionada(s) ao módulo${failed > 0 ? `, ${failed} falha(s)` : ''}`,
          variant: "default",
        });
      } else if (failed > 0) {
        toast({
          title: "Erro",
          description: `Falha ao adicionar funcionalidades`,
          variant: "destructive",
        });
      }
      
      setIsCreateDialogOpen(false);
      form.reset({
        moduleId: 0,
        featureId: "",
        description: "",
        featureIds: [],
      });
      
      return;
    }
    
    // Modo clássico de seleção única
    const selectedFeature = findFeatureById(data.featureId);
    if (!selectedFeature) {
      toast({
        title: "Erro",
        description: "Funcionalidade não encontrada",
        variant: "destructive",
      });
      return;
    }
    
    // Construindo os dados para a API com base na funcionalidade selecionada
    const apiData = {
      moduleId: data.moduleId,
      featurePath: selectedFeature.path,
      featureName: selectedFeature.name,
      description: data.description || selectedFeature.description,
    };
    
    createFeature(apiData, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        form.reset({
          moduleId: 0,
          featureId: "",
          description: "",
          featureIds: [],
        });
      }
    });
  };
  
  // Manipuladores para o formulário de edição
  const handleEdit = (feature: ModuleFeature) => {
    setSelectedFeature(feature);
    
    // Tentamos encontrar a funcionalidade correspondente no catálogo
    const catalogFeature = findFeatureByPath(feature.featurePath);
    
    form.reset({
      moduleId: feature.moduleId,
      // Se encontramos no catálogo, usamos o ID, senão deixamos vazio
      featureId: catalogFeature?.id || "",
      description: feature.description,
    });
    
    setIsEditDialogOpen(true);
  };
  
  const onEditSubmit = (data: ModuleFeatureFormValues) => {
    if (!selectedFeature) return;
    
    const catalogFeature = findFeatureById(data.featureId);
    
    // Construindo os dados para API
    const apiData: any = {
      id: selectedFeature.id,
      moduleId: data.moduleId,
      description: data.description,
      // Se selecionou uma funcionalidade do catálogo, usamos seus dados
      featureName: catalogFeature ? catalogFeature.name : selectedFeature.featureName,
      featurePath: catalogFeature ? catalogFeature.path : selectedFeature.featurePath,
      // Adicionando o valor de createdAt do item original para satisfazer o tipo
      createdAt: selectedFeature.createdAt,
    };
    
    updateFeature(apiData, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setSelectedFeature(null);
        form.reset({
          moduleId: 0,
          featureId: "",
          description: "",
        });
      }
    });
  };
  
  // Manipuladores para exclusão
  const handleDelete = (feature: ModuleFeature) => {
    setSelectedFeature(feature);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (!selectedFeature) return;
    deleteFeature(selectedFeature.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setSelectedFeature(null);
      }
    });
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
                <DialogContent className="max-w-4xl w-full">
                  <DialogHeader>
                    <DialogTitle>Criar Nova Funcionalidade</DialogTitle>
                    <DialogDescription>
                      Adicione uma nova funcionalidade a um módulo existente.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
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
                          
                          {/* Seletor de modo único ou múltiplo */}
                          <div className="flex items-center justify-between my-4">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={isMultiSelectMode}
                                onCheckedChange={setIsMultiSelectMode}
                                id="multi-select-mode"
                              />
                              <Label htmlFor="multi-select-mode" className="cursor-pointer">
                                Seleção múltipla
                              </Label>
                            </div>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Ative para selecionar várias funcionalidades de uma vez.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          
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
                                    className="h-[120px]"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div>
                          {isMultiSelectMode ? (
                            // Modo de seleção múltipla
                            <FormField
                              control={form.control}
                              name="featureIds"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    <div className="flex items-center gap-2">
                                      <span>Funcionalidades</span>
                                      <Badge variant="outline">{field.value?.length || 0} selecionada(s)</Badge>
                                    </div>
                                  </FormLabel>
                                  <FormControl>
                                    <MultiCheckboxFeatureSelect
                                      values={field.value || []}
                                      onValuesChange={field.onChange}
                                      moduleId={form.watch("moduleId") || undefined}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Selecione as funcionalidades que deseja adicionar ao módulo.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          ) : (
                            // Modo de seleção única
                            <FormField
                              control={form.control}
                              name="featureId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    <div className="flex items-center gap-2">
                                      <span>Funcionalidade</span>
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Info className="h-4 w-4 text-muted-foreground" />
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Selecione a funcionalidade para adicionar ao módulo.</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  </FormLabel>
                                  <FormControl>
                                    <CheckboxFeatureSelect 
                                      value={field.value}
                                      onValueChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Selecione a funcionalidade que deseja adicionar.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                      </div>
                      
                      <DialogFooter className="mt-6">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsCreateDialogOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit"
                          disabled={isCreating}
                        >
                          {isCreating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Criando...
                            </>
                          ) : "Criar"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          <TabsContent value="modules" className="space-y-4">
            {isLoadingModules ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Carregando módulos...</span>
              </div>
            ) : (
              <DataTable
                columns={moduleColumns}
                data={modules}
                searchColumn="name"
                searchPlaceholder="Buscar módulos..."
              />
            )}
          </TabsContent>
          
          <TabsContent value="features" className="space-y-4">
            {isLoadingFeatures ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Carregando funcionalidades...</span>
              </div>
            ) : (
              <DataTable
                columns={featureColumns}
                data={features}
                searchColumn="featureName"
                searchPlaceholder="Buscar funcionalidades..."
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Diálogo de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>Editar Funcionalidade</DialogTitle>
            <DialogDescription>
              Modifique os detalhes da funcionalidade selecionada.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
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
                    name="description"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea {...field} className="h-[120px]" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div>
                  <FormField
                    control={form.control}
                    name="featureId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <div className="flex items-center gap-2">
                            <span>Funcionalidade</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Selecione a funcionalidade para adicionar ao módulo.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </FormLabel>
                        <FormControl>
                          <CheckboxFeatureSelect 
                            value={field.value}
                            onValueChange={field.onChange}
                          />
                        </FormControl>
                        <FormDescription>
                          Selecione a funcionalidade que deseja adicionar.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <DialogFooter className="mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de Exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a funcionalidade{" "}
              <strong>{selectedFeature?.featureName}</strong>?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="mt-6">
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
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}