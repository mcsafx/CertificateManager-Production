import { parseString } from 'xml2js';
import { promisify } from 'util';

const parseStringAsync = promisify(parseString);

export interface NFeClientData {
  cnpj?: string;
  cpf?: string;
  nome: string;           // Nome (razão social)
  codigoInterno?: string; // Código Interno (não disponível no XML)
  emailQualidade?: string; // E-mail do setor de Qualidade
  telefone?: string;      // Telefone
  endereco: string;       // Endereço (concatenado da tag enderDest)
  // Campos auxiliares para compatibilidade
  nomeFantasia?: string;
}

export interface NFeItemData {
  codigo: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  valorTotal: number;
  ncm?: string;
  cfop?: string;
  observacao?: string;
}

export interface NFeInvoiceData {
  numero: string;
  serie: string;
  dataEmissao: Date;
  dataVencimento?: Date;
  tipoOperacao: string;
  naturezaOperacao: string;
  chaveAcesso: string;
  numeroProtocolo?: string;
  dataProtocolo?: Date;
  observacoes?: string;
}

export interface NFeData {
  invoice: NFeInvoiceData;
  emitente: NFeClientData;
  destinatario: NFeClientData;
  itens: NFeItemData[];
}

export class NFeXmlParser {
  /**
   * Parse NFe XML string and extract structured data
   */
  static async parseNFeXml(xmlContent: string): Promise<NFeData> {
    try {
      const result = await parseStringAsync(xmlContent, {
        explicitArray: false,
        ignoreAttrs: false,
        mergeAttrs: true,
        trim: true,
        normalizeTags: true
      });

      // Handle different NFe XML namespaces and structures
      const nfeRoot = this.findNFeRoot(result);
      if (!nfeRoot) {
        throw new Error('Estrutura NFe não encontrada no XML');
      }

      const infNFe = nfeRoot.infnfe;
      if (!infNFe) {
        throw new Error('Elemento infNFe não encontrado');
      }

      return {
        invoice: this.extractInvoiceData(infNFe),
        emitente: this.extractClientData(infNFe.emit),
        destinatario: this.extractClientData(infNFe.dest),
        itens: this.extractItemsData(infNFe.det)
      };
    } catch (error) {
      throw new Error(`Erro ao fazer parse do XML NFe: ${error.message}`);
    }
  }

  /**
   * Find NFe root element handling different XML structures
   */
  private static findNFeRoot(xmlObject: any): any {
    // Try common NFe XML structures
    if (xmlObject.nfeproc && xmlObject.nfeproc.nfe) {
      return xmlObject.nfeproc.nfe;
    }
    
    if (xmlObject.nfeProc && xmlObject.nfeProc.NFe) {
      return xmlObject.nfeProc.NFe;
    }
    
    if (xmlObject.nfe) {
      return xmlObject.nfe;
    }

    if (xmlObject.NFe) {
      return xmlObject.NFe;
    }

    // Handle namespaced elements (for xmlns structures)
    const keys = Object.keys(xmlObject);
    for (const key of keys) {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('nfeproc')) {
        const nfeProc = xmlObject[key];
        if (nfeProc.nfe || nfeProc.NFe) {
          return nfeProc.nfe || nfeProc.NFe;
        }
      }
      if (lowerKey === 'nfe' || lowerKey.includes('nfe')) {
        const nfeElement = xmlObject[key];
        if (nfeElement.infnfe || nfeElement.infNFe) {
          return nfeElement;
        }
      }
    }

