import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { AlertCircle, AlertTriangle, X } from "lucide-react";
import { useState } from "react";

export function SubscriptionAlert() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  
  if (!user?.tenantStatus || dismissed) return null;
  
  const { status, message, contactInfo } = user.tenantStatus;
  
  // Se não houver status ou for active, não mostrar alerta
  if (status === 'active' || !status) return null;

  return (
    <Alert 
      variant={status === 'overdue' ? 'destructive' : 'default'}
      className={`relative mb-6 ${status === 'overdue' ? 'bg-destructive/10' : 'bg-muted/50'}`}
    >
      {status === 'overdue' ? (
        <AlertCircle className="h-4 w-4" />
      ) : (
        <AlertTriangle className="h-4 w-4" />
      )}
      <AlertTitle className="font-medium">
        {status === 'overdue' ? 'Assinatura Vencida' : 'Atenção'}
      </AlertTitle>
      <AlertDescription className="mt-1">
        <p>{message}</p>
        
        {contactInfo && status === 'overdue' && (
          <div className="mt-2 text-sm">
            <p>Entre em contato com o administrador para resolver esta situação:</p>
            <div className="mt-1 space-y-1">
              <p><strong>Nome:</strong> {contactInfo.name}</p>
              <p><strong>Telefone:</strong> {contactInfo.phone}</p>
              <p><strong>Endereço:</strong> {contactInfo.address}</p>
            </div>
          </div>
        )}
      </AlertDescription>
      
      <Button 
        size="sm" 
        variant="ghost" 
        className="absolute top-2 right-2 h-6 w-6 p-0" 
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Fechar</span>
      </Button>
    </Alert>
  );
}