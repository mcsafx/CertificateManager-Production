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
 * Gera o HTML para o certificado de qualidade com layout moderno e corporativo
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
    return data.results.map((result, index) => {
      const specificationValue = result.minValue && result.maxValue 
        ? `${result.minValue} - ${result.maxValue}`
        : result.minValue || result.maxValue || 'N/A';
      
      const isWithinRange = 
        (result.minValue === null || parseFloat(result.obtainedValue) >= parseFloat(result.minValue)) && 
        (result.maxValue === null || parseFloat(result.obtainedValue) <= parseFloat(result.maxValue));

      const bgColor = index % 2 === 0 ? 'transparent' : '#f9f9f9';
      const valueColor = isWithinRange ? '#388e3c' : '#d32f2f';

      return `
        <tr style="background-color: ${bgColor};">
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${result.characteristicName}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center;">${result.unit || '-'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center;">${specificationValue}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center; font-weight: bold; color: ${valueColor};">${result.obtainedValue}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center;">${result.analysisMethod || '-'}</td>
        </tr>
      `;
    }).join('');
  };

  // Criar o HTML do certificado com design moderno e corporativo
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Certificado de Qualidade - ${data.product.technicalName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
        
        body {
          font-family: 'Roboto', sans-serif;
          margin: 0;
          padding: 0;
          color: #333;
          background-color: #fff;
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .page {
          width: 210mm;
          min-height: 297mm;
          padding: 15mm;
          position: relative;
        }
        
        .watermark {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: -1;
          opacity: 0.035;
          pointer-events: none;
        }
        
        .watermark img {
          width: 60%;
          max-width: 400px;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #2196f3;
        }
        
        .logo-container {
          flex: 0 0 150px;
          margin-right: 20px;
        }
        
        .logo {
          max-width: 100%;
          max-height: 80px;
          object-fit: contain;
        }
        
        .title-container {
          flex: 1;
        }
        
        h1 {
          font-size: 24px;
          margin: 0 0 5px 0;
          background: linear-gradient(45deg, #2196f3, #0d47a1);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 700;
        }
        
        .certificate-number {
          font-size: 12px;
          color: #666;
          margin-bottom: 5px;
        }
        
        .company-info {
          text-align: right;
          flex: 1;
          font-size: 12px;
        }
        
        .company-name {
          font-weight: bold;
          font-size: 14px;
          margin-bottom: 5px;
        }
        
        .section {
          margin-bottom: 25px;
          padding: 20px;
          background-color: #f9f9f9;
          border-radius: 5px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .section-title {
          font-size: 16px;
          font-weight: 500;
          margin: 0 0 15px 0;
          padding-bottom: 8px;
          color: #0d47a1;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
        }
        
        .info-item {
          margin-bottom: 10px;
        }
        
        .info-label {
          font-weight: 500;
          font-size: 12px;
          color: #666;
          margin-bottom: 2px;
        }
        
        .info-value {
          font-size: 14px;
        }
        
        .product-info {
          margin-bottom: 5px;
        }
        
        .product-name {
          font-size: 18px;
          font-weight: 500;
          color: #0d47a1;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          border-radius: 5px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        th {
          background-color: #0d47a1;
          color: white;
          padding: 12px;
          text-align: center;
          font-weight: 500;
        }
        
        td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .table-container {
          margin-top: 10px;
          width: 100%;
          overflow-x: auto;
        }
        
        .approval-section {
          margin-top: 30px;
          display: flex;
          justify-content: space-between;
        }
        
        .approval {
          font-weight: 500;
          font-size: 14px;
        }
        
        .approved {
          color: #388e3c;
          font-weight: bold;
        }
        
        .signature-area {
          margin-top: 30px;
          padding-top: 10px;
          border-top: 1px solid #e0e0e0;
          text-align: center;
        }
        
        .signature-line {
          margin: 40px auto 5px auto;
          width: 200px;
          border-top: 1px solid #333;
        }
        
        .signature-name {
          font-size: 12px;
          font-weight: 500;
        }
        
        .signature-title {
          font-size: 11px;
          color: #666;
        }
        
        .footer {
          position: absolute;
          bottom: 15mm;
          left: 15mm;
          right: 15mm;
          text-align: center;
          font-size: 10px;
          color: #888;
          padding-top: 10px;
          border-top: 1px solid #e0e0e0;
        }
        
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          
          .page {
            width: 100%;
            min-height: auto;
            box-shadow: none;
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="page">
        ${data.tenant.logoUrl ? `
          <div class="watermark">
            <img src="${data.tenant.logoUrl}" alt="Marca d'água">
          </div>
        ` : ''}
        
        <div class="header">
          <div class="logo-container">
            ${data.tenant.logoUrl ? `<img src="${data.tenant.logoUrl}" class="logo" alt="${data.tenant.name} Logo">` : '<div style="width: 150px; height: 60px; background-color: #f0f0f0; display: flex; justify-content: center; align-items: center; color: #aaa;">Logo</div>'}
          </div>
          
          <div class="title-container">
            <h1>CERTIFICADO DE QUALIDADE</h1>
            <div class="certificate-number">Certificado Nº ${data.certificate.customLot}-${data.certificate.invoiceNumber}</div>
          </div>
          
          <div class="company-info">
            <div class="company-name">${data.tenant.name}</div>
            ${data.tenant.cnpj ? `<div>${data.tenant.cnpj}</div>` : ''}
            ${data.tenant.address ? `<div>${data.tenant.address}</div>` : ''}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Informações do Produto</div>
          <div class="product-info">
            <div class="product-name">${data.product.technicalName}</div>
            ${data.product.commercialName ? `<div>Nome Comercial: ${data.product.commercialName}</div>` : ''}
          </div>
          
          <div class="info-grid" style="margin-top: 15px;">
            <div class="info-item">
              <div class="info-label">Nota Fiscal</div>
              <div class="info-value">${data.certificate.invoiceNumber}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Data de Emissão</div>
              <div class="info-value">${formatDate(data.certificate.issueDate)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Lote Personalizado</div>
              <div class="info-value">${data.certificate.customLot}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Quantidade</div>
              <div class="info-value">${data.certificate.soldQuantity} ${data.certificate.measureUnit}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Data de Fabricação</div>
              <div class="info-value">${formatDate(data.entryCertificate.manufacturingDate)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Validade</div>
              <div class="info-value">${formatDate(data.entryCertificate.expirationDate)}</div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Dados do Cliente</div>
          <div class="info-grid">
            <div class="info-item" style="grid-column: span 2;">
              <div class="info-label">Nome</div>
              <div class="info-value">${data.client.name}</div>
            </div>
            ${data.client.cnpj ? `
              <div class="info-item">
                <div class="info-label">CNPJ</div>
                <div class="info-value">${data.client.cnpj}</div>
              </div>
            ` : ''}
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Resultados de Análise</div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>CARACTERÍSTICA</th>
                  <th>UNIDADE</th>
                  <th>ESPECIFICAÇÃO</th>
                  <th>RESULTADO</th>
                  <th>MÉTODO</th>
                </tr>
              </thead>
              <tbody>
                ${generateResultRows()}
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="approval-section">
          <div class="approval">
            Status: <span class="approved">APROVADO</span>
          </div>
          <div class="validity">
            Validade: ${data.entryCertificate.expirationDate ? 
              calcValidityPeriod(data.entryCertificate.manufacturingDate, data.entryCertificate.expirationDate) : 'N/A'}
          </div>
        </div>
        
        <div class="signature-area">
          <div class="signature-line"></div>
          <div class="signature-name">Controle de Qualidade</div>
          <div class="signature-title">${data.tenant.name}</div>
        </div>
        
        <div class="footer">
          Este certificado foi gerado eletronicamente e é válido sem assinatura. 
          Para verificar a autenticidade deste documento, entre em contato com nosso departamento de qualidade.
        </div>
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
        .save()
        .then(() => {
          // Remove o elemento temporário
          document.body.removeChild(element);
          // Retornar um valor de sucesso que não será usado para abrir em nova aba
          // mas indica que o download do PDF foi iniciado com sucesso
          resolve('success');
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