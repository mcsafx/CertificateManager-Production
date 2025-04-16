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
        : result.minValue || result.maxValue || '-';
      
      // Tentativa de determinar se o valor está dentro do intervalo apenas se for numérico
      let isWithinRange = true;
      try {
        if (
          !isNaN(Number(result.obtainedValue)) && 
          (result.minValue !== null || result.maxValue !== null)
        ) {
          isWithinRange = 
            (result.minValue === null || parseFloat(result.obtainedValue) >= parseFloat(result.minValue)) && 
            (result.maxValue === null || parseFloat(result.obtainedValue) <= parseFloat(result.maxValue));
        }
      } catch (e) {
        isWithinRange = true; // Assume conformidade para valores não numéricos
      }

      // Alternância entre linhas claras e escuras com tons de cinza
      const bgColor = index % 2 === 0 ? '#f8f8f8' : '#ffffff';
      
      return `
        <tr style="background-color: ${bgColor};">
          <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: 500;">${result.characteristicName}</td>
          <td style="padding: 8px 12px; border: 1px solid #ddd; text-align: center;">${result.unit || '-'}</td>
          <td style="padding: 8px 12px; border: 1px solid #ddd; text-align: center;">${specificationValue}</td>
          <td style="padding: 8px 12px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${result.obtainedValue}</td>
          <td style="padding: 8px 12px; border: 1px solid #ddd; text-align: center; font-size: 11px;">${result.analysisMethod || '-'}</td>
        </tr>
      `;
    }).join('');
  };

  // Criar o HTML do certificado com design elegante em preto e branco
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
          padding: 20mm;
          position: relative;
          box-sizing: border-box;
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
          opacity: 0.03;
          pointer-events: none;
        }
        
        .watermark img {
          width: 70%;
          max-width: 500px;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          border-bottom: 1px solid #333;
          padding-bottom: 15px;
        }
        
        .logo-container {
          flex: 0 0 150px;
        }
        
        .logo {
          max-width: 100%;
          max-height: 70px;
          object-fit: contain;
        }
        
        .title-container {
          flex: 1;
          text-align: center;
        }
        
        h1 {
          font-size: 22px;
          margin: 0 0 5px 0;
          color: #000;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        
        .certificate-number {
          font-size: 12px;
          color: #555;
          margin-bottom: 5px;
          letter-spacing: 0.5px;
        }
        
        .company-info {
          text-align: right;
          font-size: 11px;
          line-height: 1.5;
          color: #444;
          flex: 0 0 200px;
        }
        
        .company-name {
          font-weight: bold;
          font-size: 14px;
          margin-bottom: 4px;
        }
        
        .section {
          margin-bottom: 25px;
        }
        
        .section-title {
          font-size: 14px;
          font-weight: 700;
          margin: 0 0 10px 0;
          padding: 6px 10px;
          background-color: #eee;
          border-left: 4px solid #333;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .columns {
          display: flex;
          gap: 20px;
        }
        
        .column {
          flex: 1;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 20px;
        }
        
        .info-grid.three-columns {
          grid-template-columns: 1fr 1fr 1fr;
        }
        
        .info-item {
          margin-bottom: 8px;
        }
        
        .info-label {
          font-weight: 600;
          font-size: 11px;
          color: #555;
          margin-bottom: 2px;
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }
        
        .info-value {
          font-size: 13px;
          color: #000;
          border-bottom: 1px dotted #ccc;
          padding-bottom: 2px;
        }
        
        .product-info {
          margin-bottom: 15px;
        }
        
        .product-name {
          font-size: 16px;
          font-weight: 600;
          color: #000;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          border: 1px solid #ddd;
        }
        
        th {
          background-color: #333;
          color: white;
          padding: 10px;
          text-align: center;
          font-weight: 500;
          font-size: 11px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        
        td {
          padding: 8px 10px;
          text-align: left;
          border: 1px solid #ddd;
          font-size: 12px;
        }
        
        .table-container {
          margin-top: 10px;
          width: 100%;
          overflow-x: auto;
        }
        
        .observation-section {
          margin-top: 30px;
          border: 1px solid #ddd;
          padding: 15px;
          background-color: #f9f9f9;
        }
        
        .observation-title {
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 10px;
          text-transform: uppercase;
          color: #555;
        }
        
        .observation-content {
          min-height: 40px;
          font-size: 12px;
          color: #333;
        }
        
        .signature-section {
          margin-top: 40px;
          display: flex;
          justify-content: center;
        }
        
        .signature-box {
          text-align: center;
          width: 200px;
        }
        
        .signature-line {
          margin: 40px auto 5px auto;
          width: 180px;
          border-top: 1px solid #333;
        }
        
        .signature-name {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .signature-title {
          font-size: 11px;
          color: #555;
        }
        
        .validity-section {
          margin-top: 15px;
          padding: 10px;
          background-color: #f4f4f4;
          text-align: center;
          border: 1px solid #ddd;
          font-size: 12px;
        }
        
        .validity-label {
          font-weight: 600;
          margin-right: 5px;
        }
        
        .footer {
          position: absolute;
          bottom: 20mm;
          left: 20mm;
          right: 20mm;
          text-align: center;
          font-size: 10px;
          color: #666;
          padding-top: 10px;
          border-top: 1px solid #ddd;
        }
        
        .digital-note {
          font-weight: 700;
          font-size: 11px;
          margin-top: 5px;
          color: #333;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          
          .page {
            width: 100%;
            min-height: auto;
            padding: 15mm;
            box-shadow: none;
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
            ${data.tenant.logoUrl ? `<img src="${data.tenant.logoUrl}" class="logo" alt="${data.tenant.name} Logo">` : '<div style="width: 150px; height: 60px; background-color: #f0f0f0; display: flex; justify-content: center; align-items: center; color: #555; font-size: 12px; text-align: center;">LOGOMARCA</div>'}
          </div>
          
          <div class="title-container">
            <h1>CERTIFICADO DE QUALIDADE</h1>
            <div class="certificate-number">Certificado Nº ${data.certificate.customLot}-${data.certificate.invoiceNumber}</div>
          </div>
          
          <div class="company-info">
            <div class="company-name">${data.tenant.name}</div>
            ${data.tenant.cnpj ? `<div>CNPJ: ${data.tenant.cnpj}</div>` : ''}
            ${data.tenant.address ? `<div>${data.tenant.address}</div>` : ''}
          </div>
        </div>

        <div class="columns">
          <div class="column">
            <div class="section">
              <div class="section-title">Identificação</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Emitente</div>
                  <div class="info-value">${data.tenant.name}</div>
                </div>
                ${data.tenant.cnpj ? `
                  <div class="info-item">
                    <div class="info-label">CNPJ</div>
                    <div class="info-value">${data.tenant.cnpj}</div>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
          
          <div class="column">
            <div class="section">
              <div class="section-title">Destinatário</div>
              <div class="info-grid">
                <div class="info-item" style="grid-column: span 2;">
                  <div class="info-label">Razão Social</div>
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
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Produto</div>
          <div class="product-info">
            <div class="product-name">${data.product.technicalName}</div>
            ${data.product.commercialName ? `<div>Nome Comercial: ${data.product.commercialName}</div>` : ''}
          </div>
          
          <div class="info-grid three-columns" style="margin-top: 15px;">
            <div class="info-item">
              <div class="info-label">Nota Fiscal</div>
              <div class="info-value">${data.certificate.invoiceNumber}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Lote Interno</div>
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
              <div class="info-label">Data de Validade</div>
              <div class="info-value">${formatDate(data.entryCertificate.expirationDate)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Data de Emissão</div>
              <div class="info-value">${formatDate(data.certificate.issueDate)}</div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Características</div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>CARACTERÍSTICA</th>
                  <th>UNIDADE</th>
                  <th>ESPECIFICAÇÃO</th>
                  <th>VALOR</th>
                  <th>MÉTODO</th>
                </tr>
              </thead>
              <tbody>
                ${generateResultRows()}
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="observation-section">
          <div class="observation-title">Observações</div>
          <div class="observation-content">
            Referência: ${data.entryCertificate.referenceDocument || 'N/A'}
          </div>
        </div>
        
        <div class="validity-section">
          <span class="validity-label">Validade do Produto:</span> 
          ${data.entryCertificate.expirationDate ? 
            calcValidityPeriod(data.entryCertificate.manufacturingDate, data.entryCertificate.expirationDate) : 'N/A'}
        </div>
        
        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-name">Controle de Qualidade</div>
            <div class="signature-title">${data.tenant.name}</div>
          </div>
        </div>
        
        <div class="footer">
          <p>Este documento foi gerado pelo sistema CertQuality em ${new Date().toLocaleDateString('pt-BR')}</p>
          <p class="digital-note">ESTE DOCUMENTO FOI EMITIDO DIGITALMENTE E NÃO REQUER ASSINATURA</p>
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
        .outputPdf('blob')
        .then((pdf: Blob) => {
          // Remove o elemento temporário
          document.body.removeChild(element);
          // Criar blob URL para abrir em nova aba
          const url = URL.createObjectURL(pdf);
          resolve(url);
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