import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Menu, 
  Search, 
  Bell, 
  MoreVertical 
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const [location, navigate] = useLocation();
  const { logoutMutation } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality if needed
    console.log("Search for:", searchQuery);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const isInCertificatesSection = location.includes("certificates");

  return (
    <header className="bg-white shadow-sm">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center lg:hidden">
          <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
            <Menu className="h-6 w-6 text-gray-500" />
          </Button>
        </div>
        
        <div className="flex-1 mx-4">
          <form onSubmit={handleSearch} className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              className="pl-10" 
              placeholder="Buscar boletins, produtos, fornecedores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5 text-gray-500" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate("/settings")}>
                Configurações
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleLogout}>
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {isInCertificatesSection && (
        <div className="border-b border-gray-200">
          <nav className="flex px-4">
            <Link href="/certificates">
              <a className={`px-4 py-3 font-medium relative ${location === "/certificates" ? "text-primary" : "text-gray-600"}`}>
                Boletins de Entrada
                {location === "/certificates" && (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary"></span>
                )}
              </a>
            </Link>
            <Link href="/issued-certificates">
              <a className={`px-4 py-3 font-medium relative ${location === "/issued-certificates" ? "text-primary" : "text-gray-600"}`}>
                Boletins Emitidos
                {location === "/issued-certificates" && (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary"></span>
                )}
              </a>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
