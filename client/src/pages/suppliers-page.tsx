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
import { Loader2, Building2, Pencil, Search, Trash2, Plus } from "lucide-react";
import { insertSupplierSchema, Supplier } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export default function SuppliersPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  
  // Fetch suppliers
  const { data: suppliers, isLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });
  
  // Filter suppliers based on search query
  const filteredSuppliers = suppliers
    ? suppliers.filter(supplier => 
        supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.cnpj.includes(searchQuery) ||
        (supplier.internalCode && supplier.internalCode.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];
  
  // Form for adding/editing suppliers
  const form = useForm<Omit<Supplier, "id" | "tenantId">>({
    resolver: zodResolver(insertSupplierSchema.omit({ tenantId: true })),
    defaultValues: {
      name: "",
      cnpj: "",
      phone: "",
      address: "",
      internalCode: "",
    },
  });
  
  // Set form values when editing
  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    form.reset({
      name: supplier.name,
      cnpj: supplier.cnpj,
      phone: supplier.phone || "",
      address: supplier.address || "",
      internalCode: supplier.internalCode || "",
    });
    setIsDialogOpen(true);
  };
  
  // Reset form when adding new
  const handleAddNew = () => {
    setEditingSupplier(null);
    form.reset({
      name: "",
      cnpj: "",
      phone: "",
      address: "",
      internalCode: "",
    });
    setIsDialogOpen(true);
  };
  
  // Mutation for adding/editing supplier
  const supplierMutation = useMutation({
    mutationFn: async (data: Omit<Supplier, "id" | "tenantId">) => {
      if (editingSupplier) {
        // Update existing supplier
        await apiRequest("PATCH", `/api/suppliers/${editingSupplier.id}`, data);
      } else {
        // Create new supplier
        await apiRequest("POST", "/api/suppliers", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setIsDialogOpen(false);
      toast({
        title: editingSupplier ? "Fornecedor atualizado" : "Fornecedor adicionado",
        description: editingSupplier 
          ? "O fornecedor foi atualizado com sucesso." 
          : "O fornecedor foi adicionado com sucesso.",
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
  
  // Delete supplier mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/suppliers/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "Fornecedor removido",
        description: "O fornecedor foi removido com sucesso.",
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
    if (window.confirm("Tem certeza que deseja remover este fornecedor?")) {
      deleteMutation.mutate(id);
    }
  };
  
  const onSubmit = (data: Omit<Supplier, "id" | "tenantId">) => {
    supplierMutation.mutate(data);
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-medium">Fornecedores</h1>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Fornecedor
          </Button>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Buscar Fornecedores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Buscar por nome, CNPJ ou código interno..."
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
                      <TableHead className="w-[200px]">Nome</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Endereço</TableHead>
                      <TableHead>Código Interno</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSuppliers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          <Building2 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          {searchQuery 
                            ? "Nenhum fornecedor encontrado com os critérios de busca"
                            : "Nenhum fornecedor cadastrado ainda"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSuppliers.map((supplier) => (
                        <TableRow key={supplier.id}>
                          <TableCell className="font-medium">{supplier.name}</TableCell>
                          <TableCell>{supplier.cnpj}</TableCell>
                          <TableCell>{supplier.phone || "-"}</TableCell>
                          <TableCell>{supplier.address || "-"}</TableCell>
                          <TableCell>{supplier.internalCode || "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEdit(supplier)}
                              disabled={supplierMutation.isPending}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDelete(supplier.id)}
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
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? "Editar Fornecedor" : "Novo Fornecedor"}
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
                      <Input placeholder="Nome do fornecedor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ *</FormLabel>
                    <FormControl>
                      <Input placeholder="00.000.000/0000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 0000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="internalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código Interno (ERP)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: FORN-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Endereço completo" {...field} />
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
                  disabled={supplierMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={supplierMutation.isPending}
                >
                  {supplierMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    editingSupplier ? "Atualizar Fornecedor" : "Adicionar Fornecedor"
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
