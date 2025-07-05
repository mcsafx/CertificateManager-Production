import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import ProductsPage from "@/pages/products-page";
import ProductDetailPage from "@/pages/product-detail-page";
import ProductCategoriesPage from "@/pages/product-categories-page";
import ProductSubcategoriesPage from "@/pages/product-subcategories-page";
import ProductBasePage from "@/pages/product-base-page";
import PackageTypesPage from "@/pages/package-types-page";
import SuppliersPage from "@/pages/suppliers-page";
import ManufacturersPage from "@/pages/manufacturers-page";
import ClientsPage from "@/pages/clients-page";
import CertificatesPage from "@/pages/certificates-page";
import IssuedCertificatesPage from "@/pages/issued-certificates-page";
import IssuedCertificateDetailPage from "@/pages/issued-certificate-detail-page";
import NFeImportPage from "@/pages/nfe-import-page";
import TraceabilityPage from "@/pages/traceability-page";
import SettingsPage from "@/pages/settings-page";
// Páginas de Administração
import AdminDashboardPage from "@/pages/admin/index";
import AdminTenantsPage from "@/pages/admin/tenants-page";
import AdminPlansPage from "@/pages/admin/plans-page";
import AdminStoragePage from "@/pages/admin/storage-page";
import AdminUsersPage from "@/pages/admin/users-page";
import AdminModuleFeaturesPage from "@/pages/admin/module-features-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AdminRoute } from "./lib/admin-route";
import { AuthProvider } from "./hooks/use-auth";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/certificates" component={CertificatesPage} />
      <ProtectedRoute path="/issued-certificates" component={IssuedCertificatesPage} />
      <ProtectedRoute path="/issued-certificates/:id" component={IssuedCertificateDetailPage} />
      <ProtectedRoute path="/nfe-import" component={NFeImportPage} />
      
      {/* Produtos - Hierarquia */}
      <ProtectedRoute path="/product-categories" component={ProductCategoriesPage} />
      <ProtectedRoute path="/product-subcategories" component={ProductSubcategoriesPage} />
      <ProtectedRoute path="/product-base" component={ProductBasePage} />
      <ProtectedRoute path="/products" component={ProductsPage} />
      <ProtectedRoute path="/products/:id" component={ProductDetailPage} />
      
      <ProtectedRoute path="/package-types" component={PackageTypesPage} />
      <ProtectedRoute path="/suppliers" component={SuppliersPage} />
      <ProtectedRoute path="/manufacturers" component={ManufacturersPage} />
      <ProtectedRoute path="/clients" component={ClientsPage} />
      <ProtectedRoute path="/traceability" component={TraceabilityPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      
      {/* Rotas do Painel Administrativo - Apenas para administradores */}
      <AdminRoute path="/admin" component={AdminDashboardPage} />
      <AdminRoute path="/admin/tenants" component={AdminTenantsPage} />
      <AdminRoute path="/admin/plans" component={AdminPlansPage} />
      <AdminRoute path="/admin/storage" component={AdminStoragePage} />
      <AdminRoute path="/admin/users" component={AdminUsersPage} />
      <AdminRoute path="/admin/module-features" component={AdminModuleFeaturesPage} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
