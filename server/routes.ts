import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin, isTenantMember } from "./auth";
import { z } from "zod";
import { 
  insertProductSchema, insertProductCharacteristicSchema, 
  insertSupplierSchema, insertManufacturerSchema, 
  insertClientSchema, insertEntryCertificateSchema,
  insertEntryCertificateResultSchema, insertIssuedCertificateSchema,
  insertTenantSchema, insertPackageTypeSchema,
  insertProductCategorySchema, insertProductSubcategorySchema,
  insertProductBaseSchema, insertProductFileSchema, insertProductBaseFileSchema,
  insertFileSchema
} from "@shared/schema";
import { tempUpload, moveFileToFinalStorage, getFileSizeInMB, removeFile, getFileUrl } from "./services/file-upload";
import { checkStorageLimits, updateStorageUsed } from "./middlewares/storage-limits";
import { checkFeatureAccess } from "./middlewares/feature-access";

export async function registerRoutes(app: Express): Promise<Server> {
  // Função para formatar números com 4 casas decimais
  function formatNumberTo4Decimals(value: any): string {
    if (value === null || value === undefined || value === '') {
      return 'N/A';
    }
    
    try {
      // Converte para número e formata com 4 casas decimais
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return 'N/A';
      }
      // Formata com 4 casas decimais e troca ponto por vírgula (padrão brasileiro)
      return numValue.toFixed(4).replace('.', ',');
    } catch (e) {
      // Em caso de erro, retorna o valor original
      return String(value);
    }
  }

  // Set up authentication routes
  setupAuth(app);
  
  // Rotas para visualização e download de arquivos
  app.get("/api/files/view/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const fileId = Number(req.params.id);
      const fileType = req.query.type as string;
      
      let file;
      if (fileType === 'base') {
        file = await storage.getProductBaseFile(fileId, user.tenantId);
      } else {
        file = await storage.getProductFile(fileId, user.tenantId);
      }
      
      if (!file) {
        return res.status(404).json({ message: "Arquivo não encontrado" });
      }
      
      // Em um ambiente de produção real, você anexaria o arquivo real aqui
      // Para este exemplo, redirecionamos para o fileUrl (que em produção seria um URL válido)
      if (file.fileUrl && file.fileUrl.startsWith('http')) {
        return res.redirect(file.fileUrl);
      }
      
      // Para arquivos em base64 ou caminhos relativos, exibimos uma página HTML simples
      res.setHeader('Content-Type', 'text/html');
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${file.fileName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
            .file-info { margin: 20px; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            .file-name { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
            .file-desc { color: #666; margin-bottom: 20px; }
            .message { color: #333; background: #f5f5f5; padding: 15px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="file-info">
            <div class="file-name">${file.fileName}</div>
            <div class="file-desc">${file.description || 'Sem descrição'}</div>
            <div class="message">
              Este é um ambiente de demonstração.<br>
              Em produção, o arquivo seria exibido aqui.
            </div>
          </div>
        </body>
        </html>
      `);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/files/download/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const fileId = Number(req.params.id);
      const fileType = req.query.type as string;
      
      let file;
      if (fileType === 'base') {
        file = await storage.getProductBaseFile(fileId, user.tenantId);
      } else {
        file = await storage.getProductFile(fileId, user.tenantId);
      }
      
      if (!file) {
        return res.status(404).json({ message: "Arquivo não encontrado" });
      }
      
      // Em um ambiente de produção real, você enviaria o arquivo real aqui
      // Para este exemplo, enviamos um PDF ou texto de exemplo
      res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
      
      if (file.fileType && file.fileType.includes('pdf')) {
        res.setHeader('Content-Type', 'application/pdf');
        // Enviamos um PDF de exemplo (texto que indica que é apenas um exemplo)
        res.send(Buffer.from('%PDF-1.5\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 500 800] /Contents 6 0 R >>\nendobj\n4 0 obj\n<< /Font << /F1 5 0 R >> >>\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n6 0 obj\n<< /Length 68 >>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(ARQUIVO DE EXEMPLO - CERTQUALITY) Tj\nET\nendstream\nendobj\nxref\n0 7\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000216 00000 n\n0000000259 00000 n\n0000000326 00000 n\ntrailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n444\n%%EOF'));
      } else {
        res.setHeader('Content-Type', 'text/plain');
        res.send(`Este é um arquivo de exemplo do CertQuality.
        
Nome do arquivo: ${file.fileName}
Descrição: ${file.description || 'Sem descrição'}
Tipo: ${file.fileType || 'Não especificado'}
Tamanho: ${file.fileSize || 'Não especificado'}

Em um ambiente de produção, este seria o conteúdo real do arquivo.`);
      }
    } catch (error) {
      next(error);
    }
  });
  
  // Rotas para visualização de certificados em HTML
  app.get("/api/certificates/view/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const certificateId = Number(req.params.id);
      
      // Obter o certificado e seus resultados
      const certificate = await storage.getEntryCertificate(certificateId, user.tenantId);
      
      if (!certificate) {
        return res.status(404).json({ message: "Certificado não encontrado" });
      }
      
      // Buscar dados relacionados
      const supplier = await storage.getSupplier(certificate.supplierId, user.tenantId);
      const manufacturer = await storage.getManufacturer(certificate.manufacturerId, user.tenantId);
      const product = await storage.getProduct(certificate.productId, user.tenantId);
      const results = await storage.getResultsByEntryCertificate(certificateId, user.tenantId);
      
      // Formatar datas
      const formatDate = (date: Date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('pt-BR');
      };
      
      // Renderizar HTML
      res.setHeader('Content-Type', 'text/html');
      res.send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <title>Certificado #${certificate.id} - ${product ? product.technicalName : 'Produto'}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            :root {
              --primary: #0066cc;
              --primary-light: #e6f0ff;
              --success: #10b981;
              --warning: #f59e0b;
              --danger: #ef4444;
              --gray-50: #f9fafb;
              --gray-100: #f3f4f6;
              --gray-200: #e5e7eb;
              --gray-300: #d1d5db;
              --gray-400: #9ca3af;
              --gray-500: #6b7280;
              --gray-700: #374151;
              --gray-900: #111827;
            }
            
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            
            html, body {
              font-family: 'Inter', sans-serif;
              font-size: 14px;
              line-height: 1.6;
              color: var(--gray-900);
              background-color: #f5f5f5;
            }
            
            /* Tamanho A4 para impressão */
            .a4-page {
              width: 210mm;
              min-height: 297mm;
              padding: 20mm;
              margin: 20px auto;
              background-color: white;
              box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
              position: relative;
            }
            
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 8rem;
              color: rgba(0, 0, 0, 0.03);
              font-weight: bold;
              z-index: 0;
              pointer-events: none;
              white-space: nowrap;
            }
            
            .cert-header {
              position: relative;
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding-bottom: 16px;
              border-bottom: 2px solid var(--primary);
              margin-bottom: 32px;
              z-index: 1;
            }
            
            .logo-area {
              display: flex;
              flex-direction: column;
            }
            
            .logo-placeholder {
              width: 180px;
              height: 60px;
              background: linear-gradient(135deg, var(--primary-light), var(--primary));
              display: flex;
              justify-content: center;
              align-items: center;
              color: white;
              font-weight: bold;
              border-radius: 4px;
              margin-bottom: 8px;
            }
            
            .cert-title {
              color: var(--primary);
              font-size: 1.8rem;
              font-weight: 700;
            }
            
            .cert-id {
              padding: 8px 16px;
              background-color: var(--primary);
              color: white;
              border-radius: 8px;
              font-weight: 600;
              font-size: 1.1rem;
            }
            
            .section {
              margin-bottom: 28px;
              position: relative;
              z-index: 1;
            }
            
            .section-title {
              font-size: 1.25rem;
              color: var(--primary);
              font-weight: 600;
              margin-bottom: 16px;
              padding-bottom: 6px;
              border-bottom: 1px solid var(--gray-200);
              display: flex;
              align-items: center;
            }
            
            .section-title::before {
              content: '';
              display: inline-block;
              width: 12px;
              height: 12px;
              background-color: var(--primary);
              margin-right: 8px;
              border-radius: 3px;
            }
            
            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 18px 24px;
            }
            
            .info-item {
              position: relative;
            }
            
            .info-label {
              font-size: 0.85rem;
              color: var(--gray-500);
              margin-bottom: 2px;
              font-weight: 500;
            }
            
            .info-value {
              font-weight: 500;
              color: var(--gray-900);
              background-color: var(--gray-50);
              padding: 6px 10px;
              border-radius: 4px;
              border: 1px solid var(--gray-200);
            }
            
            .badge {
              display: inline-flex;
              align-items: center;
              padding: 4px 12px;
              border-radius: 50px;
              font-weight: 600;
              font-size: 0.85rem;
            }
            
            .badge-approved {
              background-color: rgba(16, 185, 129, 0.1);
              color: var(--success);
            }
            
            .badge-rejected {
              background-color: rgba(239, 68, 68, 0.1);
              color: var(--danger);
            }
            
            .badge-pending {
              background-color: rgba(245, 158, 11, 0.1);
              color: var(--warning);
            }
            
            .cert-table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
              border-radius: 8px;
              overflow: hidden;
              border: 1px solid var(--gray-200);
            }
            
            .cert-table th {
              background-color: var(--primary-light);
              color: var(--primary);
              font-weight: 600;
              text-align: left;
              padding: 12px 16px;
              border-bottom: 1px solid var(--gray-200);
            }
            
            .cert-table td {
              padding: 10px 16px;
              border-bottom: 1px solid var(--gray-200);
            }
            
            .cert-table tr:last-child td {
              border-bottom: none;
            }
            
            .cert-table tr:nth-child(even) {
              background-color: var(--gray-50);
            }
            
            .footer {
              margin-top: 40px;
              text-align: center;
              color: var(--gray-500);
              font-size: 0.85rem;
              padding-top: 16px;
              border-top: 1px solid var(--gray-200);
              position: absolute;
              bottom: 20mm;
              left: 20mm;
              right: 20mm;
            }
            
            .signatures {
              margin-top: 60px;
              display: flex;
              justify-content: space-between;
            }
            
            .signature {
              width: 200px;
              text-align: center;
            }
            
            .signature-line {
              margin: 50px auto 8px;
              width: 100%;
              border-top: 1px solid var(--gray-400);
            }
            
            .signature-name {
              font-weight: 600;
            }
            
            .signature-title {
              font-size: 0.85rem;
              color: var(--gray-500);
            }
            
            .print-button {
              position: fixed;
              top: 20px;
              right: 20px;
              background-color: var(--primary);
              color: white;
              border: none;
              padding: 10px 16px;
              border-radius: 4px;
              font-weight: 500;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 8px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
              z-index: 100;
            }
            
            .print-button:hover {
              background-color: #0052a3;
            }
            
            @media print {
              body {
                background: none;
              }
              
              .a4-page {
                width: 210mm;
                height: 297mm;
                margin: 0;
                padding: 10mm;
                box-shadow: none;
                page-break-after: always;
              }
              
              .print-button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <button class="print-button" onclick="window.print()">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Imprimir
          </button>
          
          <div class="a4-page">
            <div class="watermark">CERTIFICADO</div>
            
            <header class="cert-header">
              <div class="logo-area">
                <div class="logo-placeholder">CertQuality</div>
                <div>Sistema de Gestão de Certificados</div>
              </div>
              <div>
                <div class="cert-title">Boletim de Análise</div>
                <div class="cert-id">#${certificate.id}</div>
              </div>
            </header>
            
            <section class="section">
              <h2 class="section-title">Dados do Fornecedor</h2>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Fornecedor</div>
                  <div class="info-value">${supplier ? supplier.name : 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Fabricante</div>
                  <div class="info-value">${manufacturer ? manufacturer.name : 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Documento de Referência</div>
                  <div class="info-value">${certificate.referenceDocument || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Data de Entrada</div>
                  <div class="info-value">${certificate.entryDate ? formatDate(new Date(certificate.entryDate)) : 'N/A'}</div>
                </div>
              </div>
            </section>
            
            <section class="section">
              <h2 class="section-title">Dados do Produto</h2>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Produto</div>
                  <div class="info-value">${product ? product.technicalName : 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Código do Produto</div>
                  <div class="info-value">${product ? product.sku : 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Quantidade Recebida</div>
                  <div class="info-value">${certificate.receivedQuantity} ${certificate.measureUnit}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Tipo de Embalagem</div>
                  <div class="info-value">${certificate.packageType || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Lote do Fornecedor</div>
                  <div class="info-value">${certificate.supplierLot || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Lote Interno</div>
                  <div class="info-value">${certificate.internalLot || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Data de Fabricação</div>
                  <div class="info-value">${certificate.manufacturingDate ? formatDate(new Date(certificate.manufacturingDate)) : 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Data de Validade</div>
                  <div class="info-value">${certificate.expirationDate ? formatDate(new Date(certificate.expirationDate)) : 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Data de Inspeção</div>
                  <div class="info-value">${certificate.inspectionDate ? formatDate(new Date(certificate.inspectionDate)) : 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Status</div>
                  <div class="info-value">
                    <span class="badge ${
                      certificate.status === "Aprovado" ? "badge-approved" : 
                      certificate.status === "Reprovado" ? "badge-rejected" : 
                      "badge-pending"
                    }">
                      ${certificate.status}
                    </span>
                  </div>
                </div>
              </div>
            </section>
            
            <section class="section">
              <h2 class="section-title">Características e Resultados</h2>
              <table class="cert-table">
                <thead>
                  <tr>
                    <th>Característica</th>
                    <th>Unidade</th>
                    <th>Mínimo</th>
                    <th>Máximo</th>
                    <th>Resultado</th>
                    <th>Método</th>
                  </tr>
                </thead>
                <tbody>
                  ${results && results.length > 0 ? results.map(result => `
                    <tr>
                      <td>${result.characteristicName}</td>
                      <td>${result.unit}</td>
                      <td>${result.minValue !== null ? formatNumberTo4Decimals(result.minValue) : '-'}</td>
                      <td>${result.maxValue !== null ? formatNumberTo4Decimals(result.maxValue) : '-'}</td>
                      <td>${formatNumberTo4Decimals(result.obtainedValue)}</td>
                      <td>${result.analysisMethod || '-'}</td>
                    </tr>
                  `).join('') : `
                    <tr>
                      <td colspan="6" style="text-align: center; padding: 20px;">
                        Nenhum resultado de análise encontrado para este certificado.
                      </td>
                    </tr>
                  `}
                </tbody>
              </table>
            </section>
            
            <div class="signatures">
              <div class="signature">
                <div class="signature-line"></div>
                <div class="signature-name">Controle de Qualidade</div>
                <div class="signature-title">Responsável Técnico</div>
              </div>
              
              <div class="signature">
                <div class="signature-line"></div>
                <div class="signature-name">Aprovação</div>
                <div class="signature-title">Gerente de Qualidade</div>
              </div>
            </div>
            
            <div class="footer">
              <p>Este certificado de análise foi gerado pelo sistema CertQuality em ${new Date().toLocaleString('pt-BR')}</p>
              <p>Documento válido apenas com assinatura digital ou física.</p>
            </div>
          </div>
        </body>
        </html>
      `);
    } catch (error) {
      next(error);
    }
  });
  
  // Endpoint para visualização de certificados emitidos em HTML


  app.get("/api/issued-certificates/view/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const certificateId = Number(req.params.id);
      
      // Obter o certificado
      const certificate = await storage.getIssuedCertificate(certificateId, user.tenantId);
      
      if (!certificate) {
        return res.status(404).json({ message: "Certificado não encontrado" });
      }
      
      // Obter o certificado de entrada relacionado
      const entryCertificate = await storage.getEntryCertificate(certificate.entryCertificateId, user.tenantId);
      
      if (!entryCertificate) {
        return res.status(404).json({ message: "Certificado de entrada não encontrado" });
      }
      
      // Buscar dados relacionados
      const [supplier, manufacturer, product, client, results, tenant] = await Promise.all([
        storage.getSupplier(entryCertificate.supplierId, user.tenantId),
        storage.getManufacturer(entryCertificate.manufacturerId, user.tenantId),
        storage.getProduct(entryCertificate.productId, user.tenantId),
        storage.getClient(certificate.clientId, user.tenantId),
        storage.getResultsByEntryCertificate(entryCertificate.id, user.tenantId),
        storage.getTenant(user.tenantId)
      ]);
      
      // Formatar datas
      const formatDate = (date: Date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('pt-BR');
      };
      
      // Cálculo do período de validade
      const calcValidityPeriod = (mfgDate: string | null, expDate: string | null): string => {
        if (!mfgDate || !expDate) return 'N/A';
        
        try {
          const mfg = new Date(mfgDate);
          const exp = new Date(expDate);
          
          // Calcula diferença em meses
          const diffMonths = (exp.getFullYear() - mfg.getFullYear()) * 12 + 
                              (exp.getMonth() - mfg.getMonth());
          
          return `${diffMonths} MESES`;
        } catch (e) {
          return 'N/A';
        }
      };
      
      // Renderizar HTML seguindo a estrutura definida
      res.setHeader('Content-Type', 'text/html');
      res.send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <title>Certificado de Qualidade - ${product ? product.technicalName : 'Produto'}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: Arial, Helvetica, sans-serif;
              margin: 0;
              padding: 0;
              color: #333;
              background-color: #f9f9f9;
              line-height: 1.4;
            }
            
            .a4-page {
              width: 210mm;
              min-height: 297mm;
              padding: 15mm;
              margin: 10mm auto;
              background: white;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              position: relative;
            }
            
            .header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
            }
            
            .logo-container {
              flex: 0 0 40%;
            }
            
            .company-logo {
              max-height: 70px;
              max-width: 200px;
            }
            
            .company-info {
              flex: 0 0 55%;
              text-align: right;
              font-size: 13px;
            }
            
            .company-name {
              font-weight: bold;
              font-size: 16px;
              margin-bottom: 5px;
            }
            
            .page-title {
              text-align: center;
              font-size: 22px;
              font-weight: bold;
              margin: 25px 0;
              border-top: 1px solid #ddd;
              border-bottom: 1px solid #ddd;
              padding: 10px 0;
            }
            
            .section {
              margin-bottom: 25px;
            }
            
            .section-title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 10px;
              border-bottom: 1px solid #eee;
              padding-bottom: 5px;
            }
            
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
            }
            
            .info-item {
              margin-bottom: 8px;
            }
            
            .info-label {
              font-weight: bold;
              margin-bottom: 3px;
              font-size: 13px;
            }
            
            .info-value {
              font-size: 14px;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }
            
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
              font-size: 14px;
            }
            
            th {
              background-color: #f8f8f8;
              font-weight: bold;
            }
            
            .footer {
              margin-top: 30px;
              font-size: 12px;
              border-top: 1px solid #eee;
              padding-top: 15px;
            }
            
            .print-btn {
              display: block;
              margin: 20px auto 0;
              padding: 10px 20px;
              background-color: #4a6da7;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-weight: bold;
            }
            
            @media print {
              body {
                background: none;
              }
              
              .a4-page {
                box-shadow: none;
                margin: 0;
                padding: 10mm;
              }
              
              .print-btn {
                display: none;
              }
              
              @page {
                size: A4;
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="a4-page">
            <!-- 1. Cabeçalho -->
            <div class="header">
              <!-- Logomarca no canto superior esquerdo -->
              <div class="logo-container">
                ${tenant?.logoUrl 
                  ? `<img src="${tenant.logoUrl}" alt="${tenant.name}" class="company-logo">` 
                  : `<div class="company-name">${tenant?.name || 'Empresa'}</div>`}
              </div>
              
              <!-- Informações da empresa no canto superior direito -->
              <div class="company-info">
                <div class="company-name">${tenant?.name || 'Empresa'}</div>
                <div>${tenant?.address || ''}</div>
                <div>CNPJ: ${tenant?.cnpj || ''}</div>
                <div>Telefone: ${tenant?.phone || ''}</div>
              </div>
            </div>
            
            <!-- Título da página -->
            <div class="page-title">CERTIFICADO DE QUALIDADE</div>
            
            <!-- 2. Divisão Principal -->
            <!-- Seção 1: Dados do Cliente -->
            <div class="section">
              <div class="section-title">Dados do Cliente</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Nome do Cliente:</div>
                  <div class="info-value">${client ? client.name : 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Endereço:</div>
                  <div class="info-value">${client ? client.address || 'N/A' : 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Telefone:</div>
                  <div class="info-value">${client ? client.phone || 'N/A' : 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">CNPJ:</div>
                  <div class="info-value">${client ? client.cnpj || 'N/A' : 'N/A'}</div>
                </div>
              </div>
            </div>
            
            <!-- Seção 2: Informações do Produto -->
            <div class="section">
              <div class="section-title">Informações do Produto</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Nome do Produto:</div>
                  <div class="info-value">${product ? product.technicalName : 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Número da Nota Fiscal:</div>
                  <div class="info-value">${certificate.invoiceNumber}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Data de Emissão:</div>
                  <div class="info-value">${certificate.issueDate ? formatDate(new Date(certificate.issueDate)) : 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Quantidade Vendida:</div>
                  <div class="info-value">${certificate.soldQuantity} ${certificate.measureUnit}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Lote do Produto:</div>
                  <div class="info-value">${certificate.customLot || entryCertificate.internalLot}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Data de Fabricação:</div>
                  <div class="info-value">${entryCertificate.manufacturingDate ? formatDate(new Date(entryCertificate.manufacturingDate)) : 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Data de Validade:</div>
                  <div class="info-value">${entryCertificate.expirationDate ? formatDate(new Date(entryCertificate.expirationDate)) : 'N/A'}</div>
                </div>
                ${certificate.showSupplierInfo ? `
                <div class="info-item">
                  <div class="info-label">Nome do Fabricante:</div>
                  <div class="info-value">${manufacturer ? manufacturer.name : 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">País de Origem:</div>
                  <div class="info-value">${manufacturer ? manufacturer.country : 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Fornecedor:</div>
                  <div class="info-value">${supplier ? supplier.name : 'N/A'}</div>
                </div>
                ` : ``}
              </div>
            </div>
            
            <!-- Seção 3: Características e Especificações -->
            <div class="section">
              <div class="section-title">Características e Especificações</div>
              <table>
                <thead>
                  <tr>
                    <th>Características</th>
                    <th>Unidades</th>
                    <th>Especificação</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  ${results.length > 0 ? results.map((result: any) => `
                    <tr>
                      <td>${result.characteristicName}</td>
                      <td>${result.unit}</td>
                      <td>${result.minValue && result.maxValue ? 
                        `${formatNumberTo4Decimals(result.minValue)} - ${formatNumberTo4Decimals(result.maxValue)}` : 
                        (result.minValue ? formatNumberTo4Decimals(result.minValue) : 
                         (result.maxValue ? formatNumberTo4Decimals(result.maxValue) : 'N/A'))}</td>
                      <td><strong>${formatNumberTo4Decimals(result.obtainedValue)}</strong></td>
                    </tr>
                  `).join('') : `
                    <tr>
                      <td colspan="4">Sem resultados disponíveis</td>
                    </tr>
                  `}
                </tbody>
              </table>
            </div>
            
            <!-- 3. Rodapé -->
            <div class="footer">
              <p>Os dados informados neste Certificado são resultados obtidos em nosso laboratório, seguindo rigorosamente nossos padrões. 
              Estas recomendações são dadas de boa fé, sendo que, se o armazenamento, transporte, e/ou manuseio não forem adequados 
              às nossas recomendações, não nos responsabilizamos por eventual garantia.</p>
              
              <div style="margin-top: 20px; text-align: center;">
                <p><strong>Data de emissão do certificado:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
            
            <!-- Botão de Impressão (visível apenas na tela) -->
            <button class="print-btn" onclick="window.print()">Imprimir Certificado</button>
          </div>
        </body>
        </html>
      `);
    } catch (error) {
      next(error);
    }
  });
  
  // Rota para download do arquivo original do certificado
  app.get("/api/certificates/download/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const certificateId = Number(req.params.id);
      
      // Obter o certificado
      const certificate = await storage.getEntryCertificate(certificateId, user.tenantId);
      
      if (!certificate) {
        return res.status(404).json({ message: "Certificado não encontrado" });
      }
      
      // Verificar se o certificado tem um arquivo original
      if (!certificate.originalFileUrl) {
        return res.status(404).json({ message: "Este certificado não possui um arquivo original anexado" });
      }
      
      // Redirecionar para a URL original do arquivo
      // Isso permite que o navegador abra o arquivo diretamente
      return res.redirect(certificate.originalFileUrl);
      
    } catch (error) {
      next(error);
    }
  });
  
  // Package Types routes
  app.get("/api/package-types", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const packageTypes = await storage.getPackageTypesByTenant(user.tenantId);
      res.json(packageTypes);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/package-types", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const parsedBody = insertPackageTypeSchema.parse({
        ...req.body,
        tenantId: user.tenantId
      });
      
      const packageType = await storage.createPackageType(parsedBody);
      res.status(201).json(packageType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });
  
  app.get("/api/package-types/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const packageType = await storage.getPackageType(
        Number(req.params.id), 
        user.tenantId
      );
      
      if (!packageType) {
        return res.status(404).json({ message: "Package type not found" });
      }
      
      res.json(packageType);
    } catch (error) {
      next(error);
    }
  });
  
  app.patch("/api/package-types/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const packageType = await storage.updatePackageType(
        Number(req.params.id), 
        user.tenantId, 
        req.body
      );
      
      if (!packageType) {
        return res.status(404).json({ message: "Package type not found" });
      }
      
      res.json(packageType);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/package-types/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const success = await storage.deletePackageType(Number(req.params.id), user.tenantId);
      
      if (!success) {
        return res.status(404).json({ message: "Package type not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Tenant routes (for admin)
  app.get("/api/tenants", isAdmin, async (req, res, next) => {
    try {
      const tenants = await storage.getAllTenants();
      res.json(tenants);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/tenants", isAdmin, async (req, res, next) => {
    try {
      const parsedBody = insertTenantSchema.parse(req.body);
      const tenant = await storage.createTenant(parsedBody);
      res.status(201).json(tenant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/tenants/:id", isAdmin, async (req, res, next) => {
    try {
      const tenant = await storage.getTenant(Number(req.params.id));
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      res.json(tenant);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/tenants/:id", isAdmin, async (req, res, next) => {
    try {
      const tenant = await storage.updateTenant(Number(req.params.id), req.body);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      res.json(tenant);
    } catch (error) {
      next(error);
    }
  });
  
  // Endpoint para que membros de um tenant (incluindo não-admin) possam atualizar seu próprio tenant
  app.patch("/api/tenant/profile", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const tenant = await storage.updateTenant(user.tenantId, req.body);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      res.json(tenant);
    } catch (error) {
      next(error);
    }
  });
  
  // Endpoint para que membros de um tenant possam obter as informações do seu próprio tenant
  app.get("/api/tenant/profile", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const tenant = await storage.getTenant(user.tenantId);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      res.json(tenant);
    } catch (error) {
      next(error);
    }
  });

  // User routes (for admins and tenant admins)
  app.get("/api/users", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      let users;
      
      if (user.role === "admin") {
        // Admin can see all users from any tenant
        if (req.query.tenantId) {
          users = await storage.getUsersByTenant(Number(req.query.tenantId));
        } else {
          // Get users from all tenants
          const tenants = await storage.getAllTenants();
          users = [];
          for (const tenant of tenants) {
            const tenantUsers = await storage.getUsersByTenant(tenant.id);
            users.push(...tenantUsers);
          }
        }
      } else {
        // Regular users can only see users from their own tenant
        users = await storage.getUsersByTenant(user.tenantId);
      }
      
      // Remove passwords from the response
      const sanitizedUsers = users.map(({ password, ...rest }) => rest);
      res.json(sanitizedUsers);
    } catch (error) {
      next(error);
    }
  });

  // Product Categories routes
  app.get("/api/product-categories", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const categories = await storage.getProductCategoriesByTenant(user.tenantId);
      res.json(categories);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/product-categories", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const parsedBody = insertProductCategorySchema.parse({
        ...req.body,
        tenantId: user.tenantId
      });
      
      const category = await storage.createProductCategory(parsedBody);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/product-categories/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const category = await storage.getProductCategory(
        Number(req.params.id), 
        user.tenantId
      );
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/product-categories/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const category = await storage.updateProductCategory(
        Number(req.params.id), 
        user.tenantId, 
        req.body
      );
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/product-categories/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const success = await storage.deleteProductCategory(Number(req.params.id), user.tenantId);
      
      if (!success) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Product Subcategories routes
  app.get("/api/product-subcategories", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
      
      let subcategories;
      if (categoryId) {
        subcategories = await storage.getProductSubcategoriesByCategory(categoryId, user.tenantId);
      } else {
        subcategories = await storage.getProductSubcategoriesByTenant(user.tenantId);
      }
      
      res.json(subcategories);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/product-subcategories", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const parsedBody = insertProductSubcategorySchema.parse({
        ...req.body,
        tenantId: user.tenantId
      });
      
      const subcategory = await storage.createProductSubcategory(parsedBody);
      res.status(201).json(subcategory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/product-subcategories/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const subcategory = await storage.getProductSubcategory(
        Number(req.params.id), 
        user.tenantId
      );
      
      if (!subcategory) {
        return res.status(404).json({ message: "Subcategory not found" });
      }
      
      res.json(subcategory);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/product-subcategories/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const subcategory = await storage.updateProductSubcategory(
        Number(req.params.id), 
        user.tenantId, 
        req.body
      );
      
      if (!subcategory) {
        return res.status(404).json({ message: "Subcategory not found" });
      }
      
      res.json(subcategory);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/product-subcategories/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const success = await storage.deleteProductSubcategory(Number(req.params.id), user.tenantId);
      
      if (!success) {
        return res.status(404).json({ message: "Subcategory not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Product Base routes
  app.get("/api/product-base", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const subcategoryId = req.query.subcategoryId ? Number(req.query.subcategoryId) : undefined;
      
      let productBases;
      if (subcategoryId) {
        productBases = await storage.getProductBasesBySubcategory(subcategoryId, user.tenantId);
      } else {
        productBases = await storage.getProductBasesByTenant(user.tenantId);
      }
      
      res.json(productBases);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/product-base", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const parsedBody = insertProductBaseSchema.parse({
        ...req.body,
        tenantId: user.tenantId
      });
      
      const productBase = await storage.createProductBase(parsedBody);
      res.status(201).json(productBase);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/product-base/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const productBase = await storage.getProductBase(
        Number(req.params.id), 
        user.tenantId
      );
      
      if (!productBase) {
        return res.status(404).json({ message: "Product base not found" });
      }
      
      res.json(productBase);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/product-base/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const productBase = await storage.updateProductBase(
        Number(req.params.id), 
        user.tenantId, 
        req.body
      );
      
      if (!productBase) {
        return res.status(404).json({ message: "Product base not found" });
      }
      
      res.json(productBase);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/product-base/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const success = await storage.deleteProductBase(Number(req.params.id), user.tenantId);
      
      if (!success) {
        return res.status(404).json({ message: "Product base not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Product Files routes
  app.post("/api/product-files", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const parsedBody = insertProductFileSchema.parse({
        ...req.body,
        tenantId: user.tenantId
      });
      
      const productFile = await storage.createProductFile(parsedBody);
      res.status(201).json(productFile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/products/:productId/files", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const files = await storage.getProductFilesByProduct(
        Number(req.params.productId), 
        user.tenantId
      );
      
      res.json(files);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/product-files/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const success = await storage.deleteProductFile(Number(req.params.id), user.tenantId);
      
      if (!success) {
        return res.status(404).json({ message: "Product file not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  
  // Product Base Files routes
  app.post("/api/product-base-files", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const parsedBody = insertProductBaseFileSchema.parse({
        ...req.body,
        tenantId: user.tenantId
      });
      
      const productBaseFile = await storage.createProductBaseFile(parsedBody);
      res.status(201).json(productBaseFile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/product-base/:baseProductId/files", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const files = await storage.getProductBaseFilesByBaseProduct(
        Number(req.params.baseProductId), 
        user.tenantId
      );
      
      res.json(files);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/product-base/:baseProductId/files/:category", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const files = await storage.getProductBaseFilesByCategory(
        Number(req.params.baseProductId),
        req.params.category,
        user.tenantId
      );
      
      res.json(files);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/product-base-files/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const success = await storage.deleteProductBaseFile(Number(req.params.id), user.tenantId);
      
      if (!success) {
        return res.status(404).json({ message: "Product base file not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Products routes (modificado para variantes de produtos)
  app.get("/api/products", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const baseProductId = req.query.baseProductId ? Number(req.query.baseProductId) : undefined;
      
      let products;
      if (baseProductId) {
        products = await storage.getProductsByBase(baseProductId, user.tenantId);
      } else {
        products = await storage.getProductsByTenant(user.tenantId);
      }
      
      res.json(products);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/products", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const parsedBody = insertProductSchema.parse({
        ...req.body,
        tenantId: user.tenantId
      });
      
      const product = await storage.createProduct(parsedBody);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/products/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const product = await storage.getProduct(Number(req.params.id), user.tenantId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Get product characteristics
      const characteristics = await storage.getCharacteristicsByProduct(product.id, user.tenantId);
      
      res.json({ ...product, characteristics });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/products/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const product = await storage.updateProduct(Number(req.params.id), user.tenantId, req.body);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/products/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const success = await storage.deleteProduct(Number(req.params.id), user.tenantId);
      
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Product Characteristics routes
  app.post("/api/product-characteristics", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const parsedBody = insertProductCharacteristicSchema.parse({
        ...req.body,
        tenantId: user.tenantId
      });
      
      const characteristic = await storage.createProductCharacteristic(parsedBody);
      res.status(201).json(characteristic);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/products/:productId/characteristics", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const characteristics = await storage.getCharacteristicsByProduct(
        Number(req.params.productId), 
        user.tenantId
      );
      
      res.json(characteristics);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/product-characteristics", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const productId = req.query.productId ? Number(req.query.productId) : undefined;
      
      let characteristics;
      if (productId) {
        characteristics = await storage.getCharacteristicsByProduct(productId, user.tenantId);
      } else {
        // Return all characteristics (could be limited to a tenant)
        // Implementation depends on business requirements
        characteristics = [];
      }
      
      res.json(characteristics);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/product-characteristics/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const characteristic = await storage.updateProductCharacteristic(
        Number(req.params.id), 
        user.tenantId, 
        req.body
      );
      
      if (!characteristic) {
        return res.status(404).json({ message: "Characteristic not found" });
      }
      
      res.json(characteristic);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/product-characteristics/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const success = await storage.deleteProductCharacteristic(
        Number(req.params.id), 
        user.tenantId
      );
      
      if (!success) {
        return res.status(404).json({ message: "Characteristic not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Suppliers routes
  app.get("/api/suppliers", isAuthenticated, checkFeatureAccess("/api/suppliers*"), async (req, res, next) => {
    try {
      const user = req.user!;
      const suppliers = await storage.getSuppliersByTenant(user.tenantId);
      res.json(suppliers);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/suppliers", isAuthenticated, checkFeatureAccess("/api/suppliers*"), async (req, res, next) => {
    try {
      const user = req.user!;
      const parsedBody = insertSupplierSchema.parse({
        ...req.body,
        tenantId: user.tenantId
      });
      
      const supplier = await storage.createSupplier(parsedBody);
      res.status(201).json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/suppliers/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const supplier = await storage.getSupplier(Number(req.params.id), user.tenantId);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      res.json(supplier);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/suppliers/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const supplier = await storage.updateSupplier(
        Number(req.params.id), 
        user.tenantId, 
        req.body
      );
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      res.json(supplier);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/suppliers/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const success = await storage.deleteSupplier(Number(req.params.id), user.tenantId);
      
      if (!success) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Manufacturers routes
  app.get("/api/manufacturers", isAuthenticated, checkFeatureAccess("/api/manufacturers*"), async (req, res, next) => {
    try {
      const user = req.user!;
      const manufacturers = await storage.getManufacturersByTenant(user.tenantId);
      res.json(manufacturers);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/manufacturers", isAuthenticated, checkFeatureAccess("/api/manufacturers*"), async (req, res, next) => {
    try {
      const user = req.user!;
      const parsedBody = insertManufacturerSchema.parse({
        ...req.body,
        tenantId: user.tenantId
      });
      
      const manufacturer = await storage.createManufacturer(parsedBody);
      res.status(201).json(manufacturer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/manufacturers/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const manufacturer = await storage.getManufacturer(
        Number(req.params.id), 
        user.tenantId
      );
      
      if (!manufacturer) {
        return res.status(404).json({ message: "Manufacturer not found" });
      }
      
      res.json(manufacturer);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/manufacturers/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const manufacturer = await storage.updateManufacturer(
        Number(req.params.id), 
        user.tenantId, 
        req.body
      );
      
      if (!manufacturer) {
        return res.status(404).json({ message: "Manufacturer not found" });
      }
      
      res.json(manufacturer);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/manufacturers/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const success = await storage.deleteManufacturer(
        Number(req.params.id), 
        user.tenantId
      );
      
      if (!success) {
        return res.status(404).json({ message: "Manufacturer not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Clients routes
  app.get("/api/clients", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const clients = await storage.getClientsByTenant(user.tenantId);
      res.json(clients);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/clients", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const parsedBody = insertClientSchema.parse({
        ...req.body,
        tenantId: user.tenantId
      });
      
      const client = await storage.createClient(parsedBody);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/clients/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const client = await storage.getClient(Number(req.params.id), user.tenantId);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(client);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/clients/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const client = await storage.updateClient(
        Number(req.params.id), 
        user.tenantId, 
        req.body
      );
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(client);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/clients/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const success = await storage.deleteClient(Number(req.params.id), user.tenantId);
      
      if (!success) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Entry Certificate routes
  app.get("/api/entry-certificates", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      
      // Extract filter parameters
      const filters: Record<string, any> = {};
      const filterFields = [
        'productId', 'supplierId', 'manufacturerId', 
        'internalLot', 'referenceDocument', 'startDate', 'endDate'
      ];
      
      filterFields.forEach(field => {
        if (req.query[field]) {
          filters[field] = req.query[field];
        }
      });
      
      const certificates = await storage.getEntryCertificatesByTenant(user.tenantId, filters);
      
      // Enhance response with related data
      const enhancedCertificates = await Promise.all(certificates.map(async (cert) => {
        const [product, supplier, manufacturer, results] = await Promise.all([
          storage.getProduct(cert.productId, user.tenantId),
          storage.getSupplier(cert.supplierId, user.tenantId),
          storage.getManufacturer(cert.manufacturerId, user.tenantId),
          storage.getResultsByEntryCertificate(cert.id, user.tenantId)
        ]);
        
        return {
          ...cert,
          productName: product?.technicalName,
          supplierName: supplier?.name,
          manufacturerName: manufacturer?.name,
          results
        };
      }));
      
      res.json(enhancedCertificates);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/entry-certificates", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      
      // Parse and validate certificate data
      let certificateData = req.body.certificate;
      
      // Se temos uma URL de arquivo original, extrair e preservar o nome original do arquivo
      if (certificateData.originalFileUrl) {
        const originalUrlParts = certificateData.originalFileUrl.split('/');
        const filename = originalUrlParts[originalUrlParts.length - 1];
        
        // Tenta decodificar o nome do arquivo se ele estiver codificado na URL
        try {
          // Só tenta decodificar se o nome do arquivo parecer estar codificado
          if (filename.includes('%')) {
            certificateData.originalFileName = decodeURIComponent(filename);
          } else {
            certificateData.originalFileName = filename;
          }
        } catch (e) {
          // Em caso de erro na decodificação, usa o nome como está
          certificateData.originalFileName = filename;
        }
      }
      
      // Validar e processar os dados
      const validatedData = insertEntryCertificateSchema.parse({
        ...certificateData,
        tenantId: user.tenantId
      });
      
      // Create certificate
      const certificate = await storage.createEntryCertificate(validatedData);
      
      // Handle results if provided
      if (req.body.results && Array.isArray(req.body.results)) {
        const resultsPromises = req.body.results.map(result => {
          const resultData = insertEntryCertificateResultSchema.parse({
            ...result,
            entryCertificateId: certificate.id,
            tenantId: user.tenantId
          });
          
          return storage.createEntryCertificateResult(resultData);
        });
        
        await Promise.all(resultsPromises);
      }
      
      // Get the complete certificate with results
      const completeData = {
        ...certificate,
        results: await storage.getResultsByEntryCertificate(certificate.id, user.tenantId)
      };
      
      res.status(201).json(completeData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/entry-certificates/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const certificate = await storage.getEntryCertificate(
        Number(req.params.id), 
        user.tenantId
      );
      
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      // Get certificate results
      const results = await storage.getResultsByEntryCertificate(
        certificate.id, 
        user.tenantId
      );
      
      // Get related entities
      const [product, supplier, manufacturer] = await Promise.all([
        storage.getProduct(certificate.productId, user.tenantId),
        storage.getSupplier(certificate.supplierId, user.tenantId),
        storage.getManufacturer(certificate.manufacturerId, user.tenantId)
      ]);
      
      res.json({
        ...certificate,
        results,
        product,
        supplier,
        manufacturer
      });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/entry-certificates/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const certificateId = Number(req.params.id);
      
      // Obter o certificado atual
      const existingCertificate = await storage.getEntryCertificate(
        certificateId, 
        user.tenantId
      );
      
      if (!existingCertificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      // Preparar dados do certificado
      let certificateData = req.body.certificate || {};
      
      // Se estiver atualizando o arquivo original, extrair e preservar o nome do arquivo
      if (certificateData.originalFileUrl && 
          (!existingCertificate.originalFileUrl || 
           existingCertificate.originalFileUrl !== certificateData.originalFileUrl)) {
        const originalUrlParts = certificateData.originalFileUrl.split('/');
        const filename = originalUrlParts[originalUrlParts.length - 1];
        
        try {
          // Só tenta decodificar se o nome do arquivo parecer estar codificado
          if (filename.includes('%')) {
            certificateData.originalFileName = decodeURIComponent(filename);
          } else {
            certificateData.originalFileName = filename;
          }
        } catch (e) {
          // Em caso de erro na decodificação, usa o nome como está
          certificateData.originalFileName = filename;
        }
      }
      
      // Update certificate
      const certificate = await storage.updateEntryCertificate(
        certificateId, 
        user.tenantId, 
        certificateData
      );
      
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      // Handle results update if provided
      if (req.body.results && Array.isArray(req.body.results)) {
        // Delete existing results that are not in the new set
        const existingResults = await storage.getResultsByEntryCertificate(
          certificateId, 
          user.tenantId
        );
        
        const newResultIds = req.body.results
          .filter(r => r.id)
          .map(r => r.id);
        
        for (const result of existingResults) {
          if (!newResultIds.includes(result.id)) {
            await storage.deleteEntryCertificateResult(result.id, user.tenantId);
          }
        }
        
        // Update or create results
        for (const result of req.body.results) {
          if (result.id) {
            // Update existing result
            await storage.updateEntryCertificateResult(
              result.id, 
              user.tenantId, 
              {
                ...result,
                entryCertificateId: certificateId,
                tenantId: user.tenantId
              }
            );
          } else {
            // Create new result
            await storage.createEntryCertificateResult({
              ...result,
              entryCertificateId: certificateId,
              tenantId: user.tenantId
            });
          }
        }
      }
      
      // Get the complete updated certificate with results
      const updatedResults = await storage.getResultsByEntryCertificate(
        certificateId, 
        user.tenantId
      );
      
      res.json({
        ...certificate,
        results: updatedResults
      });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/entry-certificates/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const certificateId = Number(req.params.id);
      
      // Delete associated results first
      const results = await storage.getResultsByEntryCertificate(
        certificateId, 
        user.tenantId
      );
      
      for (const result of results) {
        await storage.deleteEntryCertificateResult(result.id, user.tenantId);
      }
      
      // Now delete the certificate
      const success = await storage.deleteEntryCertificate(certificateId, user.tenantId);
      
      if (!success) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Issued Certificate routes
  app.get("/api/issued-certificates", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      
      // Extract filter parameters
      const filters: Record<string, any> = {};
      const filterFields = [
        'clientId', 'entryCertificateId', 'invoiceNumber', 
        'customLot', 'startDate', 'endDate'
      ];
      
      filterFields.forEach(field => {
        if (req.query[field]) {
          filters[field] = req.query[field];
        }
      });
      
      const certificates = await storage.getIssuedCertificatesByTenant(user.tenantId, filters);
      
      // Enhance response with related data
      const enhancedCertificates = await Promise.all(certificates.map(async (cert) => {
        const [entryCertificate, client] = await Promise.all([
          storage.getEntryCertificate(cert.entryCertificateId, user.tenantId),
          storage.getClient(cert.clientId, user.tenantId)
        ]);
        
        let product;
        if (entryCertificate) {
          product = await storage.getProduct(entryCertificate.productId, user.tenantId);
        }
        
        return {
          ...cert,
          clientName: client?.name,
          productName: product?.technicalName,
          internalLot: entryCertificate?.internalLot
        };
      }));
      
      res.json(enhancedCertificates);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/issued-certificates", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      
      // Parse and validate certificate data
      const certificateData = insertIssuedCertificateSchema.parse({
        ...req.body,
        tenantId: user.tenantId
      });
      
      // Create issued certificate
      const certificate = await storage.createIssuedCertificate(certificateData);
      
      // Get related entities for complete response
      const [entryCertificate, client] = await Promise.all([
        storage.getEntryCertificate(certificate.entryCertificateId, user.tenantId),
        storage.getClient(certificate.clientId, user.tenantId)
      ]);
      
      let product;
      if (entryCertificate) {
        product = await storage.getProduct(entryCertificate.productId, user.tenantId);
      }
      
      res.status(201).json({
        ...certificate,
        entryCertificate,
        client,
        product
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/issued-certificates/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const certificate = await storage.getIssuedCertificate(
        Number(req.params.id), 
        user.tenantId
      );
      
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      // Get related entities
      const [entryCertificate, client] = await Promise.all([
        storage.getEntryCertificate(certificate.entryCertificateId, user.tenantId),
        storage.getClient(certificate.clientId, user.tenantId)
      ]);
      
      // Enhance response data
      let product = null;
      let supplier = null;
      let manufacturer = null;
      let results = [];
      
      if (entryCertificate) {
        // Get entry certificate results
        results = await storage.getResultsByEntryCertificate(entryCertificate.id, user.tenantId);
        
        // Get product, supplier and manufacturer info in parallel
        [product, supplier, manufacturer] = await Promise.all([
          storage.getProduct(entryCertificate.productId, user.tenantId),
          storage.getSupplier(entryCertificate.supplierId, user.tenantId),
          storage.getManufacturer(entryCertificate.manufacturerId, user.tenantId)
        ]);
      }
      
      // Prepare enhanced response
      res.json({
        ...certificate,
        clientName: client?.name,
        productName: product?.technicalName,
        entryCertificate: {
          ...entryCertificate,
          supplierName: supplier?.name,
          manufacturerName: manufacturer?.name,
          productName: product?.technicalName,
          results
        },
        client
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/issued-certificates/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const certificateId = Number(req.params.id);
      
      // Obter o certificado antes de excluí-lo para ajustar a rastreabilidade
      const certificate = await storage.getIssuedCertificate(certificateId, user.tenantId);
      
      if (!certificate) {
        return res.status(404).json({ message: "Certificado não encontrado" });
      }
      
      // Ajustar a rastreabilidade não é necessário explicitamente aqui, pois
      // quando calculamos a quantidade restante dinamicamente, ela já considera
      // apenas os certificados emitidos existentes no sistema.
      // Ao excluir o certificado, a próxima consulta já mostrará a quantidade atualizada.
      
      // Excluir o certificado
      const success = await storage.deleteIssuedCertificate(certificateId, user.tenantId);
      
      if (!success) {
        return res.status(500).json({ message: "Erro ao excluir certificado" });
      }
      
      // Retornar uma resposta 204 (No Content) para indicar o sucesso
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Traceability routes
  // Importante: a ordem das rotas é crítica - rotas mais específicas devem vir antes das mais genéricas
  
  // 1. Busca avançada com parâmetros de filtro
  app.get("/api/traceability/search", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const { 
        internalLot, supplierLot, productId, 
        supplierId, manufacturerId, startDate, endDate 
      } = req.query;
      
      console.log("Busca avançada com filtros:", { 
        internalLot, supplierLot, productId, 
        supplierId, manufacturerId, startDate, endDate 
      });
      
      // Obter todos os certificados do tenant
      const allCertificates = await storage.getEntryCertificatesByTenant(user.tenantId);
      
      // Aplicar filtros
      const filteredCertificates = allCertificates.filter(cert => {
        let matchesFilters = true;
        
        if (internalLot && typeof internalLot === 'string') {
          matchesFilters = matchesFilters && cert.internalLot.toLowerCase().includes(internalLot.toLowerCase());
        }
        
        if (supplierLot && typeof supplierLot === 'string') {
          matchesFilters = matchesFilters && cert.supplierLot.toLowerCase().includes(supplierLot.toLowerCase());
        }
        
        if (productId && typeof productId === 'string') {
          matchesFilters = matchesFilters && cert.productId === parseInt(productId, 10);
        }
        
        if (supplierId && typeof supplierId === 'string') {
          matchesFilters = matchesFilters && cert.supplierId === parseInt(supplierId, 10);
        }
        
        if (manufacturerId && typeof manufacturerId === 'string') {
          matchesFilters = matchesFilters && cert.manufacturerId === parseInt(manufacturerId, 10);
        }
        
        // Para datas, usamos o campo entryDate ao invés de createdAt
        if (startDate && typeof startDate === 'string') {
          const certDate = new Date(cert.entryDate);
          const filterDate = new Date(startDate);
          matchesFilters = matchesFilters && certDate >= filterDate;
        }
        
        if (endDate && typeof endDate === 'string') {
          const certDate = new Date(cert.entryDate);
          const filterDate = new Date(endDate);
          // Ajusta a data final para o fim do dia (23:59:59)
          filterDate.setHours(23, 59, 59, 999);
          matchesFilters = matchesFilters && certDate <= filterDate;
        }
        
        return matchesFilters;
      });
      
      console.log(`Certificados filtrados: ${filteredCertificates.length}`);
      
      // Se não encontrou nenhum certificado
      if (filteredCertificates.length === 0) {
        return res.status(200).json([]);
      }
      
      // Processar detalhes para cada certificado encontrado
      const detailedCertificates = await Promise.all(filteredCertificates.map(async (entryCertificate) => {
        // Get all issued certificates for this entry certificate
        const issuedCertificates = await storage.getIssuedCertificatesByEntryCertificate(
          entryCertificate.id,
          user.tenantId
        );
        
        // Get related entities
        const [product, supplier, manufacturer] = await Promise.all([
          storage.getProduct(entryCertificate.productId, user.tenantId),
          storage.getSupplier(entryCertificate.supplierId, user.tenantId),
          storage.getManufacturer(entryCertificate.manufacturerId, user.tenantId)
        ]);
        
        // Get client info for issued certificates
        const enhancedIssuedCertificates = await Promise.all(issuedCertificates.map(async cert => {
          const client = await storage.getClient(cert.clientId, user.tenantId);
          return {
            ...cert,
            clientName: client?.name
          };
        }));
        
        // Calculate remaining quantity
        const receivedQuantity = Number(entryCertificate.receivedQuantity);
        const soldQuantity = enhancedIssuedCertificates.reduce(
          (sum, cert) => sum + Number(cert.soldQuantity), 
          0
        );
        const remainingQuantity = receivedQuantity - soldQuantity;
        
        return {
          entryCertificate: {
            ...entryCertificate,
            productName: product?.technicalName,
            supplierName: supplier?.name,
            manufacturerName: manufacturer?.name
          },
          issuedCertificates: enhancedIssuedCertificates,
          summary: {
            receivedQuantity,
            soldQuantity,
            remainingQuantity,
            measureUnit: entryCertificate.measureUnit
          }
        };
      }));
      
      res.json(detailedCertificates);
    } catch (error) {
      next(error);
    }
  });
  
  // 2. Busca por lote do fornecedor
  app.get("/api/traceability/supplier/:supplierLot", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      // Decodificar o parâmetro da URL para tratar caracteres especiais como "/"
      let supplierLot = "";
      try {
        // Primeiro tentamos decodificar normalmente
        supplierLot = decodeURIComponent(req.params.supplierLot);
        // Caso ainda esteja com %2F no lugar de /
        if (supplierLot.includes('%2F')) {
          supplierLot = supplierLot.replace(/%2F/g, '/');
        }
        console.log("Lote de fornecedor decodificado para busca direta:", supplierLot);
      } catch (e) {
        supplierLot = req.params.supplierLot;
      }
      
      console.log(`Buscando por lote do fornecedor: ${supplierLot}`);
      
      // Find entry certificate by supplier lot
      const allCertificates = await storage.getEntryCertificatesByTenant(user.tenantId);
      console.log(`Certificados encontrados: ${allCertificates.length}`);
      
      // Log dos certificados para debug
      allCertificates.forEach(cert => {
        console.log(`Certificado ID: ${cert.id}, Lote Interno: ${cert.internalLot}, Lote Fornecedor: ${cert.supplierLot}`);
      });
      
      const entryCertificate = allCertificates.find(c => c.supplierLot === supplierLot);
      
      if (!entryCertificate) {
        console.log(`Lote do fornecedor não encontrado: ${supplierLot}`);
        return res.status(404).json({ message: "Supplier lot not found" });
      }
      
      // Get all issued certificates for this entry certificate
      const issuedCertificates = await storage.getIssuedCertificatesByEntryCertificate(
        entryCertificate.id,
        user.tenantId
      );
      
      // Get related entities
      const [product, supplier, manufacturer] = await Promise.all([
        storage.getProduct(entryCertificate.productId, user.tenantId),
        storage.getSupplier(entryCertificate.supplierId, user.tenantId),
        storage.getManufacturer(entryCertificate.manufacturerId, user.tenantId)
      ]);
      
      // Get client info for issued certificates
      const enhancedIssuedCertificates = await Promise.all(issuedCertificates.map(async cert => {
        const client = await storage.getClient(cert.clientId, user.tenantId);
        return {
          ...cert,
          clientName: client?.name
        };
      }));
      
      // Calculate remaining quantity
      const receivedQuantity = Number(entryCertificate.receivedQuantity);
      const soldQuantity = enhancedIssuedCertificates.reduce(
        (sum, cert) => sum + Number(cert.soldQuantity), 
        0
      );
      const remainingQuantity = receivedQuantity - soldQuantity;
      
      res.json({
        entryCertificate: {
          ...entryCertificate,
          productName: product?.technicalName,
          supplierName: supplier?.name,
          manufacturerName: manufacturer?.name
        },
        issuedCertificates: enhancedIssuedCertificates,
        summary: {
          receivedQuantity,
          soldQuantity,
          remainingQuantity,
          measureUnit: entryCertificate.measureUnit
        }
      });
    } catch (error) {
      next(error);
    }
  });
  
  // 3. Busca por lote interno (manter para compatibilidade)
  app.get("/api/traceability/:internalLot", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      // Decodificar o parâmetro da URL para tratar caracteres especiais como "/"
      let internalLot = "";
      try {
        // Primeiro tentamos decodificar normalmente
        internalLot = decodeURIComponent(req.params.internalLot);
        // Caso ainda esteja com %2F no lugar de /
        if (internalLot.includes('%2F')) {
          internalLot = internalLot.replace(/%2F/g, '/');
        }
        console.log("Lote interno decodificado para busca direta:", internalLot);
      } catch (e) {
        internalLot = req.params.internalLot;
      }
      
      console.log(`Buscando por lote interno: ${internalLot}`);
      
      // Find entry certificate by internal lot
      const allCertificates = await storage.getEntryCertificatesByTenant(user.tenantId);
      const entryCertificate = allCertificates.find(c => c.internalLot === internalLot);
      
      if (!entryCertificate) {
        console.log(`Lote interno não encontrado: ${internalLot}`);
        return res.status(404).json({ message: "Internal lot not found" });
      }
      
      // Get all issued certificates for this entry certificate
      const issuedCertificates = await storage.getIssuedCertificatesByEntryCertificate(
        entryCertificate.id,
        user.tenantId
      );
      
      // Get related entities
      const [product, supplier, manufacturer] = await Promise.all([
        storage.getProduct(entryCertificate.productId, user.tenantId),
        storage.getSupplier(entryCertificate.supplierId, user.tenantId),
        storage.getManufacturer(entryCertificate.manufacturerId, user.tenantId)
      ]);
      
      // Get client info for issued certificates
      const enhancedIssuedCertificates = await Promise.all(issuedCertificates.map(async cert => {
        const client = await storage.getClient(cert.clientId, user.tenantId);
        return {
          ...cert,
          clientName: client?.name
        };
      }));
      
      // Calculate remaining quantity
      const receivedQuantity = Number(entryCertificate.receivedQuantity);
      const soldQuantity = enhancedIssuedCertificates.reduce(
        (sum, cert) => sum + Number(cert.soldQuantity), 
        0
      );
      const remainingQuantity = receivedQuantity - soldQuantity;
      
      res.json({
        entryCertificate: {
          ...entryCertificate,
          productName: product?.technicalName,
          supplierName: supplier?.name,
          manufacturerName: manufacturer?.name
        },
        issuedCertificates: enhancedIssuedCertificates,
        summary: {
          receivedQuantity,
          soldQuantity,
          remainingQuantity,
          measureUnit: entryCertificate.measureUnit
        }
      });
    } catch (error) {
      next(error);
    }
  });
  
  // 4. Busca avançada com filtros
  app.get("/api/traceability/search", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      // Obter e decodificar parâmetros da busca
      const params = req.query;
      
      console.log("Busca avançada com filtros:", params);
      
      // Decodificar os parâmetros de texto que podem conter caracteres especiais
      // Certificar-se de decodificar corretamente, mesmo se já estiver parcialmente codificado
      let decodedInternalLot: string | undefined = undefined;
      if (params.internalLot && typeof params.internalLot === 'string') {
        try {
          decodedInternalLot = decodeURIComponent(params.internalLot);
          // Caso ainda esteja com %2F no lugar de /
          if (decodedInternalLot.includes('%2F')) {
            decodedInternalLot = decodedInternalLot.replace(/%2F/g, '/');
          }
          console.log("Lote interno decodificado:", decodedInternalLot);
        } catch (e) {
          decodedInternalLot = params.internalLot;
        }
      }
      
      let decodedSupplierLot: string | undefined = undefined;
      if (params.supplierLot && typeof params.supplierLot === 'string') {
        try {
          decodedSupplierLot = decodeURIComponent(params.supplierLot);
          // Caso ainda esteja com %2F no lugar de /
          if (decodedSupplierLot.includes('%2F')) {
            decodedSupplierLot = decodedSupplierLot.replace(/%2F/g, '/');
          }
          console.log("Lote do fornecedor decodificado:", decodedSupplierLot);
        } catch (e) {
          decodedSupplierLot = params.supplierLot;
        }
      }
      
      const productId = params.productId;
      const supplierId = params.supplierId;
      const manufacturerId = params.manufacturerId;
      const startDate = params.startDate;
      const endDate = params.endDate;
      
      // Obter todos os certificados do tenant
      const allCertificates = await storage.getEntryCertificatesByTenant(user.tenantId);
      
      // Aplicar filtros
      const filteredCertificates = allCertificates.filter(cert => {
        let matchesFilters = true;
        
        if (decodedInternalLot) {
          matchesFilters = matchesFilters && cert.internalLot.toLowerCase().includes(decodedInternalLot.toLowerCase());
        }
        
        if (decodedSupplierLot) {
          matchesFilters = matchesFilters && cert.supplierLot.toLowerCase().includes(decodedSupplierLot.toLowerCase());
        }
        
        if (productId && typeof productId === 'string') {
          matchesFilters = matchesFilters && cert.productId === parseInt(productId, 10);
        }
        
        if (supplierId && typeof supplierId === 'string') {
          matchesFilters = matchesFilters && cert.supplierId === parseInt(supplierId, 10);
        }
        
        if (manufacturerId && typeof manufacturerId === 'string') {
          matchesFilters = matchesFilters && cert.manufacturerId === parseInt(manufacturerId, 10);
        }
        
        if (startDate && typeof startDate === 'string') {
          const certDate = new Date(cert.createdAt);
          const filterDate = new Date(startDate);
          matchesFilters = matchesFilters && certDate >= filterDate;
        }
        
        if (endDate && typeof endDate === 'string') {
          const certDate = new Date(cert.createdAt);
          const filterDate = new Date(endDate);
          // Ajusta a data final para o fim do dia (23:59:59)
          filterDate.setHours(23, 59, 59, 999);
          matchesFilters = matchesFilters && certDate <= filterDate;
        }
        
        return matchesFilters;
      });
      
      // Se não encontrou nenhum certificado
      if (filteredCertificates.length === 0) {
        return res.status(200).json([]);
      }
      
      // Processar detalhes para cada certificado encontrado
      const detailedCertificates = await Promise.all(filteredCertificates.map(async (entryCertificate) => {
        // Get all issued certificates for this entry certificate
        const issuedCertificates = await storage.getIssuedCertificatesByEntryCertificate(
          entryCertificate.id,
          user.tenantId
        );
        
        // Get related entities
        const [product, supplier, manufacturer] = await Promise.all([
          storage.getProduct(entryCertificate.productId, user.tenantId),
          storage.getSupplier(entryCertificate.supplierId, user.tenantId),
          storage.getManufacturer(entryCertificate.manufacturerId, user.tenantId)
        ]);
        
        // Get client info for issued certificates
        const enhancedIssuedCertificates = await Promise.all(issuedCertificates.map(async cert => {
          const client = await storage.getClient(cert.clientId, user.tenantId);
          return {
            ...cert,
            clientName: client?.name
          };
        }));
        
        // Calculate remaining quantity
        const receivedQuantity = Number(entryCertificate.receivedQuantity);
        const soldQuantity = enhancedIssuedCertificates.reduce(
          (sum, cert) => sum + Number(cert.soldQuantity), 
          0
        );
        const remainingQuantity = receivedQuantity - soldQuantity;
        
        return {
          entryCertificate: {
            ...entryCertificate,
            productName: product?.technicalName,
            supplierName: supplier?.name,
            manufacturerName: manufacturer?.name
          },
          issuedCertificates: enhancedIssuedCertificates,
          summary: {
            receivedQuantity,
            soldQuantity,
            remainingQuantity,
            measureUnit: entryCertificate.measureUnit
          }
        };
      }));
      
      res.json(detailedCertificates);
    } catch (error) {
      next(error);
    }
  });

  // Package Types routes
  app.get("/api/package-types", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const packageTypes = await storage.getPackageTypesByTenant(user.tenantId);
      res.json(packageTypes);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/package-types", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const parsedBody = insertPackageTypeSchema.parse({
        ...req.body,
        tenantId: user.tenantId
      });
      
      const packageType = await storage.createPackageType(parsedBody);
      res.status(201).json(packageType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/package-types/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const packageType = await storage.getPackageType(Number(req.params.id), user.tenantId);
      
      if (!packageType) {
        return res.status(404).json({ message: "Package type not found" });
      }
      
      res.json(packageType);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/package-types/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const packageType = await storage.updatePackageType(
        Number(req.params.id), 
        user.tenantId, 
        req.body
      );
      
      if (!packageType) {
        return res.status(404).json({ message: "Package type not found" });
      }
      
      res.json(packageType);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/package-types/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const success = await storage.deletePackageType(Number(req.params.id), user.tenantId);
      
      if (!success) {
        return res.status(404).json({ message: "Package type not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  
  // Plans and Modules routes
  app.get("/api/plans", isAuthenticated, async (req, res) => {
    try {
      const plans = await storage.getAllPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ message: "Error fetching plans" });
    }
  });

  app.get("/api/plans/:id", isAuthenticated, async (req, res) => {
    try {
      const plan = await storage.getPlan(Number(req.params.id));
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Error fetching plan:", error);
      res.status(500).json({ message: "Error fetching plan" });
    }
  });

  app.get("/api/plans/code/:code", isAuthenticated, async (req, res) => {
    try {
      const plan = await storage.getPlanByCode(req.params.code);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Error fetching plan by code:", error);
      res.status(500).json({ message: "Error fetching plan by code" });
    }
  });

  app.get("/api/modules", isAuthenticated, async (req, res) => {
    try {
      const modules = await storage.getAllModules();
      res.json(modules);
    } catch (error) {
      console.error("Error fetching modules:", error);
      res.status(500).json({ message: "Error fetching modules" });
    }
  });

  app.get("/api/modules/:id", isAuthenticated, async (req, res) => {
    try {
      const module = await storage.getModule(Number(req.params.id));
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      res.json(module);
    } catch (error) {
      console.error("Error fetching module:", error);
      res.status(500).json({ message: "Error fetching module" });
    }
  });

  app.get("/api/plans/:id/modules", isAuthenticated, async (req, res) => {
    try {
      const modules = await storage.getModulesByPlan(Number(req.params.id));
      res.json(modules);
    } catch (error) {
      console.error("Error fetching modules by plan:", error);
      res.status(500).json({ message: "Error fetching modules by plan" });
    }
  });

  app.get("/api/plans/code/:code/modules", isAuthenticated, async (req, res) => {
    try {
      const modules = await storage.getModulesByPlanCode(req.params.code);
      res.json(modules);
    } catch (error) {
      console.error("Error fetching modules by plan code:", error);
      res.status(500).json({ message: "Error fetching modules by plan code" });
    }
  });

  app.get("/api/tenant/modules", isAuthenticated, async (req, res) => {
    const user = req.user!;
    try {
      const modules = await storage.getTenantEnabledModules(user.tenantId);
      res.json(modules);
    } catch (error) {
      console.error("Error fetching tenant modules:", error);
      res.status(500).json({ message: "Error fetching tenant modules" });
    }
  });
  
  // Endpoint para obter as funcionalidades disponíveis para o usuário
  app.get("/api/user/features", isAuthenticated, async (req, res) => {
    const user = req.user!;
    try {
      console.log(`[/api/user/features] Obtendo funcionalidades para usuário ${user.username} (ID: ${user.id}, Tenant: ${user.tenantId}, Role: ${user.role})`);
      
      // Para administradores do sistema, retorna todas as funcionalidades
      if (user.role === "admin" || user.role === "system_admin") {
        console.log(`[/api/user/features] Usuário é administrador do sistema, retornando todas as funcionalidades`);
        const allFeatures = await storage.getModuleFeatures();
        return res.json(allFeatures);
      }
      
      // Para outros usuários, retorna apenas as funcionalidades dos módulos do plano da tenant
      // 1. Encontrar o tenant
      const tenant = await storage.getTenant(user.tenantId);
      if (!tenant) {
        console.log(`[/api/user/features] Tenant não encontrado (ID: ${user.tenantId})`);
        return res.status(404).json({ message: "Tenant não encontrado" });
      }
      console.log(`[/api/user/features] Tenant encontrado: ${tenant.name} (ID: ${tenant.id}, Plano: ${tenant.planId})`);
      
      // 2. Obter os módulos do plano do tenant
      const planModules = await storage.getModulesByPlan(tenant.planId);
      if (!planModules || planModules.length === 0) {
        console.log(`[/api/user/features] Nenhum módulo encontrado para o plano ${tenant.planId}`);
        return res.json([]);
      }
      console.log(`[/api/user/features] Módulos do plano ${tenant.planId}:`, planModules.map(m => `${m.id} (${m.name})`));
      
      // 3. Obter as funcionalidades associadas a esses módulos
      const moduleIds = planModules.map(module => module.id);
      console.log(`[/api/user/features] IDs dos módulos habilitados: ${moduleIds.join(', ')}`);
      
      // 4. Buscar todas as features associadas aos módulos do plano da tenant
      const features = [];
      for (const moduleId of moduleIds) {
        const moduleFeatures = await storage.getModuleFeaturesByModule(moduleId);
        console.log(`[/api/user/features] Módulo ${moduleId} tem ${moduleFeatures.length} funcionalidades`);
        features.push(...moduleFeatures);
      }
      
      console.log(`[/api/user/features] Total de funcionalidades disponíveis: ${features.length}`);
      res.json(features);
    } catch (error) {
      console.error("[/api/user/features] Erro ao obter funcionalidades:", error);
      res.status(500).json({ message: "Erro ao obter funcionalidades do usuário" });
    }
  });
  
  // Rotas para gerenciamento de arquivos gerais (nova tabela 'files')
  
  // Listar arquivos do tenant (com filtro opcional por categoria)
  app.get("/api/files", isAuthenticated, async (req, res) => {
    try {
      const { tenantId } = req.user!;
      const fileCategory = req.query.category as string | undefined;
      
      const files = await storage.getFilesByTenant(tenantId, fileCategory);
      res.json(files);
    } catch (error) {
      console.error('Erro ao listar arquivos:', error);
      res.status(500).json({ message: 'Erro ao listar arquivos' });
    }
  });
  
  // Listar arquivos por entidade (tipo e ID)
  app.get("/api/files/entity/:type/:id", isAuthenticated, async (req, res) => {
    try {
      const { tenantId } = req.user!;
      const entityType = req.params.type;
      const entityId = Number(req.params.id);
      
      const files = await storage.getFilesByEntity(entityType, entityId, tenantId);
      res.json(files);
    } catch (error) {
      console.error('Erro ao listar arquivos da entidade:', error);
      res.status(500).json({ message: 'Erro ao listar arquivos da entidade' });
    }
  });
  
  // Obter detalhes de um arquivo específico por ID
  app.get("/api/files/:id", isAuthenticated, async (req, res) => {
    try {
      const { tenantId } = req.user!;
      const fileId = Number(req.params.id);
      
      const file = await storage.getFile(fileId, tenantId);
      if (!file) {
        return res.status(404).json({ message: 'Arquivo não encontrado' });
      }
      
      res.json(file);
    } catch (error) {
      console.error('Erro ao obter detalhes do arquivo:', error);
      res.status(500).json({ message: 'Erro ao obter detalhes do arquivo' });
    }
  });
  
  // Upload de arquivo com verificação de limites
  app.post("/api/files/upload", 
    isAuthenticated, 
    (req, res, next) => checkStorageLimits(req, res, next),
    updateStorageUsed,
    tempUpload.single('file'), 
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: 'Nenhum arquivo enviado' });
        }
        
        const { tenantId } = req.user!;
        const {
          fileCategory = 'document',
          description = null,
          entityType = null,
          entityId = null
        } = req.body;
        
        // Obter informações do arquivo
        const tempPath = req.file.path;
        const originalFileName = req.file.originalname;
        const fileSize = req.file.size;
        const fileType = req.file.mimetype;
        const fileSizeMB = getFileSizeInMB(tempPath);
        
        // Gerar nome para armazenamento
        const storedFileName = req.file.filename;
        
        // Mover arquivo para armazenamento permanente
        const finalPath = await moveFileToFinalStorage(
          tempPath, 
          tenantId, 
          fileCategory, 
          storedFileName
        );
        
        // Gerar URL pública
        const publicUrl = getFileUrl(finalPath);
        
        // Salvar metadados no banco
        const newFile = await storage.createFile({
          tenantId,
          fileName: originalFileName,
          fileSize,
          fileType,
          fileCategory,
          description,
          entityType,
          entityId: entityId ? Number(entityId) : null,
          storedFileName,
          filePath: finalPath,
          fileSizeMB: fileSizeMB.toString(),
          publicUrl
        });
        
        res.status(201).json(newFile);
      } catch (error) {
        console.error('Erro ao fazer upload de arquivo:', error);
        // Se houve erro, tentar limpar arquivo temporário
        if (req.file && req.file.path) {
          try {
            removeFile(req.file.path);
          } catch (e) {
            console.error('Erro ao remover arquivo temporário:', e);
          }
        }
        res.status(500).json({ message: 'Erro ao processar upload de arquivo' });
      }
    }
  );
  
  // Remover arquivo
  app.delete("/api/files/:id", isAuthenticated, async (req, res) => {
    try {
      const { tenantId } = req.user!;
      const fileId = Number(req.params.id);
      
      // Obter detalhes do arquivo primeiro
      const file = await storage.getFile(fileId, tenantId);
      if (!file) {
        return res.status(404).json({ message: 'Arquivo não encontrado' });
      }
      
      // Remover o arquivo físico
      if (file.filePath) {
        removeFile(file.filePath);
      }
      
      // Remover do banco de dados
      const result = await storage.deleteFile(fileId, tenantId);
      if (!result) {
        return res.status(500).json({ message: 'Erro ao remover arquivo do banco de dados' });
      }
      
      res.status(200).json({ message: 'Arquivo removido com sucesso' });
    } catch (error) {
      console.error('Erro ao remover arquivo:', error);
      res.status(500).json({ message: 'Erro ao remover arquivo' });
    }
  });

  // Rotas administrativas
  // Dashboard administrativo
  app.get("/api/admin/dashboard", isAdmin, async (req, res, next) => {
    try {
      // Obter contagem de tenants
      const tenants = await storage.getAllTenants();
      const activeTenantCount = tenants.filter(t => t.active).length;
      
      // Obter contagem de usuários
      let userCount = 0;
      for (const tenant of tenants) {
        const tenantUsers = await storage.getUsersByTenant(tenant.id);
        userCount += tenantUsers.length;
      }
      
      // Obter contagem de arquivos e tamanho de armazenamento
      const files = await storage.getAllFiles();
      const totalStorage = files.reduce((acc, file) => acc + (parseFloat(file.fileSizeMB) || 0), 0);
      
      // Obter contagem de certificados nos últimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      let certificateCount = 0;
      for (const tenant of tenants) {
        const issuedCertificates = await storage.getIssuedCertificatesByTenant(
          tenant.id, 
          { startDate: thirtyDaysAgo.toISOString() }
        );
        certificateCount += issuedCertificates.length;
      }
      
      // Tenants recentes (5 mais recentes)
      const recentTenants = tenants
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      
      // Usuários recentes (5 mais recentes)
      let allUsers: any[] = [];
      for (const tenant of tenants) {
        const tenantUsers = await storage.getUsersByTenant(tenant.id);
        allUsers.push(...tenantUsers.map(user => ({
          ...user,
          tenantName: tenant.name
        })));
      }
      
      const recentUsers = allUsers
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 5)
        .map(({ password, ...rest }) => rest); // Remove passwords
      
      // Verificar se há tenants com armazenamento acima do limite
      const alerts = [];
      const storageData = [];
      
      for (const tenant of tenants) {
        const plan = await storage.getPlan(tenant.planId);
        const tenantFiles = files.filter(f => f.tenantId === tenant.id);
        const storageUsed = tenantFiles.reduce((acc, file) => acc + (parseFloat(file.fileSizeMB) || 0), 0);
        
        storageData.push({
          id: tenant.id,
          name: tenant.name,
          storageUsed,
          fileCount: tenantFiles.length,
          maxStorage: plan?.maxStorage || 0,
          planName: plan?.name || 'Desconhecido'
        });
      }
      
      const tenantsOverLimit = storageData.filter(
        t => t.storageUsed > t.maxStorage && t.maxStorage > 0
      );
      
      if (tenantsOverLimit.length > 0) {
        alerts.push({
          level: 'error',
          title: 'Tenants Acima do Limite de Armazenamento',
          message: `${tenantsOverLimit.length} tenant(s) excederam o limite de armazenamento. Verifique a página de Armazenamento.`
        });
      }
      
      res.json({
        tenantCount: tenants.length,
        activeTenantCount,
        userCount,
        fileCount: files.length,
        totalStorage,
        certificateCount,
        recentTenants,
        recentUsers,
        alerts
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Listar todos os tenants para o admin
  app.get("/api/admin/tenants", isAdmin, async (req, res, next) => {
    try {
      let tenants = await storage.getAllTenants();
      const files = await storage.getAllFiles();
      
      // Adicionar informações de uso de armazenamento
      const enhancedTenants = [];
      
      for (const tenant of tenants) {
        const plan = await storage.getPlan(tenant.planId);
        const tenantFiles = files.filter(f => f.tenantId === tenant.id);
        const storageUsed = tenantFiles.reduce((acc, file) => acc + (parseFloat(file.fileSizeMB) || 0), 0);
        
        enhancedTenants.push({
          ...tenant,
          storageUsed,
          fileCount: tenantFiles.length,
          maxStorage: plan?.maxStorage || 0,
          planName: plan?.name || 'Desconhecido'
        });
      }
      
      res.json(enhancedTenants);
    } catch (error) {
      next(error);
    }
  });
  
  // Criar tenant (admin)
  app.post("/api/admin/tenants", isAdmin, async (req, res, next) => {
    try {
      const parsedBody = insertTenantSchema.parse(req.body);
      const tenant = await storage.createTenant(parsedBody);
      res.status(201).json(tenant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });
  
  // Atualizar tenant (admin)
  app.patch("/api/admin/tenants/:id", isAdmin, async (req, res, next) => {
    try {
      const tenant = await storage.updateTenant(Number(req.params.id), req.body);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      res.json(tenant);
    } catch (error) {
      next(error);
    }
  });
  
  // Excluir tenant (admin)
  app.delete("/api/admin/tenants/:id", isAdmin, async (req, res, next) => {
    try {
      const success = await storage.deleteTenant(Number(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  
  // Gerenciamento de planos
  app.get("/api/admin/plans", isAdmin, async (req, res, next) => {
    try {
      const plans = await storage.getPlans();
      res.json(plans);
    } catch (error) {
      next(error);
    }
  });
  
  // Criar plano
  app.post("/api/admin/plans", isAdmin, async (req, res, next) => {
    try {
      // Validar que todos os campos obrigatórios estão presentes
      const { name, code, description, maxStorage, maxFileSize, price } = req.body;
      
      if (!name || !code || !description) {
        return res.status(400).json({ 
          message: "Campos obrigatórios faltando", 
          details: "Nome, código e descrição são obrigatórios" 
        });
      }
      
      // Preparar os dados para criar o plano
      const planData = {
        name,
        code,
        description,
        maxStorage: maxStorage || 1,
        maxFileSize: maxFileSize || 1,
        price: price || 0,
        maxUsers: req.body.maxUsers || 1
      };
      
      const plan = await storage.createPlan(planData);
      res.status(201).json(plan);
    } catch (error) {
      console.error('Erro ao criar plano:', error);
      
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      
      next(error);
    }
  });
  
  // Atualizar plano (PATCH - parcial)
  app.patch("/api/admin/plans/:id", isAdmin, async (req, res, next) => {
    try {
      const plan = await storage.updatePlan(Number(req.params.id), req.body);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
      res.json(plan);
    } catch (error) {
      next(error);
    }
  });
  
  // Atualizar plano (PUT - completo)
  app.put("/api/admin/plans/:id", isAdmin, async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      
      // Verificar se o plano existe
      const existingPlan = await storage.getPlan(id);
      if (!existingPlan) {
        return res.status(404).json({ message: "Plano não encontrado" });
      }
      
      // Extrair dados do corpo da requisição
      const { price, maxStorage, maxFileSize, description } = req.body;
      
      // Atualizar o plano
      const updatedPlan = await storage.updatePlan(id, {
        price: price !== undefined ? price : existingPlan.price,
        storageLimit: maxStorage !== undefined ? maxStorage : existingPlan.storageLimit,
        maxFileSize: maxFileSize !== undefined ? maxFileSize : existingPlan.maxFileSize,
        description: description !== undefined ? description : existingPlan.description
      });
      
      res.json(updatedPlan);
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
      next(error);
    }
  });
  
  // Excluir plano
  app.delete("/api/admin/plans/:id", isAdmin, async (req, res, next) => {
    try {
      const success = await storage.deletePlan(Number(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Plan not found" });
      }
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  
  // Módulos disponíveis
  app.get("/api/admin/modules", isAdmin, async (req, res, next) => {
    try {
      const modules = await storage.getModules();
      res.json(modules);
    } catch (error) {
      next(error);
    }
  });
  
  // Criar novo módulo
  app.post("/api/admin/modules", isAdmin, async (req, res, next) => {
    try {
      const newModule = await storage.createModule(req.body);
      res.status(201).json(newModule);
    } catch (error) {
      console.error('Erro ao criar módulo:', error);
      next(error);
    }
  });
  
  // Atualizar módulo
  app.put("/api/admin/modules/:id", isAdmin, async (req, res, next) => {
    try {
      const updatedModule = await storage.updateModule(Number(req.params.id), req.body);
      if (!updatedModule) {
        return res.status(404).json({ message: "Module not found" });
      }
      res.json(updatedModule);
    } catch (error) {
      console.error('Erro ao atualizar módulo:', error);
      next(error);
    }
  });
  
  // Excluir módulo
  app.delete("/api/admin/modules/:id", isAdmin, async (req, res, next) => {
    try {
      const success = await storage.deleteModule(Number(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Module not found" });
      }
      res.status(204).end();
    } catch (error) {
      console.error('Erro ao excluir módulo:', error);
      next(error);
    }
  });
  
  // Rotas para gerenciamento de funcionalidades de módulos
  
  // Obter todas as funcionalidades
  app.get("/api/admin/module-features", isAdmin, async (req, res, next) => {
    try {
      const features = await storage.getModuleFeatures();
      res.json(features);
    } catch (error) {
      console.error('Erro ao buscar funcionalidades:', error);
      next(error);
    }
  });
  
  // Obter funcionalidades por módulo
  app.get("/api/admin/modules/:id/features", isAdmin, async (req, res, next) => {
    try {
      const moduleId = Number(req.params.id);
      const features = await storage.getModuleFeaturesByModule(moduleId);
      res.json(features);
    } catch (error) {
      console.error('Erro ao buscar funcionalidades do módulo:', error);
      next(error);
    }
  });
  
  // Obter uma funcionalidade específica
  app.get("/api/admin/module-features/:id", isAdmin, async (req, res, next) => {
    try {
      const featureId = Number(req.params.id);
      const feature = await storage.getModuleFeature(featureId);
      
      if (!feature) {
        return res.status(404).json({ message: "Feature not found" });
      }
      
      res.json(feature);
    } catch (error) {
      console.error('Erro ao buscar funcionalidade:', error);
      next(error);
    }
  });
  
  // Criar uma nova funcionalidade
  app.post("/api/admin/module-features", isAdmin, async (req, res, next) => {
    try {
      const newFeature = await storage.createModuleFeature(req.body);
      res.status(201).json(newFeature);
    } catch (error) {
      console.error('Erro ao criar funcionalidade:', error);
      next(error);
    }
  });
  
  // Atualizar uma funcionalidade
  app.put("/api/admin/module-features/:id", isAdmin, async (req, res, next) => {
    try {
      const featureId = Number(req.params.id);
      const updatedFeature = await storage.updateModuleFeature(featureId, req.body);
      
      if (!updatedFeature) {
        return res.status(404).json({ message: "Feature not found" });
      }
      
      res.json(updatedFeature);
    } catch (error) {
      console.error('Erro ao atualizar funcionalidade:', error);
      next(error);
    }
  });
  
  // Excluir uma funcionalidade
  app.delete("/api/admin/module-features/:id", isAdmin, async (req, res, next) => {
    try {
      const featureId = Number(req.params.id);
      const success = await storage.deleteModuleFeature(featureId);
      
      if (!success) {
        return res.status(404).json({ message: "Feature not found or cannot be deleted" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('Erro ao excluir funcionalidade:', error);
      next(error);
    }
  });
  
  // Verificar se uma funcionalidade está acessível para um tenant
  app.get("/api/features/check-access", isAuthenticated, async (req, res, next) => {
    try {
      const { featurePath } = req.query;
      const tenantId = req.user!.tenantId;
      
      if (!featurePath || typeof featurePath !== 'string') {
        return res.status(400).json({ message: "Feature path is required" });
      }
      
      const isAccessible = await storage.isFeatureAccessible(featurePath, tenantId);
      res.json({ isAccessible });
    } catch (error) {
      console.error('Erro ao verificar acesso à funcionalidade:', error);
      next(error);
    }
  });
  
  // Obter módulos de um plano
  app.get("/api/admin/plans/:id/modules", isAdmin, async (req, res, next) => {
    try {
      const planId = Number(req.params.id);
      
      // Verificar se o plano existe
      const plan = await storage.getPlan(planId);
      if (!plan) {
        return res.status(404).json({ message: "Plano não encontrado" });
      }
      
      // Obter módulos do plano
      const modules = await storage.getModulesByPlan(planId);
      
      // Processar os dados para retornar na estrutura correta para o frontend
      // Vamos retornar o formato { planId, moduleId } que o frontend espera
      const planModuleData = modules.map(module => ({
        planId: planId,
        moduleId: module.id
      }));
      
      // Retornar como JSON em vez de HTML
      res.setHeader('Content-Type', 'application/json');
      res.json(planModuleData);
    } catch (error) {
      console.error('Erro ao obter módulos do plano:', error);
      next(error);
    }
  });

  // Atualizar módulos de um plano
  app.put("/api/admin/plans/:id/modules", isAdmin, async (req, res, next) => {
    try {
      const planId = Number(req.params.id);
      const { moduleIds } = req.body;
      
      if (!Array.isArray(moduleIds)) {
        return res.status(400).json({ message: "moduleIds must be an array" });
      }
      
      const success = await storage.updatePlanModules(planId, moduleIds);
      if (!success) {
        return res.status(404).json({ message: "Failed to update plan modules" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('Erro ao atualizar módulos do plano:', error);
      next(error);
    }
  });
  
  // Gerenciamento de armazenamento
  app.get("/api/admin/storage", isAdmin, async (req, res, next) => {
    try {
      const tenants = await storage.getAllTenants();
      const files = await storage.getAllFiles();
      
      const storageData = [];
      
      for (const tenant of tenants) {
        const plan = await storage.getPlan(tenant.planId);
        const tenantFiles = files.filter(f => f.tenantId === tenant.id);
        const storageUsed = tenantFiles.reduce((acc, file) => acc + (parseFloat(file.fileSizeMB) || 0), 0);
        
        storageData.push({
          id: tenant.id,
          name: tenant.name,
          storageUsed,
          fileCount: tenantFiles.length,
          maxStorage: plan?.maxStorage || 0,
          planName: plan?.name || 'Desconhecido'
        });
      }
      
      res.json(storageData);
    } catch (error) {
      next(error);
    }
  });
  
  // Limpar arquivos não utilizados de um tenant
  app.post("/api/admin/storage/:tenantId/cleanup", isAdmin, async (req, res, next) => {
    try {
      const tenantId = Number(req.params.tenantId);
      
      // Implementação básica - remover arquivos que não estão vinculados a nenhuma entidade
      const files = await storage.getFilesByTenant(tenantId);
      const unusedFiles = files.filter(f => !f.entityId);
      
      let filesRemoved = 0;
      let spaceSaved = 0;
      
      for (const file of unusedFiles) {
        // Remover arquivo físico
        if (file.filePath) {
          await removeFile(file.filePath);
        }
        
        // Remover do banco de dados
        const success = await storage.deleteFile(file.id, tenantId);
        if (success) {
          filesRemoved++;
          spaceSaved += parseFloat(file.fileSizeMB) || 0;
        }
      }
      
      res.json({
        success: true,
        filesRemoved,
        spaceSaved
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Usuários administrativos
  app.get("/api/admin/users", isAdmin, async (req, res, next) => {
    try {
      const tenants = await storage.getAllTenants();
      let allUsers = [];
      
      for (const tenant of tenants) {
        const users = await storage.getUsersByTenant(tenant.id);
        allUsers.push(...users.map(user => ({
          ...user,
          password: undefined, // Remover senha
          tenantName: tenant.name
        })));
      }
      
      res.json(allUsers);
    } catch (error) {
      next(error);
    }
  });
  
  // Atualizar usuário administrativo
  app.put("/api/admin/users/:id", isAdmin, async (req, res, next) => {
    try {
      const userId = Number(req.params.id);
      const { username, name, email, password, role, active } = req.body;
      
      // Verificar se o usuário existe
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Preparar dados para atualização
      const updateData: any = {};
      
      if (username !== undefined) updateData.username = username;
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (role !== undefined) updateData.role = role;
      if (active !== undefined) updateData.active = active;
      
      // Se a senha foi fornecida, hash ela
      if (password) {
        const { hashPassword } = await import('./auth');
        updateData.password = await hashPassword(password);
      }
      
      // Atualizar o usuário
      const updatedUser = await storage.updateUser(userId, updateData);
      
      // Remover senha da resposta
      if (updatedUser) {
        const { password, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
      } else {
        res.status(404).json({ message: "Erro ao atualizar usuário" });
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      next(error);
    }
  });
  
  // Criar novo usuário (admin)
  app.post("/api/admin/users", isAdmin, async (req, res, next) => {
    try {
      const { username, name, password, role, tenantId, active } = req.body;
      
      // Verificar se o tenant existe
      const tenant = await storage.getTenant(Number(tenantId));
      if (!tenant) {
        return res.status(404).json({ message: "Tenant não encontrado" });
      }
      
      // Verificar se o nome de usuário já existe
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Nome de usuário já existe" });
      }
      
      // Hash da senha antes de criar o usuário
      const { hashPassword } = await import('./auth');
      const hashedPassword = await hashPassword(password);
      
      // Criar o usuário
      const newUser = await storage.createUser({
        username,
        name,
        password: hashedPassword,
        role: role || 'user',
        tenantId: Number(tenantId),
        active: active !== undefined ? active : true
      });
      
      // Remover senha da resposta
      const { password: pwd, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
