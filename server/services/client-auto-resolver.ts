import { db } from '../db.js';
import { clients } from '../../shared/schema.js';
import { eq, and, or, ilike } from 'drizzle-orm';
import { NFeClientData } from './nfe-xml-parser.js';
import { z } from 'zod';

export interface ClientResolutionResult {
  action: 'found' | 'create' | 'conflict';
  client?: {
    id: number;
    name: string;
    cnpj?: string;
    cpf?: string;
    taxIdentifier?: string;
    address?: string;
    phone?: string;
    qualityEmail?: string;
  };
  conflicts?: Array<{
    id: number;
    name: string;
    cnpj?: string;
    cpf?: string;
    taxIdentifier?: string;
    similarity: number;
    reason: string;
  }>;
  suggestedData?: {
    name: string;
    cnpj?: string;
    cpf?: string;
    taxIdentifier?: string;
    taxIdentifierType?: string;
    address?: string;
    phone?: string;
    qualityEmail?: string;
    isNational: boolean;
    country: string;
  };
}

export interface ClientAutoCreationData {
  name: string;
  cnpj?: string;
  cpf?: string;
  taxIdentifier?: string;
  taxIdentifierType?: string;
  address?: string;
  phone?: string;
  qualityEmail?: string;
  isNational: boolean;
  country: string;
  internalCode?: string;
  tenantId: number;
}

export class ClientAutoResolver {
  /**
   * Resolve client from NFe data - find existing or suggest creation
   */
  static async resolveClient(
    nfeClientData: NFeClientData, 
    tenantId: number
  ): Promise<ClientResolutionResult> {
    try {
      // First try exact match by CNPJ/CPF
      const exactMatch = await this.findExactMatch(nfeClientData, tenantId);
      if (exactMatch) {
        return {
          action: 'found',
          client: exactMatch
        };
      }

      // Check for potential conflicts (similar names, partial matches)
      const conflicts = await this.findPotentialConflicts(nfeClientData, tenantId);
      if (conflicts.length > 0) {
        return {
          action: 'conflict',
          conflicts,
          suggestedData: this.prepareSuggestedData(nfeClientData, tenantId)
        };
      }

      // No matches found, suggest creation
      return {
        action: 'create',
        suggestedData: this.prepareSuggestedData(nfeClientData, tenantId)
      };
    } catch (error) {
      throw new Error(`Erro ao resolver cliente: ${error.message}`);
    }
  }

  /**
   * Find exact match by CNPJ/CPF
   */
  private static async findExactMatch(
    nfeClientData: NFeClientData, 
    tenantId: number
  ): Promise<ClientResolutionResult['client'] | null> {
    const conditions = [eq(clients.tenantId, tenantId)];

    // Try CNPJ first
    if (nfeClientData.cnpj) {
      const cnpjClean = this.cleanDocument(nfeClientData.cnpj);
      conditions.push(eq(clients.cnpj, cnpjClean));
    }
    // Try CPF if no CNPJ
    else if (nfeClientData.cpf) {
      const cpfClean = this.cleanDocument(nfeClientData.cpf);
      conditions.push(eq(clients.taxIdentifier, cpfClean));
    }

    if (conditions.length === 1) {
      return null; // No document to search
    }

    const existingClient = await db.query.clients.findFirst({
      where: and(...conditions),
      columns: {
        id: true,
        name: true,
        cnpj: true,
        taxIdentifier: true,
        address: true,
        phone: true,
        qualityEmail: true
      }
    });

    if (existingClient) {
      return {
        id: existingClient.id,
        name: existingClient.name,
        cnpj: existingClient.cnpj,
        cpf: existingClient.taxIdentifier && existingClient.cnpj ? undefined : existingClient.taxIdentifier,
        taxIdentifier: existingClient.taxIdentifier,
        address: existingClient.address,
        phone: existingClient.phone,
        qualityEmail: existingClient.qualityEmail
      };
    }

    return null;
  }

