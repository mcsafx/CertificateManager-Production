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
  Home,
  FolderTree,
  LayoutList,
  Shield,
  Upload
} from "lucide-react";
import { Link, useLocation } from "wouter";

type SidebarItemProps = {
  href: string;
  icon: React.ElementType;
  children: React.ReactNode;
  active?: boolean;
};

// Correto modo de criar item de menu no React sem nesting de anchor
const SidebarItem = ({ href, icon: Icon, children, active }: SidebarItemProps) => (
  <Link href={href}>
    <div className={cn(
      "p-3 flex items-center space-x-3 rounded-md transition-colors cursor-pointer",
      active 
        ? "bg-primary-light bg-opacity-10 text-primary" 
        : "hover:bg-gray-100 text-gray-500"
    )}>
      <Icon className="h-5 w-5" />
      <span>{children}</span>
    </div>
  </Link>
);

interface SidebarProps {
  isMobile?: boolean;
}

export function Sidebar({ isMobile = false }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const isProductSection = 
    location === "/products" || 
    location === "/product-categories" || 
    location === "/product-subcategories" || 
    location === "/product-base" || 
    location.startsWith("/products/");

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Define classes com base se é mobile ou desktop
  const sidebarClasses = cn(
    "w-64 bg-white shadow-lg flex-col overflow-hidden border-r border-gray-200",
    isMobile ? "flex h-full" : "hidden lg:flex" // Se for mobile, mostra sempre, senão esconde em telas pequenas
  );

  return (
    <aside className={sidebarClasses}>
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
        
        <SidebarItem href="/nfe-import" icon={Upload} active={location === "/nfe-import"}>
          Importar NFe
        </SidebarItem>
        
        <div className="py-2">
          <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Produtos
          </div>
          
          <SidebarItem 
            href="/product-categories" 
            icon={FolderTree} 
            active={location === "/product-categories"}
          >
            Categorias
          </SidebarItem>
          
          <SidebarItem 
            href="/product-subcategories" 
            icon={LayoutList} 
            active={location === "/product-subcategories"}
          >
            Subcategorias
          </SidebarItem>
          
          <SidebarItem 
            href="/product-base" 
            icon={Package} 
            active={location === "/product-base"}
          >
            Produtos Base
          </SidebarItem>
          
          <SidebarItem 
            href="/products" 
            icon={Package} 
            active={location === "/products" || location.startsWith("/products/")}
          >
            Variantes de Produtos
          </SidebarItem>
        </div>
        
        <div className="py-2">
          <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Parceiros
          </div>
          
          <SidebarItem href="/suppliers" icon={Building2} active={location === "/suppliers"}>
            Fornecedores
          </SidebarItem>
          
          <SidebarItem href="/manufacturers" icon={Factory} active={location === "/manufacturers"}>
            Fabricantes
          </SidebarItem>
          
          <SidebarItem href="/clients" icon={Users} active={location === "/clients"}>
            Clientes
          </SidebarItem>
        </div>
        
        <SidebarItem href="/traceability" icon={ClipboardList} active={location === "/traceability"}>
          Rastreabilidade
        </SidebarItem>
        
        <SidebarItem href="/settings" icon={Settings} active={location === "/settings"}>
          Configurações
        </SidebarItem>
        
        {user?.role === "admin" && (
          <div className="mt-4">
            <div className="px-3 py-1 text-xs font-semibold text-red-400 uppercase tracking-wider">
              Administração
            </div>
            <SidebarItem 
              href="/admin" 
              icon={Shield} 
              active={location.startsWith("/admin")}
            >
              Painel Administrativo
            </SidebarItem>
          </div>
        )}
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
              {user?.role === "admin" ? "Administrador" : 
               user?.role === "admin_tenant" ? "Admin Tenant" : "Usuário"}
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
