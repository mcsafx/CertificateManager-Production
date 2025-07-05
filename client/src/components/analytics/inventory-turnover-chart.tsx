import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Package2, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface InventoryTurnoverData {
  data: Array<{
    entryId: number;
    productName: string;
    supplierName: string;
    daysInStock: number;
    sellThroughRate: number;
    salesVelocity: number;
    receivedQuantity: number;
    totalSold: number;
    remainingQuantity: number;
  }>;
  summary: {
    totalProducts: number;
    averageDaysInStock: number;
    averageSellThroughRate: number;
  };
}

export function InventoryTurnoverChart() {
  const { data, isLoading, error } = useQuery<InventoryTurnoverData>({
    queryKey: ["/api/analytics/inventory-turnover"],
    staleTime: 10 * 60 * 1000, // Cache por 10 minutos
    retry: 3,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Rotatividade de Estoque
          </CardTitle>
          <CardDescription>Tempo no estoque vs quantidade vendida</CardDescription>
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
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Rotatividade de Estoque
          </CardTitle>
          <CardDescription>Tempo no estoque vs quantidade vendida</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-sm text-muted-foreground">Erro ao carregar dados</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package2 className="h-5 w-5 text-gray-500" />
            Rotatividade de Estoque
          </CardTitle>
          <CardDescription>Tempo no estoque vs quantidade vendida</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Package2 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <div className="text-sm text-muted-foreground">
                Dados insuficientes para análise
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Determinar cor dos pontos baseada na performance
  const chartData = data.data.map(item => {
    // Alta rotatividade: poucos dias no estoque + alta taxa de venda
    const isHighPerformance = item.daysInStock <= 30 && item.sellThroughRate >= 70;
    // Baixa rotatividade: muitos dias no estoque + baixa taxa de venda  
    const isLowPerformance = item.daysInStock >= 90 && item.sellThroughRate <= 30;
    
    let color = '#3b82f6'; // Azul padrão
    if (isHighPerformance) {
      color = '#16a34a'; // Verde - boa performance
    } else if (isLowPerformance) {
      color = '#dc2626'; // Vermelho - baixa performance
    }

    return {
      ...item,
      x: item.daysInStock,
      y: item.totalSold,
      color,
      size: Math.min(Math.max(item.receivedQuantity / 10, 20), 100), // Tamanho proporcional
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow-lg max-w-xs">
          <p className="font-medium text-sm truncate">{data.productName}</p>
          <p className="text-xs text-gray-600 mb-2">{data.supplierName}</p>
          <div className="space-y-1 text-xs">
            <div>Dias no estoque: <span className="font-medium">{data.daysInStock}</span></div>
            <div>Quantidade vendida: <span className="font-medium">{data.totalSold}</span></div>
            <div>Taxa de venda: <span className="font-medium">{data.sellThroughRate}%</span></div>
            <div>Estoque restante: <span className="font-medium">{data.remainingQuantity}</span></div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Categorizar produtos por performance
  const highPerformance = chartData.filter(item => item.color === '#16a34a').length;
  const lowPerformance = chartData.filter(item => item.color === '#dc2626').length;
  const mediumPerformance = chartData.length - highPerformance - lowPerformance;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          Rotatividade de Estoque
          <span className="ml-2 px-2 py-1 text-xs bg-gray-100 rounded-full">
            {data.data.length} produto{data.data.length !== 1 ? 's' : ''}
          </span>
        </CardTitle>
        <CardDescription>Tempo no estoque vs quantidade vendida</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Métricas de resumo */}
          <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-sm text-gray-600">Tempo Médio</div>
              <div className="text-lg font-bold text-blue-600">
                {data.summary.averageDaysInStock} dias
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Taxa Média</div>
              <div className="text-lg font-bold text-purple-600">
                {data.summary.averageSellThroughRate}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Alta Performance</div>
              <div className="text-lg font-bold text-green-600">
                {highPerformance}
              </div>
            </div>
          </div>

          {/* Gráfico de dispersão */}
          <ResponsiveContainer width="100%" height={250}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="Dias no Estoque"
                tick={{ fontSize: 12 }}
                label={{ value: 'Dias no Estoque', position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Quantidade Vendida"
                tick={{ fontSize: 12 }}
                label={{ value: 'Quantidade Vendida', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              {/* Pontos de alta performance */}
              <Scatter 
                data={chartData.filter(item => item.color === '#16a34a')} 
                fill="#16a34a"
                name="Alta Performance"
              />
              {/* Pontos de baixa performance */}
              <Scatter 
                data={chartData.filter(item => item.color === '#dc2626')} 
                fill="#dc2626"
                name="Baixa Performance"
              />
              {/* Pontos de performance média */}
              <Scatter 
                data={chartData.filter(item => item.color === '#3b82f6')} 
                fill="#3b82f6"
                name="Performance Média"
              />
            </ScatterChart>
          </ResponsiveContainer>

          {/* Legenda e insights */}
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Alta rotatividade ({highPerformance})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Rotatividade média ({mediumPerformance})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Baixa rotatividade ({lowPerformance})</span>
            </div>
          </div>

          {/* Alerta para produtos de baixa performance */}
          {lowPerformance > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-yellow-500 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-yellow-800">Oportunidade de Otimização</div>
                  <div className="text-yellow-700">
                    {lowPerformance} produto(s) com baixa rotatividade podem precisar de ação.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}