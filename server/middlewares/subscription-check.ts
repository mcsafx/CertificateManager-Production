import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

/**
 * Verifica se o tenant tem assinatura ativa
 */
export async function checkSubscription(req: Request, res: Response, next: NextFunction) {
  // Se o usuário não estiver autenticado, continua normalmente
  if (!req.isAuthenticated() || !req.user) {
    return next();
  }
  
  // Se o usuário for admin, sempre permite
  if (req.user.role === "admin") {
    return next();
  }
  
  // Obtém o tenant do usuário
  const tenant = req.user.tenantId ? await storage.getTenant(req.user.tenantId) : null;
  
  // Se o tenant estiver com status "overdue", bloqueia
  if (tenant && tenant.paymentStatus === "overdue") {
    return res.status(402).json({
      message: "Assinatura vencida. Por favor, renove sua assinatura para continuar usando o sistema."
    });
  }
  
  // Continue com o fluxo normal
  next();
}

/**
 * Atualiza o status da assinatura de um tenant
 */
export async function updateSubscriptionStatus(tenantId: number, paymentDate: Date = new Date(), durationMonths: number = 1) {
  try {
    // Verificações de segurança para os parâmetros
    if (!tenantId || isNaN(tenantId) || tenantId <= 0) {
      throw new Error(`ID do tenant inválido: ${tenantId}`);
    }
    
    if (isNaN(durationMonths) || durationMonths <= 0) {
      durationMonths = 1; // Valor padrão se inválido
    }
    
    // Garantir que paymentDate seja uma data válida
    if (!(paymentDate instanceof Date) || isNaN(paymentDate.getTime())) {
      paymentDate = new Date(); // Usa a data atual se inválida
    }
    
    // Obtém o tenant
    const tenant = await storage.getTenant(tenantId);
    if (!tenant) {
      throw new Error(`Tenant com ID ${tenantId} não encontrado`);
    }
    
    // Calcula a próxima data de pagamento
    const nextPaymentDate = new Date(paymentDate);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + durationMonths);
    
    // Atualiza os dados do tenant
    // Correção: Renovar assinatura não deve alterar a propriedade active
    const updatedTenant = await storage.updateTenant(tenantId, {
      paymentStatus: "active", // Define como ativo
      lastPaymentDate: paymentDate.toISOString(),
      nextPaymentDate: nextPaymentDate.toISOString()
      // active permanece inalterado
    });
    
    return {
      success: true,
      tenant: updatedTenant,
      message: `Assinatura renovada com sucesso até ${nextPaymentDate.toLocaleDateString()}`
    };
  } catch (error) {
    console.error("Erro ao atualizar status da assinatura:", error);
    throw error;
  }
}