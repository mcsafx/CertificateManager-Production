import { storage } from "../storage";
import { updateSubscriptionStatus } from "../middlewares/subscription-check";

/**
 * Gerenciador de assinaturas que verifica periodicamente o status das assinaturas
 * e atualiza os status conforme necessário.
 */
export class SubscriptionManager {
  private static instance: SubscriptionManager;
  private checkInterval: NodeJS.Timeout | null = null;
  private intervalTime = 1000 * 60 * 60 * 6; // A cada 6 horas

  private constructor() {}

  /**
   * Obtém a instância do gerenciador de assinaturas
   */
  public static getInstance(): SubscriptionManager {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new SubscriptionManager();
    }
    return SubscriptionManager.instance;
  }

  /**
   * Inicia o verificador periódico de assinaturas
   */
  public startPeriodicCheck() {
    if (this.checkInterval) {
      return; // Já está rodando
    }

    // Executar uma primeira verificação imediatamente
    this.checkAllSubscriptions();

    // Configurar verificação periódica
    this.checkInterval = setInterval(() => {
      this.checkAllSubscriptions();
    }, this.intervalTime);

    console.log("Verificador de assinaturas iniciado. Intervalo: a cada 6 horas");
  }

  /**
   * Para o verificador periódico de assinaturas
   */
  public stopPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log("Verificador de assinaturas parado");
    }
  }

  /**
   * Verifica todas as assinaturas e atualiza seus status conforme necessário
   */
  public async checkAllSubscriptions() {
    try {
      console.log("Verificando status de todas as assinaturas...");
      const tenants = await storage.getAllTenants();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Define para meia-noite do dia atual
      
      let updated = 0;
      
      for (const tenant of tenants) {
        // Pular se não tiver data de próximo pagamento
        if (!tenant.nextPaymentDate) {
          continue;
        }
        
        const nextPaymentDate = new Date(tenant.nextPaymentDate);
        nextPaymentDate.setHours(0, 0, 0, 0); // Define para meia-noite também para comparar apenas datas
        
        // Se a data de próximo pagamento já passou e o status não é "overdue"
        if (nextPaymentDate < today && tenant.paymentStatus !== "overdue") {
          await storage.updateTenant(tenant.id, { 
            paymentStatus: "overdue",
            active: false
          });
          updated++;
          console.log(`Tenant ${tenant.id} (${tenant.name}) alterado para status "overdue" - pagamento vencido`);
        }
        // Se está próximo do vencimento (faltando 5 dias), definir status como "pending"
        else if (tenant.paymentStatus === "active") {
          const fiveDaysFromNow = new Date(today);
          fiveDaysFromNow.setDate(today.getDate() + 5);
          
          if (nextPaymentDate <= fiveDaysFromNow) {
            await storage.updateTenant(tenant.id, { paymentStatus: "pending" });
            updated++;
            console.log(`Tenant ${tenant.id} (${tenant.name}) alterado para status "pending" - pagamento próximo do vencimento`);
          }
        }
      }
      
      console.log(`Verificação de assinaturas concluída. ${updated} tenants atualizados.`);
    } catch (error) {
      console.error("Erro ao verificar assinaturas:", error);
    }
  }

  /**
   * Renova uma assinatura com os parâmetros informados
   */
  public async renewSubscription(tenantId: number, paymentDate: Date = new Date(), durationMonths: number = 1) {
    try {
      return await updateSubscriptionStatus(tenantId, paymentDate, durationMonths);
    } catch (error) {
      console.error("Erro ao renovar assinatura:", error);
      throw error;
    }
  }
}

// Exportamos o singleton
export const subscriptionManager = SubscriptionManager.getInstance();