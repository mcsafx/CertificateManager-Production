import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Package, Pencil, Search, Trash2, Plus, ChevronLeft, Boxes, FolderTree } from "lucide-react";
import { ProductForm } from "@/components/products/product-form";
import { Product, ProductBase } from "@shared/schema";
import { Link, useLocation } from "wouter";

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [baseProductId, setBaseProductId] = useState<number | null>(null);
  const [location] = useLocation();
  
  // Extract baseProductId from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const baseProductIdParam = params.get("baseProductId");
    if (baseProductIdParam) {
      setBaseProductId(Number(baseProductIdParam));
    }
  }, [location]);
  
  // Get product base details if baseProductId is available
  const { data: productBase } = useQuery<ProductBase>({
    queryKey: [`/api/product-base/${baseProductId}`],
    enabled: !!baseProductId,
  });
  
  // Get products (variants)
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", { baseProductId }],
    queryFn: async () => {
      const endpoint = baseProductId 
        ? `/api/products?baseProductId=${baseProductId}`
        : "/api/products";
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      return response.json();
    },
  });
  
  // Filter products based on search query
  const filteredProducts = products
    ? products.filter(product => 
        product.technicalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.commercialName && product.commercialName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.internalCode && product.internalCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];
  
  const handleEdit = (productId: number) => {
    setSelectedProductId(productId);
    setIsDialogOpen(true);
  };
  
  const handleAddNew = () => {
    setSelectedProductId(null);
    setIsDialogOpen(true);
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center mb-4 gap-2">
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/product-categories">
                <FolderTree className="h-4 w-4 mr-1" />
                Categorias
              </Link>
            </Button>
            
            {baseProductId && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/product-base">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Voltar para Produtos Base
                </Link>
              </Button>
            )}
          </div>
          
          {productBase && (
            <h1 className="text-2xl font-medium ml-2">
              Variantes de {productBase.technicalName}
            </h1>
          )}
          
          {!productBase && (
            <h1 className="text-2xl font-medium ml-2">
              Produtos
            </h1>
          )}
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-3">
            <Button variant="outline" asChild>
              <Link href="/package-types">
                <Boxes className="h-4 w-4 mr-2" />
                Tipos de Embalagem
              </Link>
            </Button>
          </div>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            {baseProductId ? "Nova Variante" : "Novo Produto"}
          </Button>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Buscar Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Buscar por nome técnico, comercial ou código..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Nome Técnico</TableHead>
                      <TableHead>Nome Comercial</TableHead>
                      <TableHead>Código Interno</TableHead>
                      <TableHead>Unidade Padrão</TableHead>
                      <TableHead>Características</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          {searchQuery 
                            ? "Nenhum produto encontrado com os critérios de busca"
                            : "Nenhum produto cadastrado ainda"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>{product.sku || "-"}</TableCell>
                          <TableCell>{product.technicalName}</TableCell>
                          <TableCell>{product.commercialName || "-"}</TableCell>
                          <TableCell>{product.internalCode || "-"}</TableCell>
                          <TableCell>{product.defaultMeasureUnit}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/products/${product.id}`}>Ver Características</Link>
                            </Button>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEdit(product.id)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedProductId ? "Editar Produto" : (baseProductId ? "Nova Variante" : "Novo Produto")}
            </DialogTitle>
          </DialogHeader>
          <ProductForm 
            productId={selectedProductId}
            defaultBaseProductId={baseProductId} 
            onSuccess={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
