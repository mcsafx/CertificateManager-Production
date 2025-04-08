import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Folders, Pencil, Search, Trash2, Plus, ChevronLeft, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProductSubcategoryForm } from "@/components/products/product-subcategory-form";
import { ProductSubcategory, ProductCategory } from "@shared/schema";
import { Link, useLocation } from "wouter";

export default function ProductSubcategoriesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [location] = useLocation();
  const { toast } = useToast();
  
  // Extract categoryId from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const categoryIdParam = params.get("categoryId");
    if (categoryIdParam) {
      setCategoryId(Number(categoryIdParam));
    }
  }, [location]);
  
  // Get category details if categoryId is available
  const { data: category } = useQuery<ProductCategory>({
    queryKey: [`/api/product-categories/${categoryId}`],
    enabled: !!categoryId,
  });
  
  // Get subcategories
  const { data: subcategories, isLoading } = useQuery<ProductSubcategory[]>({
    queryKey: ["/api/product-subcategories", { categoryId }],
    queryFn: async () => {
      const endpoint = categoryId 
        ? `/api/product-subcategories?categoryId=${categoryId}`
        : "/api/product-subcategories";
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error("Failed to fetch subcategories");
      }
      return response.json();
    },
  });
  
  // Filter subcategories based on search query
  const filteredSubcategories = subcategories
    ? subcategories.filter(subcategory => 
        subcategory.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (subcategory.description && subcategory.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];
  
  const handleEdit = (subcategoryId: number) => {
    setSelectedSubcategoryId(subcategoryId);
    setIsDialogOpen(true);
  };
  
  const handleAddNew = () => {
    setSelectedSubcategoryId(null);
    setIsDialogOpen(true);
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center mb-6 gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/product-categories">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Voltar para Categorias
            </Link>
          </Button>
          
          {category && (
            <h1 className="text-2xl font-medium ml-2">
              Subcategorias de {category.name}
            </h1>
          )}
          
          {!category && (
            <h1 className="text-2xl font-medium ml-2">
              Todas as Subcategorias
            </h1>
          )}
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <div></div>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Subcategoria
          </Button>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Buscar Subcategorias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Buscar por nome ou descrição..."
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
                      <TableHead>Nome da Subcategoria</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Produtos Base</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubcategories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                          <Folders className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          {searchQuery 
                            ? "Nenhuma subcategoria encontrada com os critérios de busca"
                            : "Nenhuma subcategoria cadastrada ainda"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSubcategories.map((subcategory) => (
                        <TableRow key={subcategory.id}>
                          <TableCell>{subcategory.name}</TableCell>
                          <TableCell>{subcategory.description || "-"}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/product-base?subcategoryId=${subcategory.id}`}>
                                <Package className="h-4 w-4 mr-2" />
                                Ver Produtos Base
                              </Link>
                            </Button>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEdit(subcategory.id)}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedSubcategoryId ? "Editar Subcategoria" : "Nova Subcategoria"}
            </DialogTitle>
          </DialogHeader>
          <ProductSubcategoryForm 
            subcategoryId={selectedSubcategoryId}
            defaultCategoryId={categoryId} 
            onSuccess={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Layout>
  );
}