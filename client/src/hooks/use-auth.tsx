import { createContext, ReactNode, useContext, useMemo } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Tipo para informações de status do tenant
type TenantStatus = {
  status: 'overdue' | 'pending' | 'active';
  message: string;
  contactInfo?: {
    name: string;
    phone: string;
    address: string;
  } | null;
};

// Extensão do tipo de usuário para incluir informações de status do tenant
type UserWithTenantStatus = SelectUser & {
  tenantStatus?: TenantStatus | null;
};

type AuthContextType = {
  user: UserWithTenantStatus | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<UserWithTenantStatus, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<UserWithTenantStatus, Error, InsertUser>;
  hasTenantIssue: boolean; // Nova propriedade para facilitar verificação
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<UserWithTenantStatus | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (userData: UserWithTenantStatus) => {
      queryClient.setQueryData(["/api/user"], userData);
      
      // Verificar status da assinatura e mostrar avisos quando necessário
      if (userData.tenantStatus) {
        if (userData.tenantStatus.status === 'overdue') {
          // Mostrar alerta de assinatura vencida
          toast({
            title: "Assinatura Vencida",
            description: userData.tenantStatus.message,
            variant: "destructive",
            duration: 10000, // 10 segundos
          });
        } else if (userData.tenantStatus.status === 'pending') {
          // Mostrar aviso de assinatura prestes a vencer
          toast({
            title: "Aviso de Assinatura",
            description: userData.tenantStatus.message,
            variant: "default",
            duration: 7000, // 7 segundos
          });
        }
      }
      
      // Mensagem de boas-vindas
      toast({
        title: "Login bem-sucedido",
        description: `Bem-vindo de volta, ${userData.name}!`,
      });
      
      // Redirecionar para a página inicial após o login
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no login",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: UserWithTenantStatus) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registro bem-sucedido",
        description: `Bem-vindo, ${user.name}!`,
      });
      // Redirecionar para a página inicial após o registro
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no registro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Desconectado",
        description: "Você foi desconectado com sucesso.",
      });
      // Redirecionar para a página de autenticação após o logout
      navigate("/auth");
    },
    onError: (error: Error) => {
      toast({
        title: "Falha ao desconectar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Verificar se há problemas com a assinatura do tenant
  const hasTenantIssue = useMemo(() => {
    if (!user || !user.tenantStatus) return false;
    return user.tenantStatus.status === 'overdue' || user.tenantStatus.status === 'pending';
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        hasTenantIssue,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
