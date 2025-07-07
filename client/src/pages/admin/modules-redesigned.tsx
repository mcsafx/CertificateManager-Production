import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ModuleCreateModal } from "@/components/admin/module-create-modal";
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Settings,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
  Code,
  BarChart3,
  Users,
  Eye,
  EyeOff
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Module {
  id: number;
  code: string;
  name: string;
  description: string;
  active: boolean;
  isCore: boolean;
  createdAt: string;
  updatedAt: string;
  featureCount?: number;
  planCount?: number;
  tenantCount?: number;
}

interface ModuleStats {
  totalModules: number;
  activeModules: number;
  coreModules: number;
  customModules: number;
  mostUsedModule: string;
  leastUsedModule: string;
}

export default function ModulesRedesignedPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [filterType, setFilterType] = useState<"all" | "core" | "custom">("all");
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [moduleToDelete, setModuleToDelete] = useState<Module | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    code: "",
    active: true
  });

  // Fetch modules with statistics
  const { data: modulesData, isLoading } = useQuery({
    queryKey: ['/api/admin/modules'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/modules');
      if (!response.ok) throw new Error('Erro ao carregar módulos');
      const modules = await response.json();
      
      // Calculate statistics from the modules data
      const stats = {
        totalModules: modules.length,
        activeModules: modules.filter((m: Module) => m.active).length,
        coreModules: modules.filter((m: Module) => m.isCore).length,
        customModules: modules.filter((m: Module) => !m.isCore).length,
        mostUsedModule: modules.length > 0 ? modules[0].name : "N/A",
        leastUsedModule: modules.length > 0 ? modules[modules.length - 1].name : "N/A"
      };
      
      return { modules, stats };
    }
  });

  const modules: Module[] = modulesData?.modules || [];
  const stats: ModuleStats = modulesData?.stats || {
    totalModules: 0,
    activeModules: 0,
    coreModules: 0,
    customModules: 0,
    mostUsedModule: "N/A",
    leastUsedModule: "N/A"
  };

  // Filter modules based on search and filters
  const filteredModules = modules.filter(module => {
    const matchesSearch = module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "active" && module.active) ||
                         (filterStatus === "inactive" && !module.active);
    
    const matchesType = filterType === "all" ||
                       (filterType === "core" && module.isCore) ||
                       (filterType === "custom" && !module.isCore);
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Toggle module status
  const toggleModuleMutation = useMutation({
    mutationFn: async ({ moduleId, active }: { moduleId: number; active: boolean }) => {
      const response = await apiRequest('PATCH', `/api/admin/modules/${moduleId}`, {
        active
      });
      if (!response.ok) throw new Error('Erro ao atualizar módulo');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/modules'] });
      toast({
        title: "Módulo atualizado",
        description: "O status do módulo foi atualizado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar módulo",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Edit module mutation
  const editModuleMutation = useMutation({
    mutationFn: async (moduleData: any) => {
      const response = await apiRequest('PUT', `/api/admin/modules/${editingModule?.id}`, moduleData);
      if (!response.ok) throw new Error('Erro ao atualizar módulo');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/modules'] });
      setEditDialogOpen(false);
      setEditingModule(null);
      toast({ title: "Módulo atualizado com sucesso" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar módulo", description: error.message, variant: "destructive" });
    }
  });

  // Delete module mutation
  const deleteModuleMutation = useMutation({
    mutationFn: async (moduleId: number) => {
      const response = await apiRequest('DELETE', `/api/admin/modules/${moduleId}`);
      if (!response.ok) throw new Error('Erro ao deletar módulo');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/modules'] });
      setDeleteDialogOpen(false);
      setModuleToDelete(null);
      toast({ title: "Módulo deletado com sucesso" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao deletar módulo", description: error.message, variant: "destructive" });
    }
  });

  const handleEditClick = (module: Module) => {
    setEditingModule(module);
    setFormData({
      name: module.name,
      description: module.description,
      code: module.code,
      active: module.active
    });
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (module: Module) => {
    setModuleToDelete(module);
    setDeleteDialogOpen(true);
  };

  const handleViewClick = (module: Module) => {
    setSelectedModule(module);
    setViewDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingModule) {
      editModuleMutation.mutate(formData);
    }
  };

  const handleConfirmDelete = () => {
    if (moduleToDelete) {
      deleteModuleMutation.mutate(moduleToDelete.id);
    }
  };

  const getModuleIcon = (moduleCode: string) => {
    switch (moduleCode) {
      case 'core': return <Shield className="h-4 w-4" />;
      case 'products': return <Package className="h-4 w-4" />;
      case 'certificates': return <Shield className="h-4 w-4" />;
      case 'nfe_import': return <Code className="h-4 w-4" />;
      case 'reports': return <BarChart3 className="h-4 w-4" />;
      case 'multi_user': return <Users className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getUsageColor = (usage: number) => {
    if (usage >= 80) return "bg-green-100 text-green-800";
    if (usage >= 50) return "bg-blue-100 text-blue-800";
    if (usage >= 20) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sistema de Módulos</h1>
            <p className="text-muted-foreground">
              Gerencie módulos do sistema e suas funcionalidades
            </p>
          </div>
          <ModuleCreateModal />
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Módulos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalModules || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeModules || 0} ativos
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Módulos Core</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.coreModules || 0}</div>
              <p className="text-xs text-muted-foreground">
                Essenciais do sistema
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Módulos Customizados</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.customModules || 0}</div>
              <p className="text-xs text-muted-foreground">
                Configuráveis por plano
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mais Utilizado</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate">{stats.mostUsedModule || "N/A"}</div>
              <p className="text-xs text-muted-foreground">
                Módulo com mais uso
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="dependencies">Dependências</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filtros e Busca</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <Label htmlFor="search">Buscar módulos</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Nome, código ou descrição..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  
                  <div className="min-w-[120px]">
                    <Label htmlFor="status-filter">Status</Label>
                    <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                      <SelectTrigger id="status-filter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="active">Ativos</SelectItem>
                        <SelectItem value="inactive">Inativos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="min-w-[120px]">
                    <Label htmlFor="type-filter">Tipo</Label>
                    <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                      <SelectTrigger id="type-filter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="core">Core</SelectItem>
                        <SelectItem value="custom">Customizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Modules Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredModules.map((module) => (
                <Card key={module.id} className={`relative overflow-hidden ${
                  module.isCore ? 'ring-2 ring-blue-200' : ''
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getModuleIcon(module.code)}
                        <CardTitle className="text-lg">{module.name}</CardTitle>
                      </div>
                      <div className="flex gap-2">
                        {module.isCore && (
                          <Badge variant="secondary">Core</Badge>
                        )}
                        <Badge variant={module.active ? "default" : "secondary"}>
                          {module.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription className="text-sm">
                      {module.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Module Code */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Code className="h-4 w-4" />
                      <span className="font-mono">{module.code}</span>
                    </div>

                    {/* Usage Statistics */}
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center">
                        <div className="font-semibold">{module.featureCount || 0}</div>
                        <div className="text-muted-foreground text-xs">Funcionalidades</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{module.planCount || 0}</div>
                        <div className="text-muted-foreground text-xs">Planos</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{module.tenantCount || 0}</div>
                        <div className="text-muted-foreground text-xs">Tenants</div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`toggle-${module.id}`} className="text-sm">
                          {module.active ? "Ativo" : "Inativo"}
                        </Label>
                        <Switch
                          id={`toggle-${module.id}`}
                          checked={module.active}
                          disabled={module.isCore}
                          onCheckedChange={(checked) => {
                            toggleModuleMutation.mutate({ moduleId: module.id, active: checked });
                          }}
                        />
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => handleEditClick(module)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleViewClick(module)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!module.isCore && (
                          <Button size="sm" variant="outline" onClick={() => handleDeleteClick(module)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredModules.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum módulo encontrado</h3>
                  <p className="text-muted-foreground">
                    Nenhum módulo corresponde aos filtros aplicados
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analytics de Módulos</CardTitle>
                <CardDescription>
                  Análise de uso e performance dos módulos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Analytics em Desenvolvimento</h3>
                  <p>Funcionalidade será implementada em breve</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dependencies Tab */}
          <TabsContent value="dependencies" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dependências entre Módulos</CardTitle>
                <CardDescription>
                  Visualize as dependências e relacionamentos entre módulos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Mapeamento de Dependências</h3>
                  <p>Funcionalidade será implementada em breve</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Module Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Módulo</DialogTitle>
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
                <Label htmlFor="code" className="text-right">
                  Código
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  className="col-span-3"
                  disabled={editingModule?.isCore}
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
                <Label htmlFor="active" className="text-right">
                  Ativo
                </Label>
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({...formData, active: checked})}
                  disabled={editingModule?.isCore}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} disabled={editModuleMutation.isPending}>
                {editModuleMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Module Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedModule && getModuleIcon(selectedModule.code)}
                {selectedModule?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedModule && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Código</Label>
                      <p className="font-mono text-sm">{selectedModule.code}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                      <div className="flex items-center gap-2">
                        <Badge variant={selectedModule.active ? "default" : "secondary"}>
                          {selectedModule.active ? "Ativo" : "Inativo"}
                        </Badge>
                        {selectedModule.isCore && <Badge variant="secondary">Core</Badge>}
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Descrição</Label>
                    <p className="text-sm">{selectedModule.description}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Funcionalidades</Label>
                      <p className="text-sm font-semibold">{selectedModule.featureCount || 0}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Planos</Label>
                      <p className="text-sm font-semibold">{selectedModule.planCount || 0}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Tenants</Label>
                      <p className="text-sm font-semibold">{selectedModule.tenantCount || 0}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Criado em</Label>
                      <p className="text-sm">{new Date(selectedModule.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Atualizado em</Label>
                      <p className="text-sm">{new Date(selectedModule.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Module Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>Tem certeza que deseja excluir o módulo "{moduleToDelete?.name}"?</p>
              <p className="text-sm text-muted-foreground mt-2">
                Esta ação não pode ser desfeita e pode afetar os planos que utilizam este módulo.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete} disabled={deleteModuleMutation.isPending}>
                {deleteModuleMutation.isPending ? "Excluindo..." : "Excluir"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}