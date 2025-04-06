import PDFDocument from 'pdfkit';
import blobStream from 'blob-stream';

// Interface para os dados da empresa que serão usados no certificado
interface TenantData {
  name: string;
  cnpj: string;
  address: string;
  logoUrl: string | null;
}

// Interface para os dados do produto
interface ProductData {
  technicalName: string;
  commercialName: string | null;
  internalCode: string | null;
}

// Interface para os dados do cliente
interface ClientData {
  name: string;
  cnpj: string;
}

// Interface para os dados do certificado emitido
interface CertificateData {
  invoiceNumber: string;
  issueDate: string;
  soldQuantity: string;
  customLot: string;
  measureUnit: string;
}

// Interface para os dados do certificado de entrada
interface EntryCertificateData {
  referenceDocument: string;
  entryDate: string;
  manufacturingDate: string | null;
  expirationDate: string | null;
}

// Interface para os resultados das análises
interface TestResult {
  characteristicName: string;
  unit: string;
  minValue: string | null;
  maxValue: string | null;
  obtainedValue: string;
  analysisMethod: string | null;
}

// Interface para os dados necessários para gerar o certificado completo
export interface CertificateGenerationData {
  tenant: TenantData;
  product: ProductData;
  client: ClientData;
  certificate: CertificateData;
  entryCertificate: EntryCertificateData;
  results: TestResult[];
}

/**
 * Gera um PDF do certificado de qualidade
 * @param data Dados para geração do certificado
 * @returns Promise com URL do arquivo PDF gerado
 */
