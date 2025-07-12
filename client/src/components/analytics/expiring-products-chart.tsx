import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { AlertTriangle, Clock, CheckCircle, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useDashboardFilters } from "@/contexts/dashboard-filters-context";

interface ExpiringProductsData {
  summary: {
    expired: number;
    critical: number;
    warning: number;
    safe: number;
  };
  products: Array<{
    id: number;
    productName: string;
    supplierName: string;
    daysUntilExpiration: number;
    category: 'expired' | 'critical' | 'warning' | 'safe';
    receivedQuantity: string;
    measureUnit: string;
  }>;
  total: number;
}

const CATEGORY_CONFIG = {
  expired: {
    color: '#dc2626',
    label: 'Vencidos',
    icon: XCircle,
  },
  critical: {
    color: '#ea580c', 
    label: 'Crítico (<30 dias)',
    icon: AlertTriangle,
  },
  warning: {
    color: '#ca8a04',
    label: 'Atenção (30-90 dias)', 
    icon: Clock,
  },
  safe: {
    color: '#16a34a',
    label: 'Seguro (>90 dias)',
    icon: CheckCircle,
  },
};

export function ExpiringProductsChart() {
  const { filters, getQueryParams } = useDashboardFilters();
  
  const { data, isLoading, error } = useQuery<ExpiringProductsData>({
    queryKey: ["/api/analytics/expiring-products", filters],
    queryFn: async () => {
      const params = getQueryParams();
      
      const response = await fetch(`/api/analytics/expiring-products?${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch expiring products data');
      }
      
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    retry: 3,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Produtos Próximos ao Vencimento
          </CardTitle>
          <CardDescription>Margem de segurança: 3 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-sm text-muted-foreground">Carregando dados...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Produtos Próximos ao Vencimento
          </CardTitle>
          <CardDescription>Margem de segurança: 3 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-sm text-muted-foreground">Erro ao carregar dados</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Produtos Próximos ao Vencimento
          </CardTitle>
          <CardDescription>Margem de segurança: 3 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <div className="text-sm text-muted-foreground">
                Nenhum produto próximo ao vencimento!
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preparar dados para o gráfico
  const chartData = [
    {
      name: 'Vencidos',
      value: data.summary.expired,
      color: CATEGORY_CONFIG.expired.color,
    },
    {
      name: 'Crítico',
      value: data.summary.critical,
      color: CATEGORY_CONFIG.critical.color,
    },
    {
      name: 'Atenção',
      value: data.summary.warning,
      color: CATEGORY_CONFIG.warning.color,
    },
    {
      name: 'Seguro',
      value: data.summary.safe,
      color: CATEGORY_CONFIG.safe.color,
    },
  ].filter(item => item.value > 0); // Mostrar apenas categorias com dados

  // Determinar cor principal baseada na urgência
  const hasExpired = data.summary.expired > 0;
  const hasCritical = data.summary.critical > 0;
  const hasWarning = data.summary.warning > 0;

  let alertLevel = 'safe';
  let AlertIcon = CheckCircle;
  let alertColor = 'text-green-500';

  if (hasExpired) {
    alertLevel = 'expired';
    AlertIcon = XCircle;
    alertColor = 'text-red-500';
  } else if (hasCritical) {
    alertLevel = 'critical';
    AlertIcon = AlertTriangle;
    alertColor = 'text-orange-500';
  } else if (hasWarning) {
    alertLevel = 'warning';
    AlertIcon = Clock;
    alertColor = 'text-yellow-500';
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm">
            <span style={{ color: data.payload.color }}>●</span>
            {` ${data.value} produto${data.value !== 1 ? 's' : ''}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={`${alertLevel !== 'safe' ? 'border-l-4' : ''} ${
      alertLevel === 'expired' ? 'border-l-red-500' :
      alertLevel === 'critical' ? 'border-l-orange-500' :
      alertLevel === 'warning' ? 'border-l-yellow-500' : ''
    }`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertIcon className={`h-5 w-5 ${alertColor}`} />
          Produtos Próximos ao Vencimento
          {data.total > 0 && (
            <span className="ml-2 px-2 py-1 text-xs bg-gray-100 rounded-full">
              {data.total} produto{data.total !== 1 ? 's' : ''}
            </span>
          )}
        </CardTitle>
        <CardDescription>Margem de segurança: 3 meses</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Resumo de alertas */}
        {(hasExpired || hasCritical) && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-red-800">Ação Requerida</div>
                <div className="text-red-700">
                  {hasExpired && `${data.summary.expired} produto(s) já vencido(s). `}
                  {hasCritical && `${data.summary.critical} produto(s) vence(m) em menos de 30 dias.`}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}