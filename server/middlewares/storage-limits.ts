import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { plans } from '@shared/schema';

interface StorageLimitOptions {
  fieldName?: string; // Nome do campo de upload do arquivo
  errorMessage?: string; // Mensagem de erro personalizada
}

const DEFAULT_OPTIONS: StorageLimitOptions = {
  fieldName: 'file',
  errorMessage: 'Limite de armazenamento excedido para seu plano'
};

/**
 * Middleware para verificar e limitar uploads baseado no plano do tenant
 */
export async function checkStorageLimits(
  req: Request, 
  res: Response, 
  next: NextFunction, 
  options: StorageLimitOptions = DEFAULT_OPTIONS
) {
  try {
    if (!req.user || !req.user.tenantId) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    const tenantId = req.user.tenantId;
    const tenant = await storage.getTenant(tenantId);

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant não encontrado' });
    }

    // Obter detalhes do plano do tenant
    const tenantPlan = await storage.getPlan(tenant.planId);
    if (!tenantPlan) {
      return res.status(404).json({ message: 'Plano não encontrado' });
    }

    // Se não há arquivo sendo enviado, apenas passa adiante
    if (!req.file && (!req.files || Array.isArray(req.files) && req.files.length === 0)) {
      return next();
    }

    // Verificar limite de armazenamento total
    if (tenant.storageUsed >= tenantPlan.storageLimit) {
      return res.status(403).json({ 
        message: options.errorMessage || 'Limite de armazenamento excedido para seu plano',
        detail: 'Você atingiu o limite máximo de armazenamento do seu plano'
      });
    }

    // Obter tamanho do arquivo sendo enviado
    let fileSize = 0;
    if (req.file) {
      fileSize = req.file.size;
    } else if (req.files) {
      // Se for um array de arquivos
      if (Array.isArray(req.files)) {
        fileSize = req.files.reduce((total, file) => total + file.size, 0);
      } 
      // Se for um objeto de campos com arquivos
      else if (options.fieldName && req.files[options.fieldName]) {
        const field = req.files[options.fieldName];
        if (Array.isArray(field)) {
          fileSize = field.reduce((total, file) => total + file.size, 0);
        } else {
          fileSize = field.size;
        }
      }
    }

    // Converter tamanho para MB para comparar com limites
    const fileSizeMB = fileSize / (1024 * 1024);
    
    // Verifica limite máximo por arquivo baseado no plano
    const MAX_FILE_SIZE_MB = {
      'A': 2, // Plano Básico: 2MB/arquivo
      'B': 5, // Plano Intermediário: 5MB/arquivo
      'C': 10 // Plano Completo: 10MB/arquivo
    };
    
    const maxFileSize = MAX_FILE_SIZE_MB[tenantPlan.code as keyof typeof MAX_FILE_SIZE_MB] || 2;
    
    if (fileSizeMB > maxFileSize) {
      return res.status(413).json({ 
        message: `Tamanho máximo de arquivo excedido`,
        detail: `Seu plano permite arquivos de até ${maxFileSize}MB`
      });
    }

    // Verificar se o upload fará exceder o limite total
    const storageAfterUpload = tenant.storageUsed + fileSizeMB;
    if (storageAfterUpload > tenantPlan.storageLimit) {
      return res.status(403).json({ 
        message: 'Espaço de armazenamento insuficiente',
        detail: `Você tem ${(tenantPlan.storageLimit - tenant.storageUsed).toFixed(2)}MB disponíveis, mas está tentando enviar ${fileSizeMB.toFixed(2)}MB`
      });
    }

    // Adicionar ao objeto da requisição a informação de tamanho para uso posterior
    req.fileSizeMB = fileSizeMB;
    
    next();
  } catch (error) {
    console.error('Erro ao verificar limites de armazenamento:', error);
    next(error);
  }
}

/**
 * Middleware para atualizar o contador de armazenamento usado pelo tenant após upload bem-sucedido
 */
export async function updateStorageUsed(req: Request, res: Response, next: NextFunction) {
  const originalEnd = res.end;

  // Sobrescrever o método end para atualizar armazenamento apenas se o request for bem-sucedido
  res.end = function(chunk?: any, encoding?: BufferEncoding, callback?: () => void): Response {
    const statusCode = res.statusCode;
    
    // Atualiza contador apenas se o upload foi bem-sucedido (códigos 2xx)
    if (statusCode >= 200 && statusCode < 300 && req.user && req.fileSizeMB) {
      const tenantId = req.user.tenantId;
      
      // Atualizar contador de armazenamento de forma assíncrona (não bloqueia a resposta)
      (async () => {
        try {
          const tenant = await storage.getTenant(tenantId);
          if (tenant) {
            const newStorageUsed = tenant.storageUsed + req.fileSizeMB;
            await storage.updateTenant(tenantId, { storageUsed: newStorageUsed });
            console.log(`Armazenamento atualizado para tenant ${tenantId}: ${newStorageUsed.toFixed(2)}MB`);
          }
        } catch (error) {
          console.error('Erro ao atualizar contador de armazenamento:', error);
        }
      })();
    }
    
    // Restaurar comportamento original
    return originalEnd.call(this, chunk, encoding, callback);
  };
  
  next();
}

// Estender o tipo Request para incluir a propriedade fileSizeMB
declare global {
  namespace Express {
    interface Request {
      fileSizeMB?: number;
    }
  }
}