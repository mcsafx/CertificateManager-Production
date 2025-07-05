import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, Clock, TrendingUp, AlertTriangle, Box } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface ProductBaseVolumeData {
  productBases: Array<{
    baseProductId: string;
    baseProductName: string;
    subcategoryName: string;
    categoryName: string;
    measureUnit: string;
    totalEntryVolume: number;
    totalSoldVolume: number;
    availableVolume: number;
    certificatesCount: number;
    variantsCount: number;
    suppliersCount: number;
    turnoverRate: number;
    batchesCount: number;
    activeBatchesCount: number;
    latestEntryDate: string | null;
    oldestExpirationDate: string | null;
    daysUntilOldestExpiration: number | null;
    batches: Array<{
      entryId: number;
      receivedQuantity: number;
      soldQuantity: number;
      availableQuantity: number;
      entryDate: string;
      expirationDate: string;
      internalLot: string;
      supplierLot: string;
      productName: string;
      supplierName: string;
      turnoverRate: number;
      daysUntilExpiration: number;
    }>;
  }>;
  summary: {
    totalProductBases: number;
    displayedProductBases: number;
    totalVolume: number;
    totalAvailableVolume: number;
    totalSoldVolume: number;
    totalCertificates: number;
    totalBatches: number;
    totalActiveBatches: number;
    averageTurnoverRate: number;
    productBasesWithStock: number;
    productBasesNearExpiration: number;
    period: string;
    limit: number;
  };
}

