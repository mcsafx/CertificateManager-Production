import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Users, Pencil, Search, Trash2, Plus } from "lucide-react";
import { frontendClientSchema, Client } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export default function ClientsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  // Fetch clients
  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });
  
  // Filter clients based on search query
  const filteredClients = clients
    ? clients.filter(client => 
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.cnpj && client.cnpj.includes(searchQuery)) ||
        (client.taxIdentifier && client.taxIdentifier.includes(searchQuery)) ||
        (client.country && client.country.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (client.qualityEmail && client.qualityEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (client.internalCode && client.internalCode.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];
  
  // Form for adding/editing clients
  const form = useForm<Omit<Client, "id" | "tenantId">>({
    resolver: zodResolver(frontendClientSchema),
    defaultValues: {
      name: "",
      cnpj: "",
      phone: "",
      address: "",
      internalCode: "",
      isNational: true,
      country: "",
      taxIdentifier: "",
      taxIdentifierType: "",
      qualityEmail: "",
    },
  });

  // Watch isNational field to conditionally show fields
  const isNational = form.watch("isNational");
  
  // Set form values when editing
  const handleEdit = (client: Client) => {
    setEditingClient(client);
    form.reset({
      name: client.name,
      cnpj: client.cnpj || "",
      phone: client.phone || "",
      address: client.address || "",
      internalCode: client.internalCode || "",
      isNational: client.isNational ?? true,
      country: client.country || "",
      taxIdentifier: client.taxIdentifier || "",
      taxIdentifierType: client.taxIdentifierType || "",
      qualityEmail: client.qualityEmail || "",
    });
    setIsDialogOpen(true);
  };
  
  // Reset form when adding new
  const handleAddNew = () => {
    setEditingClient(null);
    form.reset({
      name: "",
      cnpj: "",
      phone: "",
      address: "",
      internalCode: "",
      isNational: true,
      country: "",
      taxIdentifier: "",
      taxIdentifierType: "",
      qualityEmail: "",
    });
    setIsDialogOpen(true);
  };
  
  // Mutation for adding/editing client
  const clientMutation = useMutation({
    mutationFn: async (data: Omit<Client, "id" | "tenantId">) => {
      if (editingClient) {
        // Update existing client
        await apiRequest("PATCH", `/api/clients/${editingClient.id}`, data);
      } else {
        // Create new client
        await apiRequest("POST", "/api/clients", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsDialogOpen(false);
      toast({
        title: editingClient ? "Cliente atualizado" : "Cliente adicionado",
        description: editingClient 
          ? "O cliente foi atualizado com sucesso." 
          : "O cliente foi adicionado com sucesso.",
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
  
  // Delete client mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/clients/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Cliente removido",
        description: "O cliente foi removido com sucesso.",
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
    if (window.confirm("Tem certeza que deseja remover este cliente?")) {
      deleteMutation.mutate(id);
    }
  };
  
  const onSubmit = (data: Omit<Client, "id" | "tenantId">) => {
    clientMutation.mutate(data);
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-medium">Clientes</h1>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Buscar Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Buscar por nome, CNPJ, identificação fiscal, país, e-mail ou código interno..."
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
                      <TableHead>Identificação Fiscal</TableHead>
                      <TableHead>País</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>E-mail Qualidade</TableHead>
                      <TableHead>Endereço</TableHead>
                      <TableHead>Código Interno</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          {searchQuery 
                            ? "Nenhum cliente encontrado com os critérios de busca"
                            : "Nenhum cliente cadastrado ainda"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredClients.map((client) => {
                        const taxDisplay = client.isNational 
                          ? client.cnpj || "-" 
                          : client.taxIdentifier 
                            ? `${client.taxIdentifierType || ""} ${client.taxIdentifier}`.trim()
                            : "-";
                        const countryDisplay = client.isNational ? "Brasil" : client.country || "-";
                        
                        return (
                          <TableRow key={client.id}>
                            <TableCell className="font-medium">{client.name}</TableCell>
                            <TableCell>{taxDisplay}</TableCell>
                            <TableCell>{countryDisplay}</TableCell>
                            <TableCell>{client.phone || "-"}</TableCell>
                            <TableCell>{client.qualityEmail || "-"}</TableCell>
                            <TableCell>{client.address || "-"}</TableCell>
                            <TableCell>{client.internalCode || "-"}</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleEdit(client)}
                                disabled={clientMutation.isPending}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDelete(client.id)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
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
              {editingClient ? "Editar Cliente" : "Novo Cliente"}
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
                      <Input placeholder="Nome do cliente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Toggle Nacional/Estrangeiro */}
              <FormField
                control={form.control}
                name="isNational"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-medium">
                        Empresa Nacional
                      </FormLabel>
                      <div className="text-sm text-muted-foreground">
                        {field.value ? "Empresa brasileira com CNPJ" : "Empresa estrangeira com identificação fiscal internacional"}
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Campos condicionais para identificação fiscal */}
              {isNational ? (
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
              ) : (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>País *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Estados Unidos, Alemanha, França..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="taxIdentifierType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Identificação</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="VAT">VAT Number (Europa)</SelectItem>
                              <SelectItem value="EIN">EIN (Estados Unidos)</SelectItem>
                              <SelectItem value="TIN">TIN (Estados Unidos)</SelectItem>
                              <SelectItem value="Business Number">Business Number (Canadá)</SelectItem>
                              <SelectItem value="Company Number">Company Number (Reino Unido)</SelectItem>
                              <SelectItem value="Tax ID">Tax ID (Genérico)</SelectItem>
                              <SelectItem value="Other">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="taxIdentifier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de Identificação *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: DE123456789, 12-3456789..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
              
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
                        <Input placeholder="Ex: CLI-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="qualityEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail do Setor de Qualidade</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="qualidade@empresa.com" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                  disabled={clientMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={clientMutation.isPending}
                >
                  {clientMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    editingClient ? "Atualizar Cliente" : "Adicionar Cliente"
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
