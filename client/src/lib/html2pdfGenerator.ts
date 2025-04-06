import html2pdf from 'html2pdf.js';

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
 * Gera o HTML para o certificado de qualidade
 */
function generateCertificateHTML(data: CertificateGenerationData): string {
  // Formatação das datas
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch (e) {
      return dateString;
    }
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

  // Gera linhas para a tabela de resultados
  const generateResultRows = () => {
    return data.results.map(result => {
      const specificationValue = result.minValue && result.maxValue 
        ? `${result.minValue} - ${result.maxValue}`
        : result.minValue || result.maxValue || 'N/A';

      return `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${result.characteristicName}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${result.unit || ''}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${specificationValue}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${result.obtainedValue}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${result.analysisMethod || ''}</td>
        </tr>
      `;
    }).join('');
  };

  // Criar o HTML do certificado
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Certificado de Qualidade - ${data.product.technicalName}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
        }
        .logo {
          max-width: 150px;
          max-height: 80px;
          margin-bottom: 10px;
        }
        h1 {
          font-size: 18px;
          text-align: center;
          margin-bottom: 20px;
          text-transform: uppercase;
        }
        .company-info {
          margin-bottom: 15px;
        }
        .info-section {
          margin-bottom: 20px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 15px;
        }
        .info-item {
          margin-bottom: 5px;
        }
        .info-label {
          font-weight: bold;
          font-size: 12px;
        }
        .info-value {
          font-size: 12px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          font-size: 12px;
        }
        th, td {
          padding: 8px;
          border: 1px solid #ddd;
          text-align: center;
        }
        th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        .approval {
          margin-top: 20px;
          font-weight: bold;
        }
        .approved {
          color: green;
        }
      </style>
    </head>
    <body>
      <div class="header">
        ${data.tenant.logoUrl ? `<img src="${data.tenant.logoUrl}" class="logo" alt="${data.tenant.name} Logo">` : ''}
        <h1>Certificado de Qualidade</h1>
      </div>

      <div class="company-info">
        <div class="info-label">Empresa:</div>
        <div class="info-value">${data.tenant.name} ${data.tenant.cnpj ? `- ${data.tenant.cnpj}` : ''}</div>
        ${data.tenant.address ? `<div class="info-value">${data.tenant.address}</div>` : ''}
      </div>

      <div class="info-section">
        <div class="info-label">Produto:</div>
        <div class="info-value">${data.product.technicalName}</div>
        ${data.product.commercialName ? `<div class="info-value">Nome Comercial: ${data.product.commercialName}</div>` : ''}
      </div>

      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Data de Emissão:</div>
          <div class="info-value">${formatDate(data.certificate.issueDate)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Lote do Produto:</div>
          <div class="info-value">${data.certificate.customLot}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Quantidade:</div>
          <div class="info-value">${data.certificate.soldQuantity} ${data.certificate.measureUnit}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Data de Fabricação:</div>
          <div class="info-value">${formatDate(data.entryCertificate.manufacturingDate)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Nota Fiscal:</div>
          <div class="info-value">${data.certificate.invoiceNumber}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Validade:</div>
          <div class="info-value">${formatDate(data.entryCertificate.expirationDate)}</div>
        </div>
      </div>

      <div class="info-section">
        <div class="info-label">Cliente:</div>
        <div class="info-value">${data.client.name} ${data.client.cnpj ? `- ${data.client.cnpj}` : ''}</div>
      </div>

      <h1>Boletim de Análises</h1>
      <div class="info-value" style="text-align: center; margin-bottom: 10px;">PRODUTO/PRODUCT: ${data.product.technicalName}</div>

      <table>
        <thead>
          <tr>
            <th>CARACTERÍSTICAS<br>CHARACTERISTICS</th>
            <th>UNIDADES<br>UNITS</th>
            <th>ESPECIFICAÇÃO<br>SPECIFICATION</th>
            <th>VALOR<br>VALUE</th>
            <th>MÉTODO<br>TEST METHOD</th>
          </tr>
        </thead>
        <tbody>
          ${generateResultRows()}
        </tbody>
      </table>

      <div class="approval">
        Controle de Qualidade <span class="approved">APROVADO</span> | 
        Validade: ${data.entryCertificate.expirationDate ? 
          calcValidityPeriod(data.entryCertificate.manufacturingDate, data.entryCertificate.expirationDate) : 'N/A'}
      </div>
    </body>
    </html>
  `;
}

/**
 * Gera um PDF do certificado de qualidade usando HTML
 * @param data Dados para geração do certificado
 * @returns Promise com o objeto PDF gerado
 */
export async function generateCertificatePdf(data: CertificateGenerationData): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Gera o HTML do certificado
      const html = generateCertificateHTML(data);
      
      // Cria um elemento temporário no DOM para renderizar o HTML
      const element = document.createElement('div');
      element.innerHTML = html;
      element.style.position = 'absolute';
      element.style.left = '-9999px';
      document.body.appendChild(element);

      // Configurações do PDF
      const options = {
        margin: [10, 10],
        filename: `certificado-${data.certificate.invoiceNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      // Gera o PDF a partir do HTML
      html2pdf()
        .from(element)
        .set(options)
        .outputPdf('datauristring')
        .then((pdfString: string) => {
          // Remove o elemento temporário
          document.body.removeChild(element);
          resolve(pdfString);
        })
        .catch((error: Error) => {
          document.body.removeChild(element);
          reject(error);
        });
    } catch (error) {
      reject(error);
    }
  });
}