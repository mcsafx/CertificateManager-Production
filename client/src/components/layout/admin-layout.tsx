import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SubscriptionAlert } from "@/components/subscription-alert";
import {
  Building,
  HardDrive,
  HomeIcon,
  Layers,
  Users,
  Settings,
  Puzzle
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

// Item de navegação lateral
interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  isActive: boolean;
}

const SidebarItem = ({
  href,
  icon,
  title,
  isActive,
}: SidebarItemProps) => {
  return (
    <Link href={href}>
      <Button
        variant={isActive ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start",
          isActive ? "bg-secondary" : "hover:bg-secondary/50"
        )}
      >
        {icon}
        <span className="ml-2">{title}</span>
      </Button>
    </Link>
  );
};

// Layout para o painel administrativo
const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen">
      {/* Barra lateral */}
      <aside className="bg-card border-r w-64 p-4 flex flex-col">
        <div className="mb-6">
          <h2 className="text-xl font-bold">Painel Admin</h2>
          <p className="text-sm text-muted-foreground">Gerenciamento do Sistema</p>
        </div>
        
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground mb-2 px-2">
            Dashboard
          </div>
          <SidebarItem
            href="/admin"
            icon={<HomeIcon className="h-5 w-5" />}
            title="Visão Geral"
            isActive={location === "/admin"}
          />
          
          <div className="text-sm font-medium text-muted-foreground mt-4 mb-2 px-2">
            Planos e Módulos
          </div>
          <SidebarItem
            href="/admin/plans"
            icon={<Layers className="h-5 w-5" />}
            title="Planos e Módulos"
            isActive={location === "/admin/plans"}
          />
          <SidebarItem
            href="/admin/module-features"
            icon={<Puzzle className="h-5 w-5" />}
            title="Funcionalidades"
            isActive={location === "/admin/module-features"}
          />
          <SidebarItem
            href="/admin/tenants"
            icon={<Building className="h-5 w-5" />}
            title="Tenants"
            isActive={location === "/admin/tenants"}
          />
          
          <div className="text-sm font-medium text-muted-foreground mt-4 mb-2 px-2">
            Gestão de Sistema
          </div>
          <SidebarItem
            href="/admin/storage"
            icon={<HardDrive className="h-5 w-5" />}
            title="Armazenamento"
            isActive={location === "/admin/storage"}
          />
          <SidebarItem
            href="/admin/users"
            icon={<Users className="h-5 w-5" />}
            title="Usuários"
            isActive={location === "/admin/users"}
          />
        </div>
        
        <div className="mt-auto pt-4 border-t">
          <Link href="/">
            <Button variant="outline" className="w-full">
              Voltar ao Sistema
            </Button>
          </Link>
        </div>
      </aside>
      
      {/* Conteúdo principal */}
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="container mx-auto px-4 py-6">
          <SubscriptionAlert />
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;