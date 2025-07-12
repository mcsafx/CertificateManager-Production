import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Package2, TrendingUp, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useDashboardFilters } from "@/contexts/dashboard-filters-context";

interface SubcategoryVolumeData {
  subcategories: Array<{
    subcategoryId: string;
    subcategoryName: string;
    categoryName: string;
    totalEntryVolume: number;
    totalSoldVolume: number;
    availableVolume: number;
    certificatesCount: number;
    productsCount: number;
    turnoverRate: number;
    percentage: number;
    entries: Array<{
      entryId: number;
      receivedQuantity: number;
      soldQuantity: number;
      productName: string;
    }>;
  }>;
  summary: {
    totalSubcategories: number;
    totalVolume: number;
    totalAvailableVolume: number;
    totalSoldVolume: number;
    totalCertificates: number;
    totalProducts: number;
    averageTurnoverRate: number;
    period: string;
  };
}

export function SubcategoryVolumeChart() {
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const { filters, getQueryParams } = useDashboardFilters();

  const { data, isLoading, error } = useQuery<SubcategoryVolumeData>({
    queryKey: ["/api/analytics/subcategory-volume", filters],
    queryFn: async () => {
      const params = getQueryParams();
      
      const response = await fetch(`/api/analytics/subcategory-volume?${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch subcategory volume data');
      }
      
      return response.json();
    },
    staleTime: 15 * 60 * 1000, // Cache por 15 minutos
    retry: 3,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package2 className="h-5 w-5 text-blue-500" />
            Volume por Subcategoria
          </CardTitle>
          <CardDescription>Saldos de estoque disponíveis</CardDescription>
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
            <Package2 className="h-5 w-5 text-blue-500" />
            Volume por Subcategoria
          </CardTitle>
          <CardDescription>Saldos de estoque disponíveis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-sm text-muted-foreground">Erro ao carregar dados</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.subcategories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package2 className="h-5 w-5 text-gray-500" />
            Volume por Subcategoria
          </CardTitle>
          <CardDescription>Saldos de estoque disponíveis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Package2 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <div className="text-sm text-muted-foreground">
                Nenhuma subcategoria com dados no período
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preparar dados para o gráfico (mostrar apenas top 8 para melhor visualização)
  const topSubcategories = data.subcategories.slice(0, 8);
  const chartData = topSubcategories.map(subcategory => ({
    name: subcategory.subcategoryName.length > 15 
      ? subcategory.subcategoryName.substring(0, 15) + '...'
      : subcategory.subcategoryName,
    fullName: subcategory.subcategoryName,
    category: subcategory.categoryName,
    disponivel: subcategory.availableVolume,
    vendido: subcategory.totalSoldVolume,
    total: subcategory.totalEntryVolume,
    turnover: subcategory.turnoverRate,
    certificates: subcategory.certificatesCount,
    products: subcategory.productsCount,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium">{data.fullName}</p>
          <p className="text-sm text-gray-600">Categoria: {data.category}</p>
          <div className="space-y-1 text-sm mt-2">
            <div className="flex justify-between">
              <span className="text-green-600">Disponível:</span>
              <span className="font-medium">{data.disponivel.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-600">Vendido:</span>
              <span className="font-medium">{data.vendido.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-600">Total Entrada:</span>
              <span className="font-medium">{data.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-600">Taxa Rotatividade:</span>
              <span className="font-medium">{data.turnover}%</span>
            </div>
            <div className="border-t pt-1 mt-2">
              <div className="flex justify-between">
                <span>Certificados:</span>
                <span className="font-medium">{data.certificates}</span>
              </div>
              <div className="flex justify-between">
                <span>Produtos:</span>
                <span className="font-medium">{data.products}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const handleBarClick = (subcategoryName: string) => {
    setSelectedSubcategory(selectedSubcategory === subcategoryName ? null : subcategoryName);
  };

  const selectedSubcategoryData = selectedSubcategory 
    ? data.subcategories.find(sub => sub.subcategoryName === selectedSubcategory)
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package2 className="h-5 w-5 text-blue-500" />
          Volume por Subcategoria
          <span className="ml-2 px-2 py-1 text-xs bg-gray-100 rounded-full">
            {data.summary.totalSubcategories} subcategoria{data.summary.totalSubcategories !== 1 ? 's' : ''}
          </span>
        </CardTitle>
        <CardDescription>
          {data.summary.period === '30d' ? 'Últimos 30 dias' : 
           data.summary.period === '90d' ? 'Últimos 90 dias' : 'Último ano'} - Saldos disponíveis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Métricas de resumo */}
          <div className="grid grid-cols-4 gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-sm text-gray-600">Volume Disponível</div>
              <div className="text-lg font-bold text-green-600">
                {data.summary.totalAvailableVolume.toFixed(1)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Volume Vendido</div>
              <div className="text-lg font-bold text-red-600">
                {data.summary.totalSoldVolume.toFixed(1)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Taxa Rotatividade</div>
              <div className="text-lg font-bold text-purple-600">
                {data.summary.averageTurnoverRate}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Produtos</div>
              <div className="text-lg font-bold text-blue-600">
                {data.summary.totalProducts}
              </div>
            </div>
          </div>

          {/* Gráfico de barras */}
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={60}
                fontSize={12}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="disponivel" 
                name="Disponível" 
                fill="#10b981"
                onClick={(data: any) => handleBarClick(data.fullName)}
                style={{ cursor: 'pointer' }}
              />
              <Bar 
                dataKey="vendido" 
                name="Vendido" 
                fill="#ef4444"
                onClick={(data: any) => handleBarClick(data.fullName)}
                style={{ cursor: 'pointer' }}
              />
            </BarChart>
          </ResponsiveContainer>

          {/* Lista de subcategorias */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Top Subcategorias (por volume disponível)</div>
            {topSubcategories.slice(0, 5).map((subcategory, index) => (
              <div 
                key={subcategory.subcategoryId}
                className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                  selectedSubcategory === subcategory.subcategoryName 
                    ? 'bg-blue-50 border border-blue-200' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleBarClick(subcategory.subcategoryName)}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <div>
                    <span className="text-sm font-medium">{subcategory.subcategoryName}</span>
                    <div className="text-xs text-gray-500">{subcategory.categoryName}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-600">
                    {subcategory.availableVolume.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {subcategory.turnoverRate}% rotatividade
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detalhes da subcategoria selecionada */}
          {selectedSubcategoryData && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="h-4 w-4 text-blue-500" />
                <div className="font-medium text-blue-800">
                  Detalhes: {selectedSubcategoryData.subcategoryName}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="text-sm">
                  <span className="text-blue-700">Volume Disponível:</span>
                  <span className="font-medium ml-2">{selectedSubcategoryData.availableVolume.toFixed(2)}</span>
                </div>
                <div className="text-sm">
                  <span className="text-blue-700">Volume Vendido:</span>
                  <span className="font-medium ml-2">{selectedSubcategoryData.totalSoldVolume.toFixed(2)}</span>
                </div>
                <div className="text-sm">
                  <span className="text-blue-700">Certificados:</span>
                  <span className="font-medium ml-2">{selectedSubcategoryData.certificatesCount}</span>
                </div>
                <div className="text-sm">
                  <span className="text-blue-700">Produtos Únicos:</span>
                  <span className="font-medium ml-2">{selectedSubcategoryData.productsCount}</span>
                </div>
              </div>

              {/* Mostrar alguns lotes se disponível */}
              {selectedSubcategoryData.entries.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-blue-700 mb-2">
                    Principais Lotes (primeiros 3):
                  </div>
                  <div className="space-y-1">
                    {selectedSubcategoryData.entries.slice(0, 3).map((entry) => (
                      <div key={entry.entryId} className="text-xs text-blue-600 bg-white p-2 rounded">
                        <div className="font-medium">{entry.productName}</div>
                        <div>
                          Entrada: {entry.receivedQuantity.toFixed(2)} | 
                          Vendido: {entry.soldQuantity.toFixed(2)} | 
                          Disponível: {Math.max(0, entry.receivedQuantity - entry.soldQuantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dica de interação */}
          <div className="text-xs text-gray-500 text-center">
            Clique em uma barra ou subcategoria para ver detalhes
          </div>
        </div>
      </CardContent>
    </Card>
  );
}