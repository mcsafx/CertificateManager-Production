import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { 
  FileText, 
  Package, 
  Building2, 
  Factory, 
  Users, 
  ClipboardList, 
  Settings, 
  LogOut,
  Home
} from "lucide-react";
import { Link, useLocation } from "wouter";

type SidebarItemProps = {
  href: string;
  icon: React.ElementType;
  children: React.ReactNode;
  active?: boolean;
};

const SidebarItem = ({ href, icon: Icon, children, active }: SidebarItemProps) => (
  <Link href={href}>
    <a className={cn(
      "p-3 flex items-center space-x-3 rounded-md transition-colors",
      active 
        ? "bg-primary-light bg-opacity-10 text-primary" 
        : "hover:bg-gray-100 text-gray-500"
    )}>
      <Icon className="h-5 w-5" />
      <span>{children}</span>
    </a>
  </Link>
);

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <aside className="w-64 bg-white shadow-lg hidden lg:flex flex-col overflow-hidden border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold">
          <span className="text-primary">Cert</span>
          <span className="text-green-600">Quality</span>
        </h1>
      </div>
      
      <div className="p-2 flex-1 overflow-y-auto">
        <SidebarItem href="/" icon={Home} active={location === "/"}>
          Dashboard
        </SidebarItem>
        
        <SidebarItem href="/certificates" icon={FileText} active={location === "/certificates"}>
          Boletins de Entrada
        </SidebarItem>
        
        <SidebarItem href="/issued-certificates" icon={FileText} active={location === "/issued-certificates"}>
          Boletins Emitidos
        </SidebarItem>
        
        <SidebarItem href="/products" icon={Package} active={location === "/products"}>
          Produtos
        </SidebarItem>
        
        <SidebarItem href="/suppliers" icon={Building2} active={location === "/suppliers"}>
          Fornecedores
        </SidebarItem>
        
        <SidebarItem href="/manufacturers" icon={Factory} active={location === "/manufacturers"}>
          Fabricantes
        </SidebarItem>
        
        <SidebarItem href="/clients" icon={Users} active={location === "/clients"}>
          Clientes
        </SidebarItem>
        
        <SidebarItem href="/traceability" icon={ClipboardList} active={location === "/traceability"}>
          Rastreabilidade
        </SidebarItem>
        
        <SidebarItem href="/settings" icon={Settings} active={location === "/settings"}>
          Configurações
        </SidebarItem>
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-gray-600 font-medium">
              {user?.name?.charAt(0)}
              {user?.name?.split(" ")[1]?.charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">
              {user?.role === "admin" ? "Administrador" : "Usuário"}
            </p>
          </div>
          <button 
            className="text-gray-500 hover:text-red-500"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
