import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { Loader2, FolderTree, Pencil, Search, Trash2, Plus, FolderOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProductCategoryForm } from "@/components/products/product-category-form";
import { ProductCategory } from "@shared/schema";
import { Link } from "wouter";

export default function ProductCategoriesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const { toast } = useToast();
  
  const { data: categories, isLoading } = useQuery<ProductCategory[]>({
    queryKey: ["/api/product-categories"],
  });
  
  // Filter categories based on search query
  const filteredCategories = categories
    ? categories.filter(category => 
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];
  
  const handleEdit = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    setIsDialogOpen(true);
  };
  
  const handleAddNew = () => {
    setSelectedCategoryId(null);
    setIsDialogOpen(true);
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-medium">Categorias de Produtos</h1>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
          </Button>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Buscar Categorias</CardTitle>
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
                      <TableHead>Nome da Categoria</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Subcategorias</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                          <FolderTree className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          {searchQuery 
                            ? "Nenhuma categoria encontrada com os critérios de busca"
                            : "Nenhuma categoria cadastrada ainda"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCategories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell>{category.name}</TableCell>
                          <TableCell>{category.description || "-"}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/product-subcategories?categoryId=${category.id}`}>
                                <FolderOpen className="h-4 w-4 mr-2" />
                                Ver Subcategorias
                              </Link>
                            </Button>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEdit(category.id)}
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
              {selectedCategoryId ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
          </DialogHeader>
          <ProductCategoryForm 
            categoryId={selectedCategoryId} 
            onSuccess={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Layout>
  );
}