export async function generateCertificatePdf(data: CertificateGenerationData): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Cria um novo documento PDF
      const doc = new PDFDocument({
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        },
        size: 'A4',
        info: {
          Title: `Certificado de Qualidade - ${data.product.technicalName}`,
          Author: data.tenant.name,
          Subject: 'Certificado de Qualidade',
          Keywords: 'certificado, qualidade, análise'
        }
      });

      // Cria um stream para o documento
      const stream = doc.pipe(blobStream());

      // Define fonte e tamanho padrão
      doc.font('Helvetica');
      
      // ----- Cabeçalho com Logo e Dados da Empresa -----
      doc.fontSize(16).font('Helvetica-Bold').text('CERTIFICADO DE QUALIDADE', { align: 'center' });
      doc.moveDown(0.5);

      // Logo da empresa (se existir)
      if (data.tenant.logoUrl) {
        try {
          doc.image(data.tenant.logoUrl, 50, 50, { width: 120 });
          doc.moveDown(3); // Espaço extra após a logo
        } catch (error) {
          console.error('Erro ao carregar logo:', error);
          doc.moveDown(0.5);
        }
      }

      // Dados da empresa
      doc.fontSize(10).font('Helvetica-Bold').text('Empresa:');
      doc.font('Helvetica').text(`${data.tenant.name} ${data.tenant.cnpj ? '- ' + data.tenant.cnpj : ''}`);
      if (data.tenant.address) {
        doc.text(data.tenant.address);
      }
      doc.moveDown(1);

      // ----- Dados do Produto e Certificado -----
      doc.fontSize(10).font('Helvetica-Bold').text('Produto:');
      doc.font('Helvetica').text(data.product.technicalName);
      if (data.product.commercialName) {
        doc.text(`Nome Comercial: ${data.product.commercialName}`);
      }
      doc.moveDown(0.5);

      // Tabela de informações gerais
      const generalInfoY = doc.y;
      
      // Coluna 1
      doc.font('Helvetica-Bold').text('Data de Emissão:', 50, generalInfoY);
      doc.font('Helvetica').text(formatDate(data.certificate.issueDate), 150, generalInfoY);
      
      doc.font('Helvetica-Bold').text('Quantidade:', 50, generalInfoY + 20);
      doc.font('Helvetica').text(`${data.certificate.soldQuantity} ${data.certificate.measureUnit}`, 150, generalInfoY + 20);
      
      doc.font('Helvetica-Bold').text('Nota Fiscal:', 50, generalInfoY + 40);
      doc.font('Helvetica').text(data.certificate.invoiceNumber, 150, generalInfoY + 40);
      
      // Coluna 2
      doc.font('Helvetica-Bold').text('Lote do Produto:', 280, generalInfoY);
      doc.font('Helvetica').text(data.certificate.customLot, 380, generalInfoY);
      
      doc.font('Helvetica-Bold').text('Data de Fabricação:', 280, generalInfoY + 20);
      doc.font('Helvetica').text(data.entryCertificate.manufacturingDate ? 
        formatDate(data.entryCertificate.manufacturingDate) : 'N/A', 380, generalInfoY + 20);
      
      doc.font('Helvetica-Bold').text('Validade:', 280, generalInfoY + 40);
      doc.font('Helvetica').text(data.entryCertificate.expirationDate ? 
        formatDate(data.entryCertificate.expirationDate) : 'N/A', 380, generalInfoY + 40);
      
      doc.moveDown(3);

      // ----- Cliente -----
      doc.fontSize(10).font('Helvetica-Bold').text('Cliente:');
      doc.font('Helvetica').text(`${data.client.name} ${data.client.cnpj ? '- ' + data.client.cnpj : ''}`);
      doc.moveDown(1.5);

      // ----- Título da Seção de Análises -----
      doc.fontSize(12).font('Helvetica-Bold').text('BOLETIM DE ANÁLISES', { align: 'center' });
      doc.fontSize(10).text(`PRODUTO/PRODUCT: ${data.product.technicalName}`, { align: 'center' });
      doc.moveDown(1);

      // ----- Tabela de Resultados -----
      // Define posições e tamanhos de coluna
      const tableTop = doc.y;
      const colWidths = [180, 70, 110, 70, 110];  // Larguras de cada coluna
      const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);
      const startX = (doc.page.width - tableWidth) / 2;
      const rowHeight = 25;

      // Funções auxiliares para desenhar a tabela
      const drawTableRow = (y: number, cells: string[], isHeader = false) => {
        let xOffset = startX;
        
        // Desenha o retângulo de fundo e borda para toda a linha
        doc.rect(startX, y, tableWidth, rowHeight).stroke();
        
        cells.forEach((cell, i) => {
          // Texto centralizado verticalmente
          const textOptions = { 
            width: colWidths[i], 
            align: 'center' as 'center'
          };
          
          // Define a fonte baseado se é cabeçalho ou não
          doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica');
          
          // Calcula altura do texto para centralização vertical
          const textHeight = doc.heightOfString(cell, textOptions);
          const textY = y + (rowHeight - textHeight) / 2;
          
          // Adiciona o texto
          doc.text(cell, xOffset, textY, textOptions);
          
          // Desenha linhas verticais (exceto para última coluna)
          if (i < cells.length - 1) {
            doc.moveTo(xOffset + colWidths[i], y)
               .lineTo(xOffset + colWidths[i], y + rowHeight)
               .stroke();
          }
          
          xOffset += colWidths[i];
        });
      };

      // Cabeçalho da tabela
      const headers = [
        'CARACTERÍSTICAS\nCHARACTERISTICS', 
        'UNIDADES\nUNITS', 
        'ESPECIFICAÇÃO\nSPECIFICATION', 
        'VALOR\nVALUE', 
        'MÉTODO\nTEST METHOD'
      ];
      drawTableRow(tableTop, headers, true);

      // Dados da tabela
      let currentY = tableTop + rowHeight;
      data.results.forEach(result => {
        const specificationValue = result.minValue && result.maxValue 
          ? `${result.minValue} - ${result.maxValue}`
          : result.minValue || result.maxValue || 'N/A';

        const cells = [
          result.characteristicName,
          result.unit || '',
          specificationValue,
          result.obtainedValue,
          result.analysisMethod || ''
        ];
        
        drawTableRow(currentY, cells);
        currentY += rowHeight;
      });

      doc.moveDown(2);

      // ----- Rodapé com aprovação e validade -----
      doc.fontSize(10).font('Helvetica-Bold')
        .text('Controle de Qualidade', { continued: true })
        .font('Helvetica-Bold').fillColor('green').text(' APROVADO', { continued: true })
        .fillColor('black').text(' | ', { continued: true })
        .font('Helvetica-Bold').text('Validade: ', { continued: true })
        .font('Helvetica').text(data.entryCertificate.expirationDate ? 
          calcValidityPeriod(data.entryCertificate.manufacturingDate, data.entryCertificate.expirationDate) : 'N/A');

      // Finaliza o documento e gera o blob
      doc.end();

      stream.on('finish', () => {
        // Cria URL do blob para download
        const url = stream.toBlobURL('application/pdf');
        resolve(url);
      });

      stream.on('error', (err: Error) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Funções auxiliares para formatação de dados
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  } catch (e) {
    return dateString;
  }
}

function calcValidityPeriod(manufacturingDate: string | null, expirationDate: string | null): string {
  if (!manufacturingDate || !expirationDate) return 'N/A';
  
  try {
    const mfgDate = new Date(manufacturingDate);
    const expDate = new Date(expirationDate);
    
    // Calcula diferença em meses
    const diffMonths = (expDate.getFullYear() - mfgDate.getFullYear()) * 12 + 
                        (expDate.getMonth() - mfgDate.getMonth());
    
    return `${diffMonths} MESES`;
  } catch (e) {
    return 'N/A';
  }
}