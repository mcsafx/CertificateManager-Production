import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Database, Pencil, Search, Trash2, Plus, ChevronLeft, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProductBaseForm } from "@/components/products/product-base-form";
import { ProductBase, ProductSubcategory } from "@shared/schema";
import { Link, useLocation } from "wouter";

export default function ProductBasePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProductBaseId, setSelectedProductBaseId] = useState<number | null>(null);
  const [subcategoryId, setSubcategoryId] = useState<number | null>(null);
  const [location] = useLocation();
  const { toast } = useToast();
  
  // Extract subcategoryId from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const subcategoryIdParam = params.get("subcategoryId");
    if (subcategoryIdParam) {
      setSubcategoryId(Number(subcategoryIdParam));
    }
  }, [location]);
  
  // Get subcategory details if subcategoryId is available
  const { data: subcategory } = useQuery<ProductSubcategory>({
    queryKey: [`/api/product-subcategories/${subcategoryId}`],
    enabled: !!subcategoryId,
  });
  
  // Get product bases
  const { data: productBases, isLoading } = useQuery<ProductBase[]>({
    queryKey: ["/api/product-base", { subcategoryId }],
    queryFn: async () => {
      const endpoint = subcategoryId 
        ? `/api/product-base?subcategoryId=${subcategoryId}`
        : "/api/product-base";
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error("Failed to fetch product bases");
      }
      return response.json();
    },
  });
  
  // Filter product bases based on search query
  const filteredProductBases = productBases
    ? productBases.filter(base => 
        base.technicalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (base.commercialName && base.commercialName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (base.internalCode && base.internalCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (base.description && base.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];
  
  const handleEdit = (productBaseId: number) => {
    setSelectedProductBaseId(productBaseId);
    setIsDialogOpen(true);
  };
  
  const handleAddNew = () => {
    setSelectedProductBaseId(null);
    setIsDialogOpen(true);
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center mb-6 gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={subcategoryId ? "/product-subcategories" : "/products"}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              {subcategoryId ? "Voltar para Subcategorias" : "Voltar para Produtos"}
            </Link>
          </Button>
          
          {subcategory && (
            <h1 className="text-2xl font-medium ml-2">
              Produtos Base de {subcategory.name}
            </h1>
          )}
          
          {!subcategory && (
            <h1 className="text-2xl font-medium ml-2">
              Todos os Produtos Base
            </h1>
          )}
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <div></div>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto Base
          </Button>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Buscar Produtos Base</CardTitle>
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
                      <TableHead>Variantes</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProductBases.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          <Database className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          {searchQuery 
                            ? "Nenhum produto base encontrado com os critérios de busca"
                            : "Nenhum produto base cadastrado ainda"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProductBases.map((base) => (
                        <TableRow key={base.id}>
                          <TableCell>{base.technicalName}</TableCell>
                          <TableCell>{base.commercialName || "-"}</TableCell>
                          <TableCell>{base.internalCode || "-"}</TableCell>
                          <TableCell>{base.defaultMeasureUnit}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/products?baseProductId=${base.id}`}>
                                <Package className="h-4 w-4 mr-2" />
                                Ver Variantes
                              </Link>
                            </Button>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEdit(base.id)}
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
              {selectedProductBaseId ? "Editar Produto Base" : "Novo Produto Base"}
            </DialogTitle>
          </DialogHeader>
          <ProductBaseForm 
            productBaseId={selectedProductBaseId}
            defaultSubcategoryId={subcategoryId} 
            onSuccess={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Layout>
  );
}