import { parseString } from 'xml2js';
import { promisify } from 'util';

const parseStringAsync = promisify(parseString);

export interface NFeClientData {
  cnpj?: string;
  cpf?: string;
  razaoSocial: string;
  nomeFantasia?: string;
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  };
  email?: string;
  telefone?: string;
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
    
    if (xmlObject.nfe) {
      return xmlObject.nfe;
    }

    // Handle namespaced elements
    const keys = Object.keys(xmlObject);
    for (const key of keys) {
      if (key.includes('nfe') || key.includes('NFe')) {
        if (xmlObject[key].nfe) {
          return xmlObject[key].nfe;
        }
        if (xmlObject[key].infnfe) {
          return xmlObject[key];
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

    return {
      numero: ide.nnf?.toString() || '',
      serie: ide.serie?.toString() || '',
      dataEmissao: this.parseDate(ide.dhemi || ide.demi),
      dataVencimento: ide.dtvenc ? this.parseDate(ide.dtvenc) : undefined,
      tipoOperacao: ide.tpnf === '1' ? 'SAIDA' : 'ENTRADA',
      naturezaOperacao: ide.natop || '',
      chaveAcesso: infNFe.id?.replace('NFe', '') || infNFe.chave || '',
      observacoes: infNFe.infadfisco?.trim() || undefined
    };
  }

  /**
   * Extract client data (emitente or destinatario)
   */
  private static extractClientData(clientElement: any): NFeClientData {
    if (!clientElement) {
      throw new Error('Dados do cliente não encontrados');
    }

    const endereco = clientElement.endereco;
    if (!endereco) {
      throw new Error('Endereço do cliente não encontrado');
    }

    return {
      cnpj: clientElement.cnpj,
      cpf: clientElement.cpf,
      razaoSocial: clientElement.xnome || clientElement.xfant || '',
      nomeFantasia: clientElement.xfant,
      endereco: {
        logradouro: endereco.xlgr || '',
        numero: endereco.nro || '',
        complemento: endereco.xcpl,
        bairro: endereco.xbairro || '',
        cidade: endereco.xmun || '',
        uf: endereco.uf || '',
        cep: endereco.cep || ''
      },
      email: clientElement.email,
      telefone: clientElement.fone
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
        codigo: prod.cprod || '',
        descricao: prod.xprod || '',
        quantidade: parseFloat(prod.qcom || '0'),
        unidade: prod.ucom || '',
        valorUnitario: parseFloat(prod.vuncom || '0'),
        valorTotal: parseFloat(prod.vtotaltrib || prod.vprod || '0'),
        ncm: prod.ncm,
        cfop: prod.cfop,
        observacao: prod.infadprod?.trim()
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
        destinatario: nfeData.destinatario.razaoSocial,
        cnpjDestinatario: nfeData.destinatario.cnpj || nfeData.destinatario.cpf || '',
        totalItens: nfeData.itens.length,
        valorTotal
      };
    } catch (error) {
      throw new Error(`Erro ao extrair resumo da NFe: ${error.message}`);
    }
  }
}