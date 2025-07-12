import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDashboardFilters } from "@/contexts/dashboard-filters-context";
import { useQuery } from "@tanstack/react-query";
import { Filter, RotateCcw, Calendar, Package, Building2, CheckCircle2 } from "lucide-react";

export function DashboardFilters() {
  const { filters, setFilters, resetFilters } = useDashboardFilters();

  // Fetch options for dropdowns
  const { data: categories } = useQuery({
    queryKey: ['/api/product-categories'],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const { data: subcategories } = useQuery({
    queryKey: ['/api/product-subcategories'],
    staleTime: 5 * 60 * 1000,
  });

  const { data: suppliers } = useQuery({
    queryKey: ['/api/suppliers'],
    staleTime: 5 * 60 * 1000,
  });

  const { data: productBases } = useQuery({
    queryKey: ['/api/product-base'],
    staleTime: 5 * 60 * 1000,
  });

  // Filter subcategories based on selected category
  const filteredSubcategories = subcategories?.filter(
    (sub: any) => !filters.categoryId || sub.categoryId.toString() === filters.categoryId
  );

  const periodOptions = [
    { value: '7d', label: 'Últimos 7 dias' },
    { value: '30d', label: 'Últimos 30 dias' },
    { value: '90d', label: 'Últimos 3 meses' },
    { value: '365d', label: 'Último ano' },
  ];

  const statusOptions = [
    { value: 'all', label: 'Todos os status' },
    { value: 'approved', label: 'Apenas aprovados' },
    { value: 'pending', label: 'Pendentes' },
  ];

  const hasActiveFilters = filters.categoryId || filters.subcategoryId || 
                          filters.supplierId || filters.productBaseId || 
                          (filters.status && filters.status !== 'all') || filters.period !== '365d';

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-500" />
            Filtros do Dashboard
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                Filtros ativos
              </Badge>
            )}
          </div>
          {hasActiveFilters && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetFilters}
              className="text-sm"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Limpar Filtros
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Período */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Período
            </label>
            <Select 
              value={filters.period} 
              onValueChange={(value: any) => setFilters({ period: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Status
            </label>
            <Select 
              value={filters.status || 'all'} 
              onValueChange={(value: any) => setFilters({ status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1">
              <Package className="h-3 w-3" />
              Categoria
            </label>
            <Select 
              value={filters.categoryId || undefined} 
              onValueChange={(value) => setFilters({ 
                categoryId: value === "all" ? undefined : value,
                subcategoryId: undefined // Reset subcategory when category changes
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories?.map((category: any) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subcategoria */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Subcategoria</label>
            <Select 
              value={filters.subcategoryId || undefined} 
              onValueChange={(value) => setFilters({ subcategoryId: value === "all" ? undefined : value })}
              disabled={!filters.categoryId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as subcategorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as subcategorias</SelectItem>
                {filteredSubcategories?.map((subcategory: any) => (
                  <SelectItem key={subcategory.id} value={subcategory.id.toString()}>
                    {subcategory.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fornecedor */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              Fornecedor
            </label>
            <Select 
              value={filters.supplierId || undefined} 
              onValueChange={(value) => setFilters({ supplierId: value === "all" ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os fornecedores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os fornecedores</SelectItem>
                {suppliers?.map((supplier: any) => (
                  <SelectItem key={supplier.id} value={supplier.id.toString()}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Produto Base */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Produto Base</label>
            <Select 
              value={filters.productBaseId || undefined} 
              onValueChange={(value) => setFilters({ productBaseId: value === "all" ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os produtos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os produtos</SelectItem>
                {productBases?.map((productBase: any) => (
                  <SelectItem key={productBase.id} value={productBase.id.toString()}>
                    {productBase.technicalName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-gray-600 mb-2">Filtros ativos:</div>
            <div className="flex flex-wrap gap-2">
              {filters.period !== '365d' && (
                <Badge variant="outline">
                  {periodOptions.find(p => p.value === filters.period)?.label}
                </Badge>
              )}
              {filters.status !== 'all' && (
                <Badge variant="outline">
                  {statusOptions.find(s => s.value === filters.status)?.label}
                </Badge>
              )}
              {filters.categoryId && (
                <Badge variant="outline">
                  {categories?.find((c: any) => c.id.toString() === filters.categoryId)?.name}
                </Badge>
              )}
              {filters.subcategoryId && (
                <Badge variant="outline">
                  {subcategories?.find((s: any) => s.id.toString() === filters.subcategoryId)?.name}
                </Badge>
              )}
              {filters.supplierId && (
                <Badge variant="outline">
                  {suppliers?.find((s: any) => s.id.toString() === filters.supplierId)?.name}
                </Badge>
              )}
              {filters.productBaseId && (
                <Badge variant="outline">
                  {productBases?.find((p: any) => p.id.toString() === filters.productBaseId)?.technicalName}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}