  /**
   * Find potential conflicts (similar names, partial matches)
   */
  private static async findPotentialConflicts(
    nfeClientData: NFeClientData, 
    tenantId: number
  ): Promise<ClientResolutionResult['conflicts']> {
    const conflicts: ClientResolutionResult['conflicts'] = [];

    // Search by similar company name
    const nameSearchTerms = this.extractSearchTerms(nfeClientData.razaoSocial);
    
    if (nameSearchTerms.length > 0) {
      const nameMatches = await db.query.clients.findMany({
        where: and(
          eq(clients.tenantId, tenantId),
          or(
            ...nameSearchTerms.map(term => ilike(clients.name, `%${term}%`))
          )
        ),
        columns: {
          id: true,
          name: true,
          cnpj: true,
          taxIdentifier: true
        }
      });

      for (const match of nameMatches) {
        const similarity = this.calculateNameSimilarity(nfeClientData.razaoSocial, match.name);
        if (similarity > 0.6) { // 60% similarity threshold
          conflicts.push({
            id: match.id,
            name: match.name,
            cnpj: match.cnpj,
            cpf: match.taxIdentifier && !match.cnpj ? match.taxIdentifier : undefined,
            taxIdentifier: match.taxIdentifier,
            similarity,
            reason: `Nome similar (${Math.round(similarity * 100)}% de similaridade)`
          });
        }
      }
    }

    // Check for partial document matches (in case of formatting differences)
    if (nfeClientData.cnpj) {
      const cnpjPartial = this.cleanDocument(nfeClientData.cnpj).substring(0, 8); // First 8 digits
      const partialMatches = await db.query.clients.findMany({
        where: and(
          eq(clients.tenantId, tenantId),
          ilike(clients.cnpj, `${cnpjPartial}%`)
        ),
        columns: {
          id: true,
          name: true,
          cnpj: true,
          taxIdentifier: true
        }
      });

      for (const match of partialMatches) {
        if (match.cnpj && match.cnpj !== this.cleanDocument(nfeClientData.cnpj)) {
          conflicts.push({
            id: match.id,
            name: match.name,
            cnpj: match.cnpj,
            taxIdentifier: match.taxIdentifier,
            similarity: 0.8,
            reason: 'CNPJ com base similar (possível divergência de formatação)'
          });
        }
      }
    }

    // Remove duplicates and sort by similarity
    return conflicts
      .filter((conflict, index, self) => 
        index === self.findIndex(c => c.id === conflict.id)
      )
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5); // Limit to top 5 conflicts
  }

  /**
   * Prepare suggested data for client creation
   */
  private static prepareSuggestedData(
    nfeClientData: NFeClientData, 
    tenantId: number
  ): ClientAutoCreationData {
    const formatAddress = (endereco: NFeClientData['endereco']) => {
      const parts = [
        endereco.logradouro,
        endereco.numero,
        endereco.complemento,
        endereco.bairro,
        endereco.cidade,
        endereco.uf,
        endereco.cep
      ].filter(Boolean);
      
      return parts.join(', ');
    };

    return {
      name: nfeClientData.razaoSocial,
      cnpj: nfeClientData.cnpj ? this.cleanDocument(nfeClientData.cnpj) : undefined,
      cpf: nfeClientData.cpf ? this.cleanDocument(nfeClientData.cpf) : undefined,
      taxIdentifier: nfeClientData.cnpj ? 
        this.cleanDocument(nfeClientData.cnpj) : 
        (nfeClientData.cpf ? this.cleanDocument(nfeClientData.cpf) : undefined),
      taxIdentifierType: nfeClientData.cnpj ? 'CNPJ' : (nfeClientData.cpf ? 'CPF' : undefined),
      address: formatAddress(nfeClientData.endereco),
      phone: nfeClientData.telefone,
      qualityEmail: nfeClientData.email,
      isNational: true, // NFe is always national
      country: 'Brasil',
      tenantId
    };
  }

  /**
   * Auto-create client from NFe data
   */
  static async autoCreateClient(
    clientData: ClientAutoCreationData
  ): Promise<{ id: number; name: string }> {
    try {
      // Validate data
      const validatedData = this.validateClientData(clientData);
      
      // Generate internal code if not provided
      if (!validatedData.internalCode) {
        validatedData.internalCode = await this.generateInternalCode(clientData.tenantId);
      }

      // Insert client
      const [newClient] = await db.insert(clients).values(validatedData).returning({
        id: clients.id,
        name: clients.name
      });

      return newClient;
    } catch (error) {
      throw new Error(`Erro ao criar cliente automaticamente: ${error.message}`);
    }
  }

  /**
   * Validate client data for creation
   */
  private static validateClientData(clientData: ClientAutoCreationData): ClientAutoCreationData {
    const schema = z.object({
      name: z.string().min(1, 'Nome é obrigatório'),
      cnpj: z.string().optional(),
      cpf: z.string().optional(),
      taxIdentifier: z.string().optional(),
      taxIdentifierType: z.string().optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
      qualityEmail: z.string().email('Email inválido').optional().or(z.literal('')),
      isNational: z.boolean(),
      country: z.string().min(1, 'País é obrigatório'),
      internalCode: z.string().optional(),
      tenantId: z.number()
    });

    const result = schema.safeParse(clientData);
    if (!result.success) {
      throw new Error(`Dados inválidos para criação do cliente: ${result.error.message}`);
    }

    return result.data;
  }

  /**
   * Generate internal code for client
   */
  private static async generateInternalCode(tenantId: number): Promise<string> {
    const lastClient = await db.query.clients.findFirst({
      where: eq(clients.tenantId, tenantId),
      orderBy: (clients, { desc }) => [desc(clients.id)],
      columns: { internalCode: true }
    });

    if (lastClient?.internalCode) {
      const match = lastClient.internalCode.match(/CLI(\d+)/);
      if (match) {
        const nextNumber = parseInt(match[1]) + 1;
        return `CLI${nextNumber.toString().padStart(4, '0')}`;
      }
    }

    return 'CLI0001';
  }

  /**
   * Clean document (remove formatting)
   */
  private static cleanDocument(document: string): string {
    return document.replace(/\D/g, '');
  }

  /**
   * Extract search terms from company name
   */
  private static extractSearchTerms(name: string): string[] {
    const cleanName = name
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const stopWords = ['ltda', 'sa', 'eireli', 'me', 'epp', 'sociedade', 'empresa', 'comercial', 'industria', 'servicos'];
    
    return cleanName
      .split(' ')
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .slice(0, 3); // Take first 3 relevant terms
  }

  /**
   * Calculate name similarity using Levenshtein distance
   */
  private static calculateNameSimilarity(name1: string, name2: string): number {
    const clean1 = name1.toLowerCase().replace(/[^\w]/g, '');
    const clean2 = name2.toLowerCase().replace(/[^\w]/g, '');
    
    const distance = this.levenshteinDistance(clean1, clean2);
    const maxLength = Math.max(clean1.length, clean2.length);
    
    return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
  }

  /**
   * Calculate Levenshtein distance
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Bulk resolve multiple clients from NFe data
   */
  static async bulkResolveClients(
    nfeClientDataList: NFeClientData[], 
    tenantId: number
  ): Promise<ClientResolutionResult[]> {
    const results: ClientResolutionResult[] = [];
    
    for (const nfeClientData of nfeClientDataList) {
      try {
        const result = await this.resolveClient(nfeClientData, tenantId);
        results.push(result);
      } catch (error) {
        results.push({
          action: 'conflict',
          conflicts: [],
          suggestedData: this.prepareSuggestedData(nfeClientData, tenantId)
        });
      }
    }
    
    return results;
  }
}