import { useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Beaker, CheckCircle, FileCheck, Package, Layers, Users, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const [location, navigate] = useLocation();
  const { user, loginMutation } = useAuth();

  // Redirect to home if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Left panel (form) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              <span className="text-primary">Cert</span>
              <span className="text-green-600">Quality</span>
            </CardTitle>
            <CardDescription>
              Gerencie seus certificados de qualidade de forma eficiente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usuário</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome de usuário" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Sua senha" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full mt-6"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : "Entrar"}
                </Button>
              </form>
            </Form>
            
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>
                Para acesso à plataforma, entre em contato com o administrador do sistema
              </p>
              <p className="mt-1">
                <a href="#contact" className="text-primary hover:underline">
                  Solicite uma demonstração
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Right panel (marketing) */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary p-8 text-white flex-col justify-center">
        <div className="max-w-xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">
            Gestão de Certificados de Qualidade para Distribuidores Químicos
          </h1>
          <p className="text-xl mb-8">
            Simplifique o processo de gestão de boletins de análise e emissão de certificados personalizados para seus clientes.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <CheckCircle className="h-6 w-6 text-green-300 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium">Digitalização de Certificados</h3>
                <p className="text-gray-100">Cadastre os boletins recebidos de seus fornecedores em um único local.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <CheckCircle className="h-6 w-6 text-green-300 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium">Emissão de Certificados Personalizados</h3>
                <p className="text-gray-100">Gere boletins com sua marca para seus clientes com poucos cliques.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <CheckCircle className="h-6 w-6 text-green-300 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium">Rastreabilidade Completa</h3>
                <p className="text-gray-100">Acompanhe a movimentação e o saldo de cada lote de produto.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <CheckCircle className="h-6 w-6 text-green-300 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium">Cadastros Integrados</h3>
                <p className="text-gray-100">Gerencie produtos, fornecedores, fabricantes e clientes em um único sistema.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-12 flex space-x-4">
            <div className="bg-white bg-opacity-10 p-3 rounded-full">
              <Beaker className="h-8 w-8" />
            </div>
            <div className="bg-white bg-opacity-10 p-3 rounded-full">
              <FileCheck className="h-8 w-8" />
            </div>
            <div className="bg-white bg-opacity-10 p-3 rounded-full">
              <Package className="h-8 w-8" />
            </div>
            <div className="bg-white bg-opacity-10 p-3 rounded-full">
              <Layers className="h-8 w-8" />
            </div>
            <div className="bg-white bg-opacity-10 p-3 rounded-full">
              <Users className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
