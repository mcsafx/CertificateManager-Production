import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Users,
  Package,
  CreditCard,
  Activity,
  Target,
  Zap,
  ArrowRight,
  Calendar,
  DollarSign
} from "lucide-react";
import { Link } from "wouter";

interface DashboardInsights {
  systemHealth: {
    score: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  };
  businessMetrics: {
    revenue: {
      current: number;
      previous: number;
      growth: number;
    };
    tenants: {
      total: number;
      active: number;
      churn: number;
    };
    modules: {
      usage: { moduleId: number; name: string; usage: number }[];
      underutilized: string[];
    };
  };
  predictions: {
    tenantGrowth: number;
    revenueGrowth: number;
    topRisks: string[];
    opportunities: string[];
  };
  alerts: {
    level: 'info' | 'warning' | 'error';
    title: string;
    message: string;
    action?: string;
    href?: string;
  }[];
}

export function SmartDashboard() {
  const { data: insights, isLoading } = useQuery({
    queryKey: ['/api/admin/insights'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/dashboard/insights');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard insights');
      }
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const healthColor = {
    excellent: 'text-green-600',
    good: 'text-blue-600',
    warning: 'text-yellow-600',
    critical: 'text-red-600'
  };

  const healthBg = {
    excellent: 'bg-green-50',
    good: 'bg-blue-50',
    warning: 'bg-yellow-50',
    critical: 'bg-red-50'
  };

  return (
    <div className="space-y-6">
      {/* System Health & Alerts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className={`${healthBg[insights?.systemHealth.status || 'good']}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Saúde do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Score Geral</span>
                <span className={`text-2xl font-bold ${healthColor[insights?.systemHealth.status || 'good']}`}>
                  {insights?.systemHealth.score}%
                </span>
              </div>
              <Progress value={insights?.systemHealth.score} className="h-2" />
              <Badge className={healthColor[insights?.systemHealth.status || 'good']}>
                {insights?.systemHealth.status === 'excellent' && 'Excelente'}
                {insights?.systemHealth.status === 'good' && 'Bom'}
                {insights?.systemHealth.status === 'warning' && 'Atenção'}
                {insights?.systemHealth.status === 'critical' && 'Crítico'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Métricas de Negócio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Receita Mensal</span>
                <div className="text-right">
                  <div className="text-2xl font-bold">R$ {insights?.businessMetrics.revenue.current.toLocaleString()}</div>
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <TrendingUp className="h-3 w-3" />
                    +{insights?.businessMetrics.revenue.growth}%
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tenants Ativos</span>
                <div className="text-right">
                  <div className="text-xl font-bold">{insights?.businessMetrics.tenants.active}/{insights?.businessMetrics.tenants.total}</div>
                  <div className="text-sm text-muted-foreground">Churn: {insights?.businessMetrics.tenants.churn}%</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {insights?.alerts && insights.alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Alertas Inteligentes</h3>
          {insights.alerts.map((alert, index) => (
            <Alert key={index} variant={alert.level === 'error' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{alert.title}</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>{alert.message}</span>
                {alert.href && (
                  <Link href={alert.href}>
                    <Button variant="outline" size="sm">
                      {alert.action}
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                )}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Module Usage Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Performance dos Módulos
          </CardTitle>
          <CardDescription>
            Análise de adoção e utilização dos módulos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights?.businessMetrics.modules.usage.map((module) => (
              <div key={module.moduleId} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span className="font-medium">{module.name}</span>
                </div>
                <div className="flex items-center gap-2 min-w-[100px]">
                  <Progress value={module.usage} className="w-16 h-2" />
                  <span className="text-sm font-medium">{module.usage}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Predictions & Recommendations */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Previsões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Crescimento de Tenants</span>
                <span className="font-bold text-green-600">+{insights?.predictions.tenantGrowth}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Crescimento de Receita</span>
                <span className="font-bold text-green-600">+{insights?.predictions.revenueGrowth}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Recomendações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights?.systemHealth.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Recomendadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/admin/storage">
              <Button variant="outline" className="w-full justify-start">
                <Activity className="h-4 w-4 mr-2" />
                Verificar Armazenamento
              </Button>
            </Link>
            <Link href="/admin/tenants">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Analisar Tenants
              </Button>
            </Link>
            <Link href="/admin/modules">
              <Button variant="outline" className="w-full justify-start">
                <Package className="h-4 w-4 mr-2" />
                Otimizar Módulos
              </Button>
            </Link>
            <Link href="/admin/plans">
              <Button variant="outline" className="w-full justify-start">
                <CreditCard className="h-4 w-4 mr-2" />
                Revisar Planos
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}