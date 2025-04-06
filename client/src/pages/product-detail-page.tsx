import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Package, Pencil } from "lucide-react";
import { Product, ProductCharacteristic } from "@shared/schema";
import { ProductCharacteristicsForm } from "@/components/products/product-characteristics-form";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function ProductDetailPage() {
  const { id } = useParams();
  const productId = id ? parseInt(id) : 0; // Usamos 0 como fallback para não ter erro de tipo
  
  // Redirect if no product ID is provided
  useEffect(() => {
    if (!productId) {
      window.location.href = "/products";
    }
  }, [productId]);
  
  // Fetch product details
  const { data: product, isLoading: isLoadingProduct } = useQuery<Product>({
    queryKey: [`/api/products/${productId}`],
    enabled: !!productId,
  });
  
  // Fetch product characteristics
  const { data: characteristics, isLoading: isLoadingCharacteristics } = useQuery<ProductCharacteristic[]>({
    queryKey: [`/api/products/${productId}/characteristics`],
    enabled: !!productId,
  });
  
  if (isLoadingProduct || !product) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[calc(100vh-100px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            className="mr-4"
            onClick={() => window.location.href = "/products"}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-medium">{product.technicalName}</h1>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informações do Produto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Nome Técnico</p>
                <p className="font-medium">{product.technicalName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Nome Comercial</p>
                <p className="font-medium">{product.commercialName || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Código Interno</p>
                <p className="font-medium">{product.internalCode || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Unidade Padrão</p>
                <p className="font-medium">{product.defaultMeasureUnit}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="characteristics">
          <TabsList className="mb-6">
            <TabsTrigger value="characteristics">Características</TabsTrigger>
          </TabsList>
          
          <TabsContent value="characteristics" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Características do Produto</CardTitle>
              </CardHeader>
              <CardContent>
                <ProductCharacteristicsForm productId={productId} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}