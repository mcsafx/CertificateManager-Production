import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

/**
 * Middleware para verificar o status da assinatura de um tenant
 * Se o status for 'overdue', o acesso é bloqueado
 */
export async function checkSubscriptionStatus(req: Request, res: Response, next: NextFunction) {
  try {
    // Precisamos garantir que o usuário esteja autenticado e tenha um tenantId
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }

    // Se for um usuário admin global, não aplicamos a verificação de assinatura
    if (req.user.role === "admin" && req.user.tenantId === 1) {
      return next();
    }

    // Buscar o tenant pelo ID
    const tenant = await storage.getTenant(req.user.tenantId);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant não encontrado" });
    }

    // Se o tenant não estiver ativo, bloqueamos o acesso
    if (!tenant.active) {
      return res.status(403).json({ 
        message: "Acesso bloqueado: conta desativada",
        subscriptionStatus: "inactive"
      });
    }

    // Verificar o status de pagamento
    if (tenant.paymentStatus === "overdue") {
      return res.status(403).json({ 
        message: "Acesso bloqueado: assinatura atrasada",
        subscriptionStatus: "overdue" 
      });
    }

    // Verificar se há uma data de próximo pagamento e se está no passado
    if (tenant.nextPaymentDate) {
      const nextPaymentDate = new Date(tenant.nextPaymentDate);
      const today = new Date();
      
      // Se a data do próximo pagamento for no passado e o status não for "overdue",
      // atualizamos para "overdue" e bloqueamos o acesso
      if (nextPaymentDate < today && tenant.paymentStatus !== "overdue") {
        await storage.updateTenant(tenant.id, { paymentStatus: "overdue" });
        return res.status(403).json({ 
          message: "Acesso bloqueado: assinatura vencida",
          subscriptionStatus: "overdue"
        });
      }
      
      // Se estiver próximo ao vencimento (faltando 5 dias), definimos status como "pending" 
      // mas permitimos o acesso
      const fiveDaysFromNow = new Date();
      fiveDaysFromNow.setDate(today.getDate() + 5);
      
      if (nextPaymentDate < fiveDaysFromNow && tenant.paymentStatus === "active") {
        await storage.updateTenant(tenant.id, { paymentStatus: "pending" });
      }
    }

    // Se passou por todas as verificações, continua
    next();
  } catch (error) {
    console.error("Erro ao verificar status da assinatura:", error);
    next(error);
  }
}

/**
 * Função para atualizar automaticamente o status da assinatura quando um pagamento é processado
 */
export async function updateSubscriptionStatus(tenantId: number, paymentDate: Date, durationMonths: number = 1) {
  try {
    const tenant = await storage.getTenant(tenantId);
    if (!tenant) {
      throw new Error("Tenant não encontrado");
    }

    // Calcular a próxima data de pagamento (X meses a partir da data atual)
    const nextPaymentDate = new Date(paymentDate);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + durationMonths);

    // Atualizar o tenant com as novas informações
    await storage.updateTenant(tenantId, {
      lastPaymentDate: paymentDate.toISOString().split('T')[0],
      nextPaymentDate: nextPaymentDate.toISOString().split('T')[0],
      paymentStatus: "active"
    });

    return {
      success: true,
      lastPaymentDate: paymentDate,
      nextPaymentDate: nextPaymentDate,
      status: "active"
    };
  } catch (error) {
    console.error("Erro ao atualizar status da assinatura:", error);
    throw error;
  }
}