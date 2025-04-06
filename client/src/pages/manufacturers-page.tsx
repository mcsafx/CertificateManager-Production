import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Factory, Pencil, Search, Trash2, Plus } from "lucide-react";
import { insertManufacturerSchema, Manufacturer } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export default function ManufacturersPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingManufacturer, setEditingManufacturer] = useState<Manufacturer | null>(null);
  
  // Fetch manufacturers
  const { data: manufacturers, isLoading } = useQuery<Manufacturer[]>({
    queryKey: ["/api/manufacturers"],
  });
  
  // Filter manufacturers based on search query
  const filteredManufacturers = manufacturers
    ? manufacturers.filter(manufacturer => 
        manufacturer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        manufacturer.country.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];
  
  // Form for adding/editing manufacturers
  const form = useForm<Omit<Manufacturer, "id" | "tenantId">>({
    resolver: zodResolver(insertManufacturerSchema.omit({ tenantId: true })),
    defaultValues: {
      name: "",
      country: "",
    },
  });
  
  // Set form values when editing
  const handleEdit = (manufacturer: Manufacturer) => {
    setEditingManufacturer(manufacturer);
    form.reset({
      name: manufacturer.name,
      country: manufacturer.country,
    });
    setIsDialogOpen(true);
  };
  
  // Reset form when adding new
  const handleAddNew = () => {
    setEditingManufacturer(null);
    form.reset({
      name: "",
      country: "",
    });
    setIsDialogOpen(true);
  };
  
  // Mutation for adding/editing manufacturer
  const manufacturerMutation = useMutation({
    mutationFn: async (data: Omit<Manufacturer, "id" | "tenantId">) => {
      if (editingManufacturer) {
        // Update existing manufacturer
        await apiRequest("PATCH", `/api/manufacturers/${editingManufacturer.id}`, data);
      } else {
        // Create new manufacturer
        await apiRequest("POST", "/api/manufacturers", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturers"] });
      setIsDialogOpen(false);
      toast({
        title: editingManufacturer ? "Fabricante atualizado" : "Fabricante adicionado",
        description: editingManufacturer 
          ? "O fabricante foi atualizado com sucesso." 
          : "O fabricante foi adicionado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete manufacturer mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/manufacturers/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturers"] });
      toast({
        title: "Fabricante removido",
        description: "O fabricante foi removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleDelete = (id: number) => {
    if (window.confirm("Tem certeza que deseja remover este fabricante?")) {
      deleteMutation.mutate(id);
    }
  };
  
  const onSubmit = (data: Omit<Manufacturer, "id" | "tenantId">) => {
    manufacturerMutation.mutate(data);
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-medium">Fabricantes</h1>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Fabricante
          </Button>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Buscar Fabricantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Buscar por nome ou país de origem..."
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
                      <TableHead className="w-[250px]">Nome</TableHead>
                      <TableHead>País de Origem</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredManufacturers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                          <Factory className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          {searchQuery 
                            ? "Nenhum fabricante encontrado com os critérios de busca"
                            : "Nenhum fabricante cadastrado ainda"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredManufacturers.map((manufacturer) => (
                        <TableRow key={manufacturer.id}>
                          <TableCell className="font-medium">{manufacturer.name}</TableCell>
                          <TableCell>{manufacturer.country}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEdit(manufacturer)}
                              disabled={manufacturerMutation.isPending}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDelete(manufacturer.id)}
                              disabled={deleteMutation.isPending}
                            >
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
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>
              {editingManufacturer ? "Editar Fabricante" : "Novo Fabricante"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do fabricante" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>País de Origem *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Brasil, EUA, Alemanha" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={manufacturerMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={manufacturerMutation.isPending}
                >
                  {manufacturerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    editingManufacturer ? "Atualizar Fabricante" : "Adicionar Fabricante"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
