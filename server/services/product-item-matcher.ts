import { db } from '../db.js';
import { products, productBase, productCategories, productSubcategories } from '../../shared/schema.js';
import { eq, and, or, ilike } from 'drizzle-orm';
import { NFeItemData } from './nfe-xml-parser.js';

export interface ProductMatch {
  id: number;
  baseProductId: number;
  sku?: string;
  technicalName: string;
  commercialName?: string;
  internalCode?: string;
  defaultMeasureUnit: string;
  category: string;
  subcategory: string;
  baseTechnicalName: string;
  baseCommercialName?: string;
  similarity: number;
  matchReasons: string[];
}

export interface ProductMatchResult {
  nfeItem: NFeItemData;
  matches: ProductMatch[];
  hasExactMatch: boolean;
  bestMatch?: ProductMatch;
  suggestions: {
    createNew: boolean;
    suggestedCategory?: string;
    suggestedSubcategory?: string;
    suggestedBaseName?: string;
  };
}

export interface ProductMappingPreference {
  id: number;
  nfeProductCode: string;
  nfeProductName: string;
  systemProductId: number;
  mappingConfidence: number;
  isManualMapping: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductItemMatcher {
  /**
   * Find matching products for NFe item
   */
  static async findMatches(
    nfeItem: NFeItemData,
    tenantId: number,
    usePreferences: boolean = true
  ): Promise<ProductMatchResult> {
    try {
      // Check for existing mapping preferences first
      if (usePreferences) {
        const preference = await this.findMappingPreference(nfeItem, tenantId);
        if (preference) {
          const exactMatch = await this.getProductById(preference.systemProductId, tenantId);
          if (exactMatch) {
            return {
              nfeItem,
              matches: [{ ...exactMatch, similarity: 1.0, matchReasons: ['Mapeamento manual salvo'] }],
              hasExactMatch: true,
              bestMatch: { ...exactMatch, similarity: 1.0, matchReasons: ['Mapeamento manual salvo'] },
              suggestions: { createNew: false }
            };
          }
        }
      }

      // Get all products for this tenant
      const allProducts = await this.getAllProducts(tenantId);
      
      // Calculate matches
      const matches = await this.calculateMatches(nfeItem, allProducts);
      
      // Sort by similarity
      const sortedMatches = matches.sort((a, b) => b.similarity - a.similarity);
      
      const hasExactMatch = sortedMatches.length > 0 && sortedMatches[0].similarity >= 0.9;
      const bestMatch = sortedMatches.length > 0 ? sortedMatches[0] : undefined;
      
      return {
        nfeItem,
        matches: sortedMatches.slice(0, 10), // Top 10 matches
        hasExactMatch,
        bestMatch,
        suggestions: this.generateSuggestions(nfeItem, sortedMatches)
      };
    } catch (error) {
      throw new Error(`Erro ao buscar produtos correspondentes: ${error.message}`);
    }
  }

  /**
   * Find mapping preference for NFe item
   */
  private static async findMappingPreference(
    nfeItem: NFeItemData,
    tenantId: number
  ): Promise<{ systemProductId: number } | null> {
    // This will be implemented when we create the mapping preferences table
    // For now, return null to skip preference checking
    return null;
  }

  /**
   * Get all products for tenant with related data
   */
  private static async getAllProducts(tenantId: number): Promise<any[]> {
    const result = await db.query.products.findMany({
      where: and(
        eq(products.tenantId, tenantId),
        eq(products.active, true)
      ),
      with: {
        baseProduct: {
          with: {
            subcategory: {
              with: {
                category: true
              }
            }
          }
        }
      }
    });

    return result;
  }

  /**
   * Get product by ID
   */
  private static async getProductById(productId: number, tenantId: number): Promise<ProductMatch | null> {
    const product = await db.query.products.findFirst({
      where: and(
        eq(products.id, productId),
        eq(products.tenantId, tenantId)
      ),
      with: {
        baseProduct: {
          with: {
            subcategory: {
              with: {
                category: true
              }
            }
          }
        }
      }
    });

    if (!product) return null;

    return {
      id: product.id,
      baseProductId: product.baseProductId,
      sku: product.sku,
      technicalName: product.technicalName,
      commercialName: product.commercialName,
      internalCode: product.internalCode,
      defaultMeasureUnit: product.defaultMeasureUnit,
      category: product.baseProduct.subcategory.category.name,
      subcategory: product.baseProduct.subcategory.name,
      baseTechnicalName: product.baseProduct.technicalName,
      baseCommercialName: product.baseProduct.commercialName,
      similarity: 0,
      matchReasons: []
    };
  }

  /**
   * Calculate matches between NFe item and products
   */
  private static async calculateMatches(
    nfeItem: NFeItemData,
    products: any[]
  ): Promise<ProductMatch[]> {
    const matches: ProductMatch[] = [];

    for (const product of products) {
      const similarity = this.calculateSimilarity(nfeItem, product);
      const matchReasons = this.getMatchReasons(nfeItem, product, similarity);

      if (similarity > 0.1) { // Only include matches with >10% similarity
        matches.push({
          id: product.id,
          baseProductId: product.baseProductId,
          sku: product.sku,
          technicalName: product.technicalName,
          commercialName: product.commercialName,
          internalCode: product.internalCode,
          defaultMeasureUnit: product.defaultMeasureUnit,
          category: product.baseProduct.subcategory.category.name,
          subcategory: product.baseProduct.subcategory.name,
          baseTechnicalName: product.baseProduct.technicalName,
          baseCommercialName: product.baseProduct.commercialName,
          similarity,
          matchReasons
        });
      }
    }

    return matches;
  }

  /**
   * Calculate similarity between NFe item and product
   */
  private static calculateSimilarity(nfeItem: NFeItemData, product: any): number {
    let totalScore = 0;
    let maxScore = 0;

    // Exact code match (highest priority)
    maxScore += 40;
    if (nfeItem.codigo && product.sku && this.normalizeCode(nfeItem.codigo) === this.normalizeCode(product.sku)) {
      totalScore += 40;
    } else if (nfeItem.codigo && product.internalCode && this.normalizeCode(nfeItem.codigo) === this.normalizeCode(product.internalCode)) {
      totalScore += 35;
    }

    // Name similarity (technical name)
    maxScore += 30;
    const technicalNameSimilarity = this.calculateTextSimilarity(nfeItem.descricao, product.technicalName);
    totalScore += technicalNameSimilarity * 30;

    // Name similarity (commercial name)
    maxScore += 20;
    if (product.commercialName) {
      const commercialNameSimilarity = this.calculateTextSimilarity(nfeItem.descricao, product.commercialName);
      totalScore += commercialNameSimilarity * 20;
    }

    // Base product name similarity
    maxScore += 15;
    const baseNameSimilarity = this.calculateTextSimilarity(nfeItem.descricao, product.baseProduct.technicalName);
    totalScore += baseNameSimilarity * 15;

    // Unit of measure match
    maxScore += 10;
    if (this.normalizeUnit(nfeItem.unidade) === this.normalizeUnit(product.defaultMeasureUnit)) {
      totalScore += 10;
    }

    // NCM match (if available)
    maxScore += 5;
    if (nfeItem.ncm && product.baseProduct.ncm && nfeItem.ncm === product.baseProduct.ncm) {
      totalScore += 5;
    }

    return maxScore > 0 ? totalScore / maxScore : 0;
  }

  /**
   * Get match reasons for a product
   */
  private static getMatchReasons(nfeItem: NFeItemData, product: any, similarity: number): string[] {
    const reasons: string[] = [];

    // Code matches
    if (nfeItem.codigo && product.sku && this.normalizeCode(nfeItem.codigo) === this.normalizeCode(product.sku)) {
      reasons.push('Código/SKU idêntico');
    } else if (nfeItem.codigo && product.internalCode && this.normalizeCode(nfeItem.codigo) === this.normalizeCode(product.internalCode)) {
      reasons.push('Código interno idêntico');
    }

    // Name similarity
    const technicalNameSimilarity = this.calculateTextSimilarity(nfeItem.descricao, product.technicalName);
    if (technicalNameSimilarity > 0.8) {
      reasons.push('Nome técnico muito similar');
    } else if (technicalNameSimilarity > 0.6) {
      reasons.push('Nome técnico similar');
    }

    if (product.commercialName) {
      const commercialNameSimilarity = this.calculateTextSimilarity(nfeItem.descricao, product.commercialName);
      if (commercialNameSimilarity > 0.8) {
        reasons.push('Nome comercial muito similar');
      } else if (commercialNameSimilarity > 0.6) {
        reasons.push('Nome comercial similar');
      }
    }

    // Unit match
    if (this.normalizeUnit(nfeItem.unidade) === this.normalizeUnit(product.defaultMeasureUnit)) {
      reasons.push('Unidade de medida idêntica');
    }

    // NCM match
    if (nfeItem.ncm && product.baseProduct.ncm && nfeItem.ncm === product.baseProduct.ncm) {
      reasons.push('NCM idêntico');
    }

    // Overall similarity
    if (similarity > 0.9) {
      reasons.push('Alta similaridade geral');
    } else if (similarity > 0.7) {
      reasons.push('Boa similaridade geral');
    } else if (similarity > 0.5) {
      reasons.push('Similaridade moderada');
    }

    return reasons;
  }

  /**
   * Generate suggestions for unmatched items
   */
  private static generateSuggestions(nfeItem: NFeItemData, matches: ProductMatch[]): ProductMatchResult['suggestions'] {
    const suggestions: ProductMatchResult['suggestions'] = { createNew: false };

    if (matches.length === 0 || (matches.length > 0 && matches[0].similarity < 0.5)) {
      suggestions.createNew = true;
      
      // Try to suggest category based on product name
      suggestions.suggestedCategory = this.suggestCategory(nfeItem.descricao);
      suggestions.suggestedBaseName = this.cleanProductName(nfeItem.descricao);
    }

    return suggestions;
  }

  /**
   * Suggest category based on product description
   */
  private static suggestCategory(description: string): string {
    const desc = description.toLowerCase();
    
    // Chemical categories
    if (desc.includes('acido') || desc.includes('acid')) return 'Ácidos';
    if (desc.includes('base') || desc.includes('soda') || desc.includes('hidroxido')) return 'Bases';
    if (desc.includes('sal') || desc.includes('cloreto') || desc.includes('sulfato')) return 'Sais';
    if (desc.includes('solvente') || desc.includes('alcool') || desc.includes('acetona')) return 'Solventes';
    if (desc.includes('oxido') || desc.includes('peróxido')) return 'Óxidos';
    if (desc.includes('gas') || desc.includes('gás')) return 'Gases';
    
    return 'Outros Produtos Químicos';
  }

  /**
   * Clean product name for suggestions
   */
  private static cleanProductName(name: string): string {
    return name
      .replace(/\b\d+\s*(kg|l|ml|g|ton|t)\b/gi, '') // Remove quantities
      .replace(/\b\d+%\b/g, '') // Remove percentages
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }

  /**
   * Normalize code for comparison
   */
  private static normalizeCode(code: string): string {
    return code.replace(/[^\w]/g, '').toLowerCase();
  }

  /**
   * Normalize unit for comparison
   */
  private static normalizeUnit(unit: string): string {
    const unitMap: { [key: string]: string } = {
      'kg': 'kg',
      'kgs': 'kg',
      'quilograma': 'kg',
      'quilogramas': 'kg',
      'l': 'l',
      'lt': 'l',
      'lts': 'l',
      'litro': 'l',
      'litros': 'l',
      'ml': 'ml',
      'mililitro': 'ml',
      'mililitros': 'ml',
      'g': 'g',
      'gr': 'g',
      'grs': 'g',
      'grama': 'g',
      'gramas': 'g',
      'ton': 't',
      'tonelada': 't',
      'toneladas': 't',
      't': 't',
      'un': 'un',
      'und': 'un',
      'unidade': 'un',
      'unidades': 'un',
      'pc': 'pc',
      'pcs': 'pc',
      'peça': 'pc',
      'peças': 'pc'
    };

    return unitMap[unit.toLowerCase()] || unit.toLowerCase();
  }

  /**
   * Calculate text similarity using Levenshtein distance
   */
  private static calculateTextSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;
    
    const clean1 = this.cleanTextForComparison(text1);
    const clean2 = this.cleanTextForComparison(text2);
    
    if (clean1 === clean2) return 1;
    
    const distance = this.levenshteinDistance(clean1, clean2);
    const maxLength = Math.max(clean1.length, clean2.length);
    
    return maxLength === 0 ? 0 : (maxLength - distance) / maxLength;
  }

