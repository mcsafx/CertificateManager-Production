import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Package, Pencil, Search, Trash2, Plus } from "lucide-react";
import { ProductForm } from "@/components/products/product-form";

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  
  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/products"],
  });
  
  // Filter products based on search query
  const filteredProducts = products
    ? products.filter(product => 
        product.technicalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.commercialName && product.commercialName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.internalCode && product.internalCode.toLowerCase().includes(searchQuery.toLowerCase()))
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-medium">Produtos</h1>
          <div className="flex space-x-3">
            <Button variant="outline" asChild>
              <a href="/package-types">
                <Package className="h-4 w-4 mr-2" />
                Tipos de Embalagem
              </a>
            </Button>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </div>
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
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          {searchQuery 
                            ? "Nenhum produto encontrado com os critérios de busca"
                            : "Nenhum produto cadastrado ainda"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>{product.technicalName}</TableCell>
                          <TableCell>{product.commercialName || "-"}</TableCell>
                          <TableCell>{product.internalCode || "-"}</TableCell>
                          <TableCell>{product.defaultMeasureUnit}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" asChild>
                              <a href={`/products/${product.id}`}>Ver Características</a>
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedProductId ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
          </DialogHeader>
          <ProductForm 
            productId={selectedProductId} 
            onSuccess={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
