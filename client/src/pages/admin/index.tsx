import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AdminLayout from "@/components/layout/admin-layout";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Building, Users, FileBox, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SmartDashboard } from "@/components/admin/smart-dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

// Página principal do painel administrativo
export default function AdminDashboardPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("smart");

  // Buscar resumo do sistema
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/admin/dashboard'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/dashboard');
      if (!response.ok) {
        throw new Error('Erro ao carregar dados do dashboard');
      }
      return response.json();
    }
  });

  return (
    <AdminLayout>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Painel Administrativo</h1>
            <p className="text-muted-foreground">
              Visão geral do sistema e estatísticas principais.
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="smart">Dashboard Inteligente</TabsTrigger>
            <TabsTrigger value="classic">Visão Clássica</TabsTrigger>
          </TabsList>

          <TabsContent value="smart">
            <SmartDashboard />
          </TabsContent>

          <TabsContent value="classic">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Alertas do sistema */}
                {dashboardData?.alerts?.length > 0 && (
                  <div className="space-y-4 mb-8">
                    {dashboardData.alerts.map((alert: any, index: number) => (
                      <Alert key={index} variant={alert.level === 'error' ? 'destructive' : 'default'}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>{alert.title}</AlertTitle>
                        <AlertDescription>{alert.message}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}

            {/* Estatísticas rápidas */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total de Tenants
                  </CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData?.tenantCount || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData?.activeTenantCount || 0} ativos
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total de Usuários
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData?.userCount || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Em todos os tenants
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Arquivos Armazenados
                  </CardTitle>
                  <FileBox className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData?.fileCount || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData?.totalStorage?.toFixed(2) || 0} MB utilizados
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Certificados Emitidos
                  </CardTitle>
                  <FileBox className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData?.certificateCount || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Nos últimos 30 dias
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tenants recentes */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 mb-8">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Tenants Recentes</CardTitle>
                  <CardDescription>
                    Últimos tenants cadastrados no sistema.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData?.recentTenants?.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum tenant recente.</p>
                    ) : (
                      dashboardData?.recentTenants?.map((tenant: any) => (
                        <div key={tenant.id} className="flex items-center justify-between border-b pb-3">
                          <div>
                            <p className="font-medium">{tenant.name}</p>
                            <p className="text-sm text-muted-foreground">{tenant.cnpj}</p>
                          </div>
                          <Badge variant={tenant.active ? "default" : "secondary"}>
                            {tenant.active ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <Link href="/admin/tenants">
                      <Button variant="outline" size="sm">
                        Ver Todos
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Usuários recentes */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Usuários Recentes</CardTitle>
                  <CardDescription>
                    Últimos usuários cadastrados no sistema.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData?.recentUsers?.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum usuário recente.</p>
                    ) : (
                      dashboardData?.recentUsers?.map((user: any) => (
                        <div key={user.id} className="flex items-center justify-between border-b pb-3">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.username}</p>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user.tenantName}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <Link href="/admin/users">
                      <Button variant="outline" size="sm">
                        Ver Todos
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Ações rápidas por categoria */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              
              {/* Gestão de Negócio */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Gestão de Negócio
                  </CardTitle>
                  <CardDescription>
                    Gerencie tenants, planos e assinaturas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/admin/tenants">
                    <Button variant="outline" className="w-full justify-start">
                      <Building className="h-4 w-4 mr-2" />
                      Tenants
                    </Button>
                  </Link>
                  <Link href="/admin/plans">
                    <Button variant="outline" className="w-full justify-start">
                      <FileBox className="h-4 w-4 mr-2" />
                      Planos & Preços
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Sistema de Módulos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileBox className="h-5 w-5" />
                    Sistema de Módulos
                  </CardTitle>
                  <CardDescription>
                    Configure módulos e funcionalidades
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/admin/modules">
                    <Button variant="outline" className="w-full justify-start">
                      <FileBox className="h-4 w-4 mr-2" />
                      Módulos
                    </Button>
                  </Link>
                  <Link href="/admin/features">
                    <Button variant="outline" className="w-full justify-start">
                      <FileBox className="h-4 w-4 mr-2" />
                      Funcionalidades
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Controle de Sistema */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Controle de Sistema
                  </CardTitle>
                  <CardDescription>
                    Usuários, armazenamento e configurações
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/admin/users">
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="h-4 w-4 mr-2" />
                      Usuários
                    </Button>
                  </Link>
                  <Link href="/admin/storage">
                    <Button variant="outline" className="w-full justify-start">
                      <FileBox className="h-4 w-4 mr-2" />
                      Armazenamento
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}