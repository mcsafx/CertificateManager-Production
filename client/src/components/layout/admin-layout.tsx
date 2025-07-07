import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SubscriptionAlert } from "@/components/subscription-alert";
import { Separator } from "@/components/ui/separator";
import {
  Building,
  HardDrive,
  HomeIcon,
  Layers,
  Users,
  Settings,
  Puzzle,
  CreditCard,
  Monitor,
  ShieldCheck,
  BarChart3,
  Package
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
        
        <div className="space-y-1">
          {/* Dashboard Principal */}
          <div className="text-xs font-semibold text-muted-foreground mb-2 px-2 uppercase tracking-wide">
            Dashboard
          </div>
          <SidebarItem
            href="/admin"
            icon={<HomeIcon className="h-4 w-4" />}
            title="Visão Geral"
            isActive={location === "/admin"}
          />
          
          <Separator className="my-3" />
          
          {/* Gestão de Negócio */}
          <div className="text-xs font-semibold text-muted-foreground mb-2 px-2 uppercase tracking-wide">
            Gestão de Negócio
          </div>
          <SidebarItem
            href="/admin/tenants"
            icon={<Building className="h-4 w-4" />}
            title="Tenants"
            isActive={location === "/admin/tenants"}
          />
          <SidebarItem
            href="/admin/plans"
            icon={<CreditCard className="h-4 w-4" />}
            title="Planos & Preços"
            isActive={location === "/admin/plans"}
          />
          
          <Separator className="my-3" />
          
          {/* Sistema de Módulos */}
          <div className="text-xs font-semibold text-muted-foreground mb-2 px-2 uppercase tracking-wide">
            Sistema de Módulos
          </div>
          <SidebarItem
            href="/admin/modules"
            icon={<Package className="h-4 w-4" />}
            title="Módulos"
            isActive={location === "/admin/modules"}
          />
          <SidebarItem
            href="/admin/module-features"
            icon={<Puzzle className="h-4 w-4" />}
            title="Funcionalidades"
            isActive={location === "/admin/module-features"}
          />
          
          <Separator className="my-3" />
          
          {/* Controle de Sistema */}
          <div className="text-xs font-semibold text-muted-foreground mb-2 px-2 uppercase tracking-wide">
            Controle de Sistema
          </div>
          <SidebarItem
            href="/admin/users"
            icon={<Users className="h-4 w-4" />}
            title="Usuários"
            isActive={location === "/admin/users"}
          />
          <SidebarItem
            href="/admin/storage"
            icon={<HardDrive className="h-4 w-4" />}
            title="Armazenamento"
            isActive={location === "/admin/storage"}
          />
          <SidebarItem
            href="/admin/settings-advanced"
            icon={<Settings className="h-4 w-4" />}
            title="Configurações do Sistema"
            isActive={location === "/admin/settings-advanced"}
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