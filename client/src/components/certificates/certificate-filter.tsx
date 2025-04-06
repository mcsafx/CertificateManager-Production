import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Product, Supplier, Manufacturer } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { useState, useEffect } from "react";

export interface CertificateFilters {
  productId?: string;
  supplierId?: string;
  manufacturerId?: string;
  internalLot?: string;
  referenceDocument?: string;
  startDate?: string;
  endDate?: string;
}

interface CertificateFilterProps {
  onFilterChange: (filters: CertificateFilters) => void;
}

export function CertificateFilter({ onFilterChange }: CertificateFilterProps) {
  const [filters, setFilters] = useState<CertificateFilters>({});
  
  // Fetch data for select dropdowns
  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });
  
  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });
  
  const { data: manufacturers } = useQuery<Manufacturer[]>({
    queryKey: ["/api/manufacturers"],
  });
  
  // Handle filter input changes
  const handleFilterChange = (field: keyof CertificateFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value || undefined // Only set defined values
    }));
  };
  
  // Apply filters
  const applyFilters = () => {
    onFilterChange(filters);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({});
    onFilterChange({});
  };
  
  // Apply filters on mount if any are present
  useEffect(() => {
    if (Object.values(filters).some(v => v !== undefined)) {
      onFilterChange(filters);
    }
  }, []);

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-gray-500 mb-1 block">Produto</label>
            <Select
              value={filters.productId}
              onValueChange={(value) => handleFilterChange('productId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os produtos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os produtos</SelectItem>
                {products?.map((product) => (
                  <SelectItem key={product.id} value={product.id.toString()}>
                    {product.technicalName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500 mb-1 block">Fornecedor</label>
            <Select
              value={filters.supplierId}
              onValueChange={(value) => handleFilterChange('supplierId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os fornecedores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os fornecedores</SelectItem>
                {suppliers?.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id.toString()}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500 mb-1 block">Fabricante</label>
            <Select
              value={filters.manufacturerId}
              onValueChange={(value) => handleFilterChange('manufacturerId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os fabricantes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os fabricantes</SelectItem>
                {manufacturers?.map((manufacturer) => (
                  <SelectItem key={manufacturer.id} value={manufacturer.id.toString()}>
                    {manufacturer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500 mb-1 block">Lote Interno</label>
            <Input
              value={filters.internalLot || ""}
              onChange={(e) => handleFilterChange('internalLot', e.target.value)}
              placeholder="Nº do lote"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500 mb-1 block">Documento Referência</label>
            <Input
              value={filters.referenceDocument || ""}
              onChange={(e) => handleFilterChange('referenceDocument', e.target.value)}
              placeholder="NF ou Invoice"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500 mb-1 block">Data Inicial</label>
            <Input
              type="date"
              value={filters.startDate || ""}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500 mb-1 block">Data Final</label>
            <Input
              type="date"
              value={filters.endDate || ""}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            className="mr-2"
            onClick={clearFilters}
          >
            <X className="h-4 w-4 mr-2" /> Limpar Filtros
          </Button>
          <Button onClick={applyFilters}>
            <Search className="h-4 w-4 mr-2" /> Aplicar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
