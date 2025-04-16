import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/layout/layout";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart, FileWarning, HardDrive, Loader2, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import React from "react";

// Componente para mostrar o uso de armazenamento
const StorageUsageBar = ({ used, total }: { used: number; total: number }) => {
  const percentage = Math.min(Math.round((used / total) * 100), 100);
  let variant = "default";
  
  if (percentage > 90) {
    variant = "destructive";
  } else if (percentage > 70) {
    variant = "warning";
  }
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{used.toFixed(2)} MB de {total} MB</span>
        <Badge variant={variant as any}>{percentage}%</Badge>
      </div>
      <Progress value={percentage} className={percentage > 90 ? "bg-red-200" : ""} />
    </div>
  );
};

// Página de Administração de Armazenamento
export default function StoragePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar lista de tenants com informações de armazenamento
  const { data: storageData, isLoading } = useQuery({
    queryKey: ['/api/admin/storage'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/storage');
      if (!response.ok) {
        throw new Error('Erro ao carregar dados de armazenamento');
      }
      return response.json();
    }
  });

  // Mutação para limpar arquivos não utilizados
  const cleanupStorageMutation = useMutation({
    mutationFn: async (tenantId: number) => {
      const response = await apiRequest('POST', `/api/admin/storage/cleanup/${tenantId}`);
      if (!response.ok) {
        throw new Error('Erro ao limpar armazenamento');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/storage'] });
      toast({
        title: "Limpeza realizada",
        description: "Os arquivos não utilizados foram removidos com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao limpar armazenamento",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Cálculo de estatísticas globais
  const totalStorage = storageData?.reduce((sum: number, tenant: any) => sum + tenant.storageUsed, 0) || 0;
  const totalAllocated = storageData?.reduce((sum: number, tenant: any) => sum + tenant.maxStorage, 0) || 0;
  const tenantsOverLimit = storageData?.filter((tenant: any) => tenant.storageUsed > tenant.maxStorage).length || 0;
  const tenantsNearLimit = storageData?.filter((tenant: any) => {
    const percentage = (tenant.storageUsed / tenant.maxStorage) * 100;
    return percentage >= 80 && percentage <= 100;
  }).length || 0;

  return (
    <Layout>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Gerenciamento de Armazenamento</h1>
            <p className="text-muted-foreground">
              Monitore e gerencie o uso de armazenamento dos tenants.
            </p>
          </div>
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/storage'] })}
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar Dados
          </Button>
        </div>

        {/* Painel de estatísticas gerais */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Armazenamento Total
              </CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStorage.toFixed(2)} MB</div>
              <p className="text-xs text-muted-foreground">
                de {totalAllocated} MB alocados
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Uso Médio por Tenant
              </CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {storageData?.length ? (totalStorage / storageData.length).toFixed(2) : 0} MB
              </div>
              <p className="text-xs text-muted-foreground">
                por tenant
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tenants Acima do Limite
              </CardTitle>
              <FileWarning className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenantsOverLimit}</div>
              <p className="text-xs text-muted-foreground">
                {tenantsOverLimit > 0 
                  ? "Ação necessária" 
                  : "Tudo em ordem"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tenants Próximos ao Limite
              </CardTitle>
              <FileWarning className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenantsNearLimit}</div>
              <p className="text-xs text-muted-foreground">
                {tenantsNearLimit > 0 
                  ? "Monitoramento recomendado" 
                  : "Tudo em ordem"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alertas para tenants acima do limite */}
        {tenantsOverLimit > 0 && (
          <Alert variant="destructive" className="mb-6">
            <FileWarning className="h-4 w-4" />
            <AlertTitle>Atenção!</AlertTitle>
            <AlertDescription>
              Existem {tenantsOverLimit} tenant(s) que excederam seu limite de armazenamento.
              Ação recomendada: aumente o limite do plano ou solicite ao cliente que remova arquivos.
            </AlertDescription>
          </Alert>
        )}

        {/* Tabela de tenants e seu uso de armazenamento */}
        <Card>
          <CardHeader>
            <CardTitle>Uso de Armazenamento por Tenant</CardTitle>
            <CardDescription>
              Detalhes do consumo de armazenamento por cada tenant no sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : storageData?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum tenant encontrado.
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Uso de Armazenamento</TableHead>
                      <TableHead>Quantidade de Arquivos</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {storageData?.map((tenant: any) => {
                      const isOverLimit = tenant.storageUsed > tenant.maxStorage;
                      const usagePercentage = (tenant.storageUsed / tenant.maxStorage) * 100;
                      const isNearLimit = usagePercentage >= 80 && usagePercentage <= 100;
                      
                      return (
                        <TableRow key={tenant.id}>
                          <TableCell className="font-medium">{tenant.name}</TableCell>
                          <TableCell>{tenant.planName}</TableCell>
                          <TableCell className="w-[300px]">
                            <StorageUsageBar 
                              used={tenant.storageUsed} 
                              total={tenant.maxStorage} 
                            />
                          </TableCell>
                          <TableCell>{tenant.fileCount}</TableCell>
                          <TableCell>
                            {isOverLimit ? (
                              <Badge variant="destructive">Acima do limite</Badge>
                            ) : isNearLimit ? (
                              <Badge variant="outline" className="text-amber-500 border-amber-500">
                                Próximo ao limite
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-green-500 border-green-500">
                                OK
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => cleanupStorageMutation.mutate(tenant.id)}
                              disabled={cleanupStorageMutation.isPending}
                            >
                              {cleanupStorageMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Limpar Não Utilizados
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}