    return null;
  }

  /**
   * Extract invoice/document data from NFe
   */
  private static extractInvoiceData(infNFe: any): NFeInvoiceData {
    const ide = infNFe.ide;
    if (!ide) {
      throw new Error('Elemento ide não encontrado');
    }

    // Extract access key from Id attribute (case variations due to normalizeTags)
    const chaveAcesso = infNFe.Id?.replace('NFe', '') || infNFe.id?.replace('NFe', '') || '';

    return {
      numero: ide.nNF?.toString() || ide.nnf?.toString() || '',
      serie: ide.serie?.toString() || '',
      dataEmissao: this.parseDate(ide.dhEmi || ide.dhemi || ide.demi),
      dataVencimento: ide.dtvenc ? this.parseDate(ide.dtvenc) : undefined,
      tipoOperacao: ide.tpNF === '1' || ide.tpnf === '1' ? 'SAIDA' : 'ENTRADA',
      naturezaOperacao: ide.natOp || ide.natop || '',
      chaveAcesso: chaveAcesso,
      observacoes: infNFe.infAdic?.infCpl?.trim() || infNFe.infadic?.infcpl?.trim() || undefined
    };
  }

  /**
   * Extract client data (emitente or destinatario)
   * Maps NFe <dest> tag fields to Cliente Nacional fields:
   * - CNPJ/CPF → cnpj/cpf (CNPJ ou CPF)
   * - xNome → nome (Nome - razão social)
   * - enderDest group → endereco (Endereço concatenado)
   * - email → emailQualidade (E-mail do setor de Qualidade)
   * - fone → telefone (Telefone)
   * - Código Interno: não disponível no XML NFe
   */
  private static extractClientData(clientElement: any): NFeClientData {
    if (!clientElement) {
      throw new Error('Dados do cliente não encontrados');
    }

    // Handle different address field names for emit/dest with case variations
    // Note: normalizeTags: true converts all tags to lowercase
    const endereco = clientElement.enderEmit || clientElement.enderemit || 
                     clientElement.enderDest || clientElement.enderdest;
    
    if (!endereco) {
      throw new Error('Endereço do cliente não encontrado');
    }

    // Consolidate enderDest group into single address string for "Endereço" field
    // Format: Logradouro, Número, Complemento, Bairro, Cidade - UF, CEP
    // Note: normalizeTags: true converts all XML tags to lowercase
    const addressParts = [];
    
    // Logradouro + Número
    const logradouro = endereco.xLgr || endereco.xlgr || '';
    const numero = endereco.nro || '';
    if (logradouro) {
      addressParts.push(numero ? `${logradouro}, ${numero}` : logradouro);
    }
    
    // Complemento
    const complemento = endereco.xCpl || endereco.xcpl || '';
    if (complemento) {
      addressParts.push(complemento);
    }
    
    // Bairro
    const bairro = endereco.xBairro || endereco.xbairro || '';
    if (bairro) {
      addressParts.push(bairro);
    }
    
    // Cidade - UF
    const cidade = endereco.xMun || endereco.xmun || '';
    const uf = endereco.UF || endereco.uf || '';
    if (cidade && uf) {
      addressParts.push(`${cidade} - ${uf}`);
    } else if (cidade) {
      addressParts.push(cidade);
    }
    
    // CEP
    const cep = endereco.CEP || endereco.cep || '';
    if (cep) {
      addressParts.push(`CEP: ${cep}`);
    }
    
    const enderecoCompleto = addressParts.join(', ');

    return {
      cnpj: clientElement.CNPJ || clientElement.cnpj,
      cpf: clientElement.CPF || clientElement.cpf,
      nome: clientElement.xNome || clientElement.xnome || '',        // Nome (razão social)
      codigoInterno: undefined,                                      // Código Interno (não disponível no XML)
      emailQualidade: clientElement.email,                           // E-mail do setor de Qualidade
      telefone: clientElement.fone,                                  // Telefone
      endereco: enderecoCompleto,                                    // Endereço consolidado
      // Campos auxiliares para compatibilidade
      nomeFantasia: clientElement.xFant || clientElement.xfant
    };
  }

  /**
   * Extract items data from NFe
   */
  private static extractItemsData(detElements: any): NFeItemData[] {
    if (!detElements) {
      return [];
    }

    // Handle single item vs array of items
    const items = Array.isArray(detElements) ? detElements : [detElements];
    
    return items.map((det: any) => {
      const prod = det.prod;
      if (!prod) {
        throw new Error('Dados do produto não encontrados');
      }

      return {
        codigo: prod.cProd || prod.cprod || '',
        descricao: prod.xProd || prod.xprod || '',
        quantidade: parseFloat(prod.qCom || prod.qcom || '0'),
        unidade: prod.uCom || prod.ucom || '',
        valorUnitario: parseFloat(prod.vUnCom || prod.vuncom || '0'),
        valorTotal: parseFloat(prod.vProd || prod.vprod || '0'),
        ncm: prod.NCM || prod.ncm,
        cfop: prod.CFOP || prod.cfop,
        observacao: det.infAdProd?.trim() || det.infadprod?.trim()
      };
    });
  }

  /**
   * Parse date from NFe format
   */
  private static parseDate(dateString: string): Date {
    if (!dateString) {
      return new Date();
    }

    // Handle different date formats in NFe
    // ISO format: 2024-01-01T10:00:00-03:00
    // Date only: 2024-01-01
    try {
      return new Date(dateString);
    } catch (error) {
      console.warn(`Erro ao fazer parse da data: ${dateString}`);
      return new Date();
    }
  }

  /**
   * Validate NFe XML structure
   */
  static validateNFeXml(xmlContent: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      // Basic XML validation
      if (!xmlContent.trim()) {
        errors.push('XML vazio');
        return { isValid: false, errors };
      }

      // Check for NFe indicators
      const hasNFeIndicators = xmlContent.includes('NFe') || 
                              xmlContent.includes('nfe') ||
                              xmlContent.includes('infNFe');

      if (!hasNFeIndicators) {
        errors.push('XML não parece ser uma NFe válida');
      }

      // Check for required elements
      const requiredElements = ['emit', 'dest', 'ide', 'det'];
      for (const element of requiredElements) {
        if (!xmlContent.includes(element)) {
          errors.push(`Elemento obrigatório não encontrado: ${element}`);
        }
      }

      return { isValid: errors.length === 0, errors };
    } catch (error) {
      errors.push(`Erro na validação: ${error.message}`);
      return { isValid: false, errors };
    }
  }

  /**
   * Extract summary information from NFe for quick preview
   */
  static async extractNFeSummary(xmlContent: string): Promise<{
    numeroNFe: string;
    serie: string;
    dataEmissao: string;
    destinatario: string;
    cnpjDestinatario: string;
    totalItens: number;
    valorTotal: number;
  }> {
    try {
      const nfeData = await this.parseNFeXml(xmlContent);
      
      const valorTotal = nfeData.itens.reduce((sum, item) => sum + item.valorTotal, 0);
      
      return {
        numeroNFe: nfeData.invoice.numero,
        serie: nfeData.invoice.serie,
        dataEmissao: nfeData.invoice.dataEmissao.toLocaleDateString('pt-BR'),
        destinatario: nfeData.destinatario.nome,
        cnpjDestinatario: nfeData.destinatario.cnpj || nfeData.destinatario.cpf || '',
        totalItens: nfeData.itens.length,
        valorTotal
      };
    } catch (error) {
      throw new Error(`Erro ao extrair resumo da NFe: ${error.message}`);
    }
  }
}