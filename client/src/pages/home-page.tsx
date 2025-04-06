import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Loader2, ListChecks, FileCheck, Users, Factory, Package, Building2, FileOutput } from "lucide-react";
import { Link } from "wouter";

export default function HomePage() {
  const { user } = useAuth();
  
  const { 
    data: entryCertificatesData,
    isLoading: isLoadingEntryCertificates 
  } = useQuery({
    queryKey: ["/api/entry-certificates"],
  });
  
  const { 
    data: issuedCertificatesData,
    isLoading: isLoadingIssuedCertificates 
  } = useQuery({
    queryKey: ["/api/issued-certificates"],
  });
  
  const { 
    data: productsData,
    isLoading: isLoadingProducts 
  } = useQuery({
    queryKey: ["/api/products"],
  });
  
  const { 
    data: suppliersData,
    isLoading: isLoadingSupppliers 
  } = useQuery({
    queryKey: ["/api/suppliers"],
  });
  
  const { 
    data: clientsData,
    isLoading: isLoadingClients 
  } = useQuery({
    queryKey: ["/api/clients"],
  });
  
  const isLoading = isLoadingEntryCertificates || isLoadingIssuedCertificates || 
                    isLoadingProducts || isLoadingSupppliers || isLoadingClients;

  const entryCertificates = entryCertificatesData || [];
  const issuedCertificates = issuedCertificatesData || [];
  const products = productsData || [];
  const suppliers = suppliersData || [];
  const clients = clientsData || [];
  
  // Sample chart data - in a real app, this would be calculated from actual data
  const mockChartData = [
    { name: 'Jan', entrada: 4, emitidos: 2 },
    { name: 'Feb', entrada: 3, emitidos: 1 },
    { name: 'Mar', entrada: 5, emitidos: 3 },
    { name: 'Apr', entrada: 7, emitidos: 5 },
    { name: 'May', entrada: 2, emitidos: 2 },
    { name: 'Jun', entrada: 6, emitidos: 4 },
  ];

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-medium">Dashboard</h1>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <FileCheck className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Boletins de Entrada</p>
                      <h3 className="text-2xl font-bold">{entryCertificates.length}</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-100 p-3 rounded-full">
                      <FileOutput className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Boletins Emitidos</p>
                      <h3 className="text-2xl font-bold">{issuedCertificates.length}</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-purple-100 p-3 rounded-full">
                      <Package className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Produtos</p>
                      <h3 className="text-2xl font-bold">{products.length}</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-amber-100 p-3 rounded-full">
                      <ListChecks className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Taxa de Aprovação</p>
                      <h3 className="text-2xl font-bold">
                        {entryCertificates.length > 0 
                          ? Math.round((entryCertificates.filter(cert => cert.status === 'Aprovado').length / entryCertificates.length) * 100) 
                          : 0}%
                      </h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Atividade de Boletins</CardTitle>
                  <CardDescription>Comparativo entre boletins de entrada e emitidos</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mockChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="entrada" name="Boletins de Entrada" fill="#1976d2" />
                      <Bar dataKey="emitidos" name="Boletins Emitidos" fill="#388e3c" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Cadastros</CardTitle>
                  <CardDescription>Entidades cadastradas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <Link href="/suppliers">
                        <a className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100">
                          <div className="flex items-center gap-3">
                            <Building2 className="h-5 w-5 text-gray-600" />
                            <span>Fornecedores</span>
                          </div>
                          <span className="font-bold">{suppliers.length}</span>
                        </a>
                      </Link>
                    </div>
                    
                    <div>
                      <Link href="/manufacturers">
                        <a className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100">
                          <div className="flex items-center gap-3">
                            <Factory className="h-5 w-5 text-gray-600" />
                            <span>Fabricantes</span>
                          </div>
                          <span className="font-bold">{suppliers.length}</span>
                        </a>
                      </Link>
                    </div>
                    
                    <div>
                      <Link href="/clients">
                        <a className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100">
                          <div className="flex items-center gap-3">
                            <Users className="h-5 w-5 text-gray-600" />
                            <span>Clientes</span>
                          </div>
                          <span className="font-bold">{clients.length}</span>
                        </a>
                      </Link>
                    </div>
                    
                    <div>
                      <Link href="/products">
                        <a className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100">
                          <div className="flex items-center gap-3">
                            <Package className="h-5 w-5 text-gray-600" />
                            <span>Produtos</span>
                          </div>
                          <span className="font-bold">{products.length}</span>
                        </a>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Link href="/certificates">
                      <a className="bg-primary text-white p-4 rounded-lg text-center hover:bg-primary-dark">
                        <FileCheck className="h-6 w-6 mx-auto mb-2" />
                        <span>Novo Boletim de Entrada</span>
                      </a>
                    </Link>
                    
                    <Link href="/issued-certificates">
                      <a className="bg-green-600 text-white p-4 rounded-lg text-center hover:bg-green-700">
                        <FileOutput className="h-6 w-6 mx-auto mb-2" />
                        <span>Emitir Boletim</span>
                      </a>
                    </Link>
                    
                    <Link href="/products">
                      <a className="bg-purple-600 text-white p-4 rounded-lg text-center hover:bg-purple-700">
                        <Package className="h-6 w-6 mx-auto mb-2" />
                        <span>Cadastrar Produto</span>
                      </a>
                    </Link>
                    
                    <Link href="/traceability">
                      <a className="bg-amber-600 text-white p-4 rounded-lg text-center hover:bg-amber-700">
                        <ListChecks className="h-6 w-6 mx-auto mb-2" />
                        <span>Consultar Rastreabilidade</span>
                      </a>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