export function ProductBaseVolumeChart() {
  const [selectedProductBase, setSelectedProductBase] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'available' | 'turnover' | 'expiration'>('available');

  const { data, isLoading, error } = useQuery<ProductBaseVolumeData>({
    queryKey: ["/api/analytics/product-base-volume", { limit: 20 }], // Mostrar top 20
    staleTime: 10 * 60 * 1000, // Cache por 10 minutos
    retry: 3,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-orange-500" />
            Saldos de Estoque por Produto Base
          </CardTitle>
          <CardDescription>Volumes disponíveis detalhados</CardDescription>
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
            <Package className="h-5 w-5 text-orange-500" />
            Saldos de Estoque por Produto Base
          </CardTitle>
          <CardDescription>Volumes disponíveis detalhados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-sm text-muted-foreground">Erro ao carregar dados</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.productBases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-gray-500" />
            Saldos de Estoque por Produto Base
          </CardTitle>
          <CardDescription>Volumes disponíveis detalhados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <div className="text-sm text-muted-foreground">
                Nenhum produto base com dados no período
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Função para ordenar os produtos
  const sortedProducts = [...data.productBases].sort((a, b) => {
    switch (sortBy) {
      case 'available':
        return b.availableVolume - a.availableVolume;
      case 'turnover':
        return b.turnoverRate - a.turnoverRate;
      case 'expiration':
        if (a.daysUntilOldestExpiration === null) return 1;
        if (b.daysUntilOldestExpiration === null) return -1;
        return a.daysUntilOldestExpiration - b.daysUntilOldestExpiration;
      default:
        return b.availableVolume - a.availableVolume;
    }
  });

  // Função para determinar a cor do badge de urgência
  const getUrgencyBadge = (daysUntilExpiration: number | null) => {
    if (daysUntilExpiration === null) return null;
    
    if (daysUntilExpiration < 0) {
      return <Badge variant="destructive" className="text-xs">Vencido</Badge>;
    } else if (daysUntilExpiration <= 30) {
      return <Badge variant="destructive" className="text-xs">{daysUntilExpiration}d</Badge>;
    } else if (daysUntilExpiration <= 90) {
      return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">{daysUntilExpiration}d</Badge>;
    } else {
      return <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">{daysUntilExpiration}d</Badge>;
    }
  };

  const selectedProductData = selectedProductBase 
    ? data.productBases.find(pb => pb.baseProductId === selectedProductBase)
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-orange-500" />
          Saldos de Estoque por Produto Base
          <span className="ml-2 px-2 py-1 text-xs bg-gray-100 rounded-full">
            {data.summary.displayedProductBases} de {data.summary.totalProductBases}
          </span>
        </CardTitle>
        <CardDescription>
          Últimos {data.summary.period === '365d' ? '12 meses' : data.summary.period} - Volumes disponíveis e vencimentos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Métricas de resumo */}
          <div className="grid grid-cols-5 gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-sm text-gray-600">Estoque Disponível</div>
              <div className="text-lg font-bold text-green-600">
                {data.summary.totalAvailableVolume.toFixed(1)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Com Estoque</div>
              <div className="text-lg font-bold text-blue-600">
                {data.summary.productBasesWithStock}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Próx. Vencimento</div>
              <div className="text-lg font-bold text-orange-600">
                {data.summary.productBasesNearExpiration}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Taxa Rotatividade</div>
              <div className="text-lg font-bold text-purple-600">
                {data.summary.averageTurnoverRate}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Lotes Ativos</div>
              <div className="text-lg font-bold text-teal-600">
                {data.summary.totalActiveBatches}
              </div>
            </div>
          </div>

          {/* Controles de ordenação */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setSortBy('available')}
              className={`px-3 py-1 text-sm rounded ${
                sortBy === 'available' 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Por Volume Disponível
            </button>
            <button
              onClick={() => setSortBy('turnover')}
              className={`px-3 py-1 text-sm rounded ${
                sortBy === 'turnover' 
                  ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Por Rotatividade
            </button>
            <button
              onClick={() => setSortBy('expiration')}
              className={`px-3 py-1 text-sm rounded ${
                sortBy === 'expiration' 
                  ? 'bg-orange-100 text-orange-700 border border-orange-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Por Vencimento
            </button>
          </div>

          {/* Tabela de produtos */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto Base</TableHead>
                  <TableHead className="text-right">Disponível</TableHead>
                  <TableHead className="text-right">Rotatividade</TableHead>
                  <TableHead className="text-center">Lotes</TableHead>
                  <TableHead className="text-center">Vencimento</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProducts.slice(0, 10).map((product) => (
                  <TableRow 
                    key={product.baseProductId}
                    className={`cursor-pointer hover:bg-gray-50 ${
                      selectedProductBase === product.baseProductId 
                        ? 'bg-orange-50 border-l-4 border-orange-400' 
                        : ''
                    }`}
                    onClick={() => setSelectedProductBase(
                      selectedProductBase === product.baseProductId ? null : product.baseProductId
                    )}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">
                          {product.baseProductName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {product.categoryName} → {product.subcategoryName}
                        </div>
                        <div className="text-xs text-gray-400">
                          {product.variantsCount} variante{product.variantsCount !== 1 ? 's' : ''} | 
                          {product.suppliersCount} fornecedor{product.suppliersCount !== 1 ? 'es' : ''}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        {product.availableVolume.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {product.measureUnit}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="text-sm font-medium">
                        {product.turnoverRate}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {product.totalSoldVolume.toFixed(1)} vendido
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Box className="h-3 w-3 text-blue-500" />
                        <span className="text-sm font-medium">{product.activeBatchesCount}</span>
                        <span className="text-xs text-gray-500">/{product.batchesCount}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {getUrgencyBadge(product.daysUntilOldestExpiration)}
                    </TableCell>
                    <TableCell className="text-center">
                      {product.daysUntilOldestExpiration !== null && product.daysUntilOldestExpiration <= 30 && (
                        <AlertTriangle className="h-4 w-4 text-red-500 mx-auto" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Detalhes do produto selecionado */}
          {selectedProductData && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-md">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                <div className="font-medium text-orange-800">
                  Detalhes: {selectedProductData.baseProductName}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-sm">
                  <span className="text-orange-700">Volume Total Entrada:</span>
                  <span className="font-medium ml-2">{selectedProductData.totalEntryVolume.toFixed(2)} {selectedProductData.measureUnit}</span>
                </div>
                <div className="text-sm">
                  <span className="text-orange-700">Volume Vendido:</span>
                  <span className="font-medium ml-2">{selectedProductData.totalSoldVolume.toFixed(2)} {selectedProductData.measureUnit}</span>
                </div>
                <div className="text-sm">
                  <span className="text-orange-700">Volume Disponível:</span>
                  <span className="font-medium ml-2 text-green-600">{selectedProductData.availableVolume.toFixed(2)} {selectedProductData.measureUnit}</span>
                </div>
              </div>

              {/* Lista de lotes */}
              {selectedProductData.batches.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-orange-700 mb-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Lotes Disponíveis (ordenados por vencimento):
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedProductData.batches
                      .filter(batch => batch.availableQuantity > 0)
                      .slice(0, 5)
                      .map((batch) => (
                        <div key={batch.entryId} className="text-xs bg-white p-3 rounded border">
                          <div className="flex justify-between items-start mb-1">
                            <div className="font-medium">{batch.productName}</div>
                            {getUrgencyBadge(batch.daysUntilExpiration)}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-gray-600">
                            <div>Lote: {batch.internalLot}</div>
                            <div>Fornecedor: {batch.supplierName}</div>
                            <div>Disponível: <span className="font-medium text-green-600">{batch.availableQuantity.toFixed(2)}</span></div>
                            <div>Vencimento: {new Date(batch.expirationDate).toLocaleDateString('pt-BR')}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                  {selectedProductData.batches.filter(b => b.availableQuantity > 0).length > 5 && (
                    <div className="text-xs text-gray-500 mt-2 text-center">
                      + {selectedProductData.batches.filter(b => b.availableQuantity > 0).length - 5} lotes adicionais
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Dica de interação */}
          <div className="text-xs text-gray-500 text-center">
            Clique em um produto para ver detalhes dos lotes | 
            Produtos com ⚠️ têm lotes próximos do vencimento
          </div>
        </div>
      </CardContent>
    </Card>
  );
}