  /**
   * Clean text for comparison
   */
  private static cleanTextForComparison(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
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
   * Save mapping preference
   */
  static async saveMappingPreference(
    nfeItem: NFeItemData,
    systemProductId: number,
    tenantId: number,
    isManual: boolean = true
  ): Promise<void> {
    // This will be implemented when we create the mapping preferences table
    // For now, this is a placeholder
    console.log('Saving mapping preference:', {
      nfeProductCode: nfeItem.codigo,
      nfeProductName: nfeItem.descricao,
      systemProductId,
      tenantId,
      isManual
    });
  }

  /**
   * Bulk match multiple NFe items
   */
  static async bulkMatch(
    nfeItems: NFeItemData[],
    tenantId: number,
    usePreferences: boolean = true
  ): Promise<ProductMatchResult[]> {
    const results: ProductMatchResult[] = [];
    
    for (const nfeItem of nfeItems) {
      try {
        const matchResult = await this.findMatches(nfeItem, tenantId, usePreferences);
        results.push(matchResult);
      } catch (error) {
        // On error, return empty match result
        results.push({
          nfeItem,
          matches: [],
          hasExactMatch: false,
          suggestions: { createNew: true, suggestedBaseName: nfeItem.descricao }
        });
      }
    }
    
    return results;
  }

  /**
   * Get matching statistics
   */
  static getMatchingStats(results: ProductMatchResult[]): {
    totalItems: number;
    exactMatches: number;
    goodMatches: number;
    noMatches: number;
    needsReview: number;
  } {
    const stats = {
      totalItems: results.length,
      exactMatches: 0,
      goodMatches: 0,
      noMatches: 0,
      needsReview: 0
    };

    for (const result of results) {
      if (result.hasExactMatch) {
        stats.exactMatches++;
      } else if (result.bestMatch && result.bestMatch.similarity > 0.7) {
        stats.goodMatches++;
      } else if (result.matches.length === 0) {
        stats.noMatches++;
      } else {
        stats.needsReview++;
      }
    }

    return stats;
  }
}