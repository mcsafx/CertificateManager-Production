import { useState } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { SubscriptionAlert } from "@/components/subscription-alert";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop Sidebar */}
      <Sidebar isMobile={false} />
      
      {/* Mobile Sidebar */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 w-[280px] overflow-y-auto">
          <Sidebar isMobile={true} />
        </SheetContent>
      </Sheet>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onToggleSidebar={toggleMobileSidebar} />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6">
            <SubscriptionAlert />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
