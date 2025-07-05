import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { BarChart3, Package, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface CategoryVolumeData {
  categories: Array<{
    categoryId: string;
    categoryName: string;
    totalEntryVolume: number;
    totalIssuedVolume: number;
    certificatesCount: number;
    productsCount: number;
    percentage: number;
    subcategories: Array<{
      subcategoryId: string;
      subcategoryName: string;
      entryVolume: number;
      issuedVolume: number;
      certificatesCount: number;
    }>;
  }>;
  summary: {
    totalCategories: number;
    totalVolume: number;
    totalCertificates: number;
    totalProducts: number;
    period: string;
  };
}

const CHART_COLORS = [
  '#3b82f6', // Azul
  '#10b981', // Verde
  '#f59e0b', // Amarelo
  '#ef4444', // Vermelho
  '#8b5cf6', // Roxo
  '#06b6d4', // Ciano
  '#f97316', // Laranja
  '#84cc16', // Lima
  '#ec4899', // Rosa
  '#6b7280', // Cinza
];

export function CategoryVolumeChart() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<CategoryVolumeData>({
    queryKey: ["/api/analytics/category-volume"],
    staleTime: 15 * 60 * 1000, // Cache por 15 minutos
    retry: 3,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-500" />
            Volume por Categoria
          </CardTitle>
          <CardDescription>Últimos 30 dias</CardDescription>
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
            <BarChart3 className="h-5 w-5 text-purple-500" />
            Volume por Categoria
          </CardTitle>
          <CardDescription>Últimos 30 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-sm text-muted-foreground">Erro ao carregar dados</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.categories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-gray-500" />
            Volume por Categoria
          </CardTitle>
          <CardDescription>Últimos 30 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <div className="text-sm text-muted-foreground">
                Nenhuma categoria com dados no período
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preparar dados para o gráfico (mostrar apenas top 10)
  const topCategories = data.categories.slice(0, 10);
  const chartData = topCategories.map((category, index) => ({
    name: category.categoryName,
    value: category.totalEntryVolume,
    percentage: category.percentage,
    certificates: category.certificatesCount,
    products: category.productsCount,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium">{data.name}</p>
          <div className="space-y-1 text-sm">
            <div>Volume: <span className="font-medium">{data.value.toFixed(2)}</span></div>
            <div>Percentual: <span className="font-medium">{data.percentage}%</span></div>
            <div>Certificados: <span className="font-medium">{data.certificates}</span></div>
            <div>Produtos: <span className="font-medium">{data.products}</span></div>
          </div>
        </div>
      );
    }
    return null;
  };

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(selectedCategory === categoryName ? null : categoryName);
  };

  const selectedCategoryData = selectedCategory 
    ? data.categories.find(cat => cat.categoryName === selectedCategory)
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-purple-500" />
          Volume por Categoria
          <span className="ml-2 px-2 py-1 text-xs bg-gray-100 rounded-full">
            {data.summary.totalCategories} categoria{data.summary.totalCategories !== 1 ? 's' : ''}
          </span>
        </CardTitle>
        <CardDescription>
          {data.summary.period === '30d' ? 'Últimos 30 dias' : 
           data.summary.period === '90d' ? 'Últimos 90 dias' : 'Último ano'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Métricas de resumo */}
          <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-sm text-gray-600">Volume Total</div>
              <div className="text-lg font-bold text-purple-600">
                {data.summary.totalVolume.toFixed(1)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Certificados</div>
              <div className="text-lg font-bold text-blue-600">
                {data.summary.totalCertificates}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Produtos</div>
              <div className="text-lg font-bold text-green-600">
                {data.summary.totalProducts}
              </div>
            </div>
          </div>

          {/* Gráfico de pizza */}
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                onClick={(entry) => handleCategoryClick(entry.name)}
                style={{ cursor: 'pointer' }}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke={selectedCategory === entry.name ? '#000' : 'none'}
                    strokeWidth={selectedCategory === entry.name ? 2 : 0}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                formatter={(value, entry: any) => 
                  `${value} (${entry.payload.percentage}%)`
                }
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Lista de categorias */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Top Categorias</div>
            {topCategories.slice(0, 5).map((category, index) => (
              <div 
                key={category.categoryId}
                className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                  selectedCategory === category.categoryName 
                    ? 'bg-purple-50 border border-purple-200' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleCategoryClick(category.categoryName)}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <span className="text-sm font-medium">{category.categoryName}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {category.percentage}%
                </div>
              </div>
            ))}
          </div>

          {/* Detalhes da categoria selecionada */}
          {selectedCategoryData && selectedCategoryData.subcategories.length > 0 && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <div className="font-medium text-purple-800">
                  Subcategorias de {selectedCategoryData.categoryName}
                </div>
              </div>
              <div className="space-y-2">
                {selectedCategoryData.subcategories
                  .sort((a, b) => b.entryVolume - a.entryVolume)
                  .slice(0, 5)
                  .map((sub) => (
                    <div key={sub.subcategoryId} className="flex justify-between text-sm">
                      <span className="text-purple-700">{sub.subcategoryName}</span>
                      <div className="text-purple-600">
                        {sub.entryVolume.toFixed(1)} ({sub.certificatesCount} cert.)
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Dica de interação */}
          <div className="text-xs text-gray-500 text-center">
            Clique em uma categoria para ver subcategorias
          </div>
        </div>
      </CardContent>
    </Card>
  );
}