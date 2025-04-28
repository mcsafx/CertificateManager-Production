import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

/**
 * Middleware para verificar se o usuário tem acesso a uma determinada feature
 * baseada no seu plano/tenant
 * 
 * @param featurePath Padrão de caminho da feature (ex: "/api/products*")
 */
export function checkFeatureAccess(featurePath: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Se não está autenticado, retorna 401
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    const user = req.user;
    
    // Administradores do sistema têm acesso a tudo
    if (user.role === "admin" || user.role === "system_admin") {
      return next();
    }
    
    try {
      // Obter o tenant do usuário
      const tenant = await storage.getTenant(user.tenantId);
      if (!tenant) {
        console.log(`[checkFeatureAccess] Tenant não encontrado para o usuário ${user.username} (ID: ${user.id})`);
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      // Obter os módulos do plano do tenant
      const planModules = await storage.getModulesByPlan(tenant.planId);
      if (!planModules || planModules.length === 0) {
        console.log(`[checkFeatureAccess] Nenhum módulo encontrado para o plano ${tenant.planId}`);
        return res.status(403).json({ message: "Acesso negado - plano sem módulos" });
      }
      
      // Obter todos os módulos IDs
      const moduleIds = planModules.map(m => m.id);
      
      // Verificar se o usuário tem acesso à feature específica
      let hasAccess = false;
      
      // Buscar features para cada módulo do plano
      for (const moduleId of moduleIds) {
        const moduleFeatures = await storage.getModuleFeaturesByModule(moduleId);
        
        // Verificar se alguma das features corresponde ao padrão de caminho solicitado
        const matchingFeature = moduleFeatures.find(feature => {
          // Se a feature path tem wildcard (*), fazemos uma comparação parcial
          if (feature.featurePath.endsWith('*')) {
            const basePath = feature.featurePath.slice(0, -1); // Remove o asterisco
            return req.path.startsWith(basePath);
          }
          // Caso contrário, exigimos uma correspondência exata
          return feature.featurePath === req.path;
        });
        
        if (matchingFeature) {
          hasAccess = true;
          break;
        }
      }
      
      if (hasAccess) {
        return next();
      } else {
        console.log(`[checkFeatureAccess] Acesso negado para ${user.username} à feature ${req.path}`);
        return res.status(403).json({ message: "Acesso negado a esta funcionalidade" });
      }
    } catch (error) {
      console.error(`[checkFeatureAccess] Erro ao verificar acesso:`, error);
      return res.status(500).json({ message: "Erro ao verificar permissões de acesso" });
    }
  };
}