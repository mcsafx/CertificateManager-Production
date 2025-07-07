import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Users, 
  Settings, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  CheckCircle,
  XCircle,
  Lock,
  Unlock
} from "lucide-react";

interface Permission {
  id: number;
  resource: string;
  action: string;
  description: string;
  critical: boolean;
}

interface Role {
  id: number;
  name: string;
  description: string;
  level: 'super_admin' | 'admin' | 'manager' | 'operator' | 'viewer';
  permissions: Permission[];
  userCount: number;
  active: boolean;
}

interface RolePermission {
  roleId: number;
  permissionId: number;
  granted: boolean;
}

export function RolePermissionsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [activeTab, setActiveTab] = useState("roles");

  // Fetch roles
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['/api/admin/roles'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/roles');
      if (!response.ok) {
        // Return mock data since API doesn't exist yet
        return [
          {
            id: 1,
            name: 'Super Administrador',
            description: 'Acesso total ao sistema',
            level: 'super_admin' as const,
            permissions: [],
            userCount: 1,
            active: true
          },
          {
            id: 2,
            name: 'Administrador',
            description: 'Gerenciamento completo exceto configurações críticas',
            level: 'admin' as const,
            permissions: [],
            userCount: 3,
            active: true
          },
          {
            id: 3,
            name: 'Gerente',
            description: 'Gestão de tenants e usuários',
            level: 'manager' as const,
            permissions: [],
            userCount: 5,
            active: true
          },
          {
            id: 4,
            name: 'Operador',
            description: 'Operações básicas e monitoramento',
            level: 'operator' as const,
            permissions: [],
            userCount: 8,
            active: true
          },
          {
            id: 5,
            name: 'Visualizador',
            description: 'Apenas leitura e relatórios',
            level: 'viewer' as const,
            permissions: [],
            userCount: 12,
            active: true
          }
        ];
      }
      return response.json();
    }
  });

  // Fetch permissions
  const { data: permissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ['/api/admin/permissions'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/permissions');
      if (!response.ok) {
        // Return mock data
        return [
          { id: 1, resource: 'tenants', action: 'create', description: 'Criar novos tenants', critical: true },
          { id: 2, resource: 'tenants', action: 'read', description: 'Visualizar tenants', critical: false },
          { id: 3, resource: 'tenants', action: 'update', description: 'Editar tenants', critical: true },
          { id: 4, resource: 'tenants', action: 'delete', description: 'Remover tenants', critical: true },
          { id: 5, resource: 'users', action: 'create', description: 'Criar usuários', critical: false },
          { id: 6, resource: 'users', action: 'read', description: 'Visualizar usuários', critical: false },
          { id: 7, resource: 'users', action: 'update', description: 'Editar usuários', critical: false },
          { id: 8, resource: 'users', action: 'delete', description: 'Remover usuários', critical: true },
          { id: 9, resource: 'plans', action: 'create', description: 'Criar planos', critical: true },
          { id: 10, resource: 'plans', action: 'read', description: 'Visualizar planos', critical: false },
          { id: 11, resource: 'plans', action: 'update', description: 'Editar planos', critical: true },
          { id: 12, resource: 'plans', action: 'delete', description: 'Remover planos', critical: true },
          { id: 13, resource: 'modules', action: 'create', description: 'Criar módulos', critical: true },
          { id: 14, resource: 'modules', action: 'read', description: 'Visualizar módulos', critical: false },
          { id: 15, resource: 'modules', action: 'update', description: 'Editar módulos', critical: true },
          { id: 16, resource: 'modules', action: 'delete', description: 'Remover módulos', critical: true },
          { id: 17, resource: 'system', action: 'read', description: 'Visualizar configurações do sistema', critical: false },
          { id: 18, resource: 'system', action: 'update', description: 'Modificar configurações do sistema', critical: true },
          { id: 19, resource: 'reports', action: 'create', description: 'Gerar relatórios', critical: false },
          { id: 20, resource: 'reports', action: 'read', description: 'Visualizar relatórios', critical: false }
        ];
      }
      return response.json();
    }
  });

  // Fetch role permissions for selected role
  const { data: rolePermissions = [], isLoading: rolePermissionsLoading } = useQuery({
    queryKey: ['/api/admin/roles', selectedRole?.id, 'permissions'],
    queryFn: async () => {
      if (!selectedRole) return [];
      const response = await apiRequest('GET', `/api/admin/roles/${selectedRole.id}/permissions`);
      if (!response.ok) {
        // Return mock data - all permissions for super admin, subset for others
        if (selectedRole.level === 'super_admin') {
          return permissions.map(p => ({ roleId: selectedRole.id, permissionId: p.id, granted: true }));
        } else if (selectedRole.level === 'admin') {
          return permissions.filter(p => !p.critical || p.resource !== 'system')
            .map(p => ({ roleId: selectedRole.id, permissionId: p.id, granted: true }));
        } else {
          return permissions.filter(p => p.action === 'read')
            .map(p => ({ roleId: selectedRole.id, permissionId: p.id, granted: true }));
        }
      }
      return response.json();
    },
    enabled: !!selectedRole
  });

  const hasPermission = (permissionId: number) => {
    return rolePermissions.some((rp: RolePermission) => 
      rp.permissionId === permissionId && rp.granted
    );
  };

  const getLevelBadgeColor = (level: Role['level']) => {
    switch (level) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-orange-100 text-orange-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'operator': return 'bg-green-100 text-green-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const groupPermissionsByResource = () => {
    const grouped: { [key: string]: Permission[] } = {};
    permissions.forEach((permission: Permission) => {
      if (!grouped[permission.resource]) {
        grouped[permission.resource] = [];
      }
      grouped[permission.resource].push(permission);
    });
    return grouped;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Permissões</h2>
          <p className="text-muted-foreground">
            Configure funções e permissões para administradores do sistema
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Função
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="roles">Funções</TabsTrigger>
          <TabsTrigger value="permissions">Permissões</TabsTrigger>
          <TabsTrigger value="matrix">Matriz de Acesso</TabsTrigger>
        </TabsList>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {roles.map((role: Role) => (
              <Card key={role.id} className={`cursor-pointer transition-all ${
                selectedRole?.id === role.id ? 'ring-2 ring-primary' : ''
              }`} onClick={() => setSelectedRole(role)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{role.name}</CardTitle>
                    <Badge className={getLevelBadgeColor(role.level)}>
                      {role.level}
                    </Badge>
                  </div>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Usuários</span>
                      <Badge variant="outline">{role.userCount}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Status</span>
                      <Badge variant={role.active ? "default" : "secondary"}>
                        {role.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Role Permissions Detail */}
          {selectedRole && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Permissões - {selectedRole.name}
                  <Badge className={getLevelBadgeColor(selectedRole.level)}>
                    {selectedRole.level}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Configure as permissões disponíveis para esta função
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(groupPermissionsByResource()).map(([resource, resourcePermissions]) => (
                    <div key={resource}>
                      <h4 className="font-medium mb-3 capitalize">
                        {resource} ({resourcePermissions.length} permissões)
                      </h4>
                      <div className="grid gap-3 md:grid-cols-2">
                        {resourcePermissions.map((permission: Permission) => (
                          <div key={permission.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium capitalize">{permission.action}</span>
                                {permission.critical && (
                                  <Badge variant="destructive" className="text-xs">
                                    Crítico
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {permission.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {hasPermission(permission.id) ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-gray-300" />
                              )}
                              <Switch
                                checked={hasPermission(permission.id)}
                                disabled={selectedRole.level === 'super_admin'}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Todas as Permissões</CardTitle>
              <CardDescription>
                Lista completa de permissões disponíveis no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recurso</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Usado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((permission: Permission) => (
                    <TableRow key={permission.id}>
                      <TableCell className="font-medium capitalize">
                        {permission.resource}
                      </TableCell>
                      <TableCell className="capitalize">
                        {permission.action}
                      </TableCell>
                      <TableCell>{permission.description}</TableCell>
                      <TableCell>
                        {permission.critical ? (
                          <Badge variant="destructive">Crítico</Badge>
                        ) : (
                          <Badge variant="outline">Normal</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {roles.filter(role => hasPermission(permission.id)).length} funções
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access Matrix Tab */}
        <TabsContent value="matrix" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Matriz de Controle de Acesso</CardTitle>
              <CardDescription>
                Visão geral das permissões por função
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Recurso / Ação</th>
                      {roles.map((role: Role) => (
                        <th key={role.id} className="text-center p-3 min-w-[100px]">
                          <div className="space-y-1">
                            <div className="font-medium text-sm">{role.name}</div>
                            <Badge className={`text-xs ${getLevelBadgeColor(role.level)}`}>
                              {role.level}
                            </Badge>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(groupPermissionsByResource()).map(([resource, resourcePermissions]) => (
                      resourcePermissions.map((permission: Permission, index: number) => (
                        <tr key={permission.id} className="border-b">
                          <td className="p-3">
                            <div className="space-y-1">
                              {index === 0 && (
                                <div className="font-medium capitalize">{resource}</div>
                              )}
                              <div className="text-sm text-muted-foreground capitalize ml-4">
                                {permission.action}
                                {permission.critical && (
                                  <Lock className="inline h-3 w-3 ml-1 text-red-500" />
                                )}
                              </div>
                            </div>
                          </td>
                          {roles.map((role: Role) => (
                            <td key={role.id} className="text-center p-3">
                              <div className="flex justify-center">
                                {role.level === 'super_admin' || 
                                 (role.level === 'admin' && (!permission.critical || permission.resource !== 'system')) ||
                                 (permission.action === 'read') ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-gray-300" />
                                )}
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}