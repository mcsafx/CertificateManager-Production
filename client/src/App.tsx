import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import ProductsPage from "@/pages/products-page";
import ProductDetailPage from "@/pages/product-detail-page";
import SuppliersPage from "@/pages/suppliers-page";
import ManufacturersPage from "@/pages/manufacturers-page";
import ClientsPage from "@/pages/clients-page";
import CertificatesPage from "@/pages/certificates-page";
import IssuedCertificatesPage from "@/pages/issued-certificates-page";
import TraceabilityPage from "@/pages/traceability-page";
import SettingsPage from "@/pages/settings-page";
import { ProtectedRoute } from "./lib/protected-route";
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
      <ProtectedRoute path="/products" component={ProductsPage} />
      <ProtectedRoute path="/products/:id" component={ProductDetailPage} />
      <ProtectedRoute path="/suppliers" component={SuppliersPage} />
      <ProtectedRoute path="/manufacturers" component={ManufacturersPage} />
      <ProtectedRoute path="/clients" component={ClientsPage} />
      <ProtectedRoute path="/traceability" component={TraceabilityPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
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
