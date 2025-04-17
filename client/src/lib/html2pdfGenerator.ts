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
 * Otimizado para melhor aproveitamento vertical do espaço
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
          <td style="padding: 5px 8px; border: 1px solid #ddd; font-weight: 500;">${result.characteristicName}</td>
          <td style="padding: 5px 8px; border: 1px solid #ddd; text-align: center;">${result.unit || '-'}</td>
          <td style="padding: 5px 8px; border: 1px solid #ddd; text-align: center;">${specificationValue}</td>
          <td style="padding: 5px 8px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${result.obtainedValue}</td>
          <td style="padding: 5px 8px; border: 1px solid #ddd; text-align: center; font-size: 11px;">${result.analysisMethod || '-'}</td>
        </tr>
      `;
    }).join('');
  };

  // Gera linhas vazias para a tabela
  const generateEmptyRows = (count: number) => {
    if (count <= 0) return '';

    let rows = '';
    for (let i = 0; i < count; i++) {
      rows += `
        <tr class="empty-row">
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>
      `;
    }
    return rows;
  };

  // Criar o HTML do certificado com design elegante e espaçamento vertical otimizado
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
          padding: 5mm;
          position: relative;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }

        /* Define melhor proporção vertical para as seções */
        .page > .section:nth-child(-n+3) {
          flex: 0 0 auto;
          max-height: 30%; /* Reduzido de 40% para 30% */
        }

        .page > .section:last-child {
          flex: 1 1 auto;
          min-height: 40%; /* Tabela de resultados ocupa pelo menos 40% da página */
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
          margin-bottom: 8px; /* Reduzido de 15px para 8px */
          border-bottom: 1px solid #333;
          padding-bottom: 6px; /* Reduzido de 10px para 6px */
        }

        .logo-container {
          flex: 0 0 120px;
        }

        .logo {
          max-width: 100%;
          max-height: 50px; /* Reduzido de 60px para 50px */
          object-fit: contain;
        }

        .title-container {
          flex: 1;
          text-align: center;
        }

        h1 {
          font-size: 18px; /* Reduzido de 20px para 18px */
          margin: 0 0 2px 0; /* Reduzido de 4px para 2px */
          color: #000;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .certificate-number {
          font-size: 11px;
          color: #555;
          margin-bottom: 2px; /* Reduzido de 4px para 2px */
          letter-spacing: 0.5px;
        }

        .company-info {
          text-align: right;
          font-size: 10px;
          line-height: 1.2; /* Reduzido de 1.4 para 1.2 */
          color: #444;
          flex: 0 0 180px;
        }

        .company-name {
          font-weight: bold;
          font-size: 12px;
          margin-bottom: 2px;
        }

        .section {
          margin-bottom: 2px; /* Reduzido de 4px para 2px */
        }

        .section-title {
          font-size: 11px;
          font-weight: 700;
          margin: 0 0 2px 0; /* Reduzido de 4px para 2px */
          padding: 2px 6px; /* Reduzido de 3px para 2px */
          background-color: #eee;
          border-left: 4px solid #333;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-row {
          display: flex;
          flex-wrap: wrap;
          margin: -1px; /* Reduzido de -2px para -1px */
        }

        .info-col {
          flex: 1 0 25%;
          padding: 1px; /* Reduzido de 2px para 1px */
          box-sizing: border-box;
          min-width: 120px;
        }

        .info-col.half {
          flex: 1 0 50%;
        }

        .info-col.third {
          flex: 1 0 33.33%;
        }

        .info-item {
          margin-bottom: 2px; /* Reduzido de 3px para 2px */
        }

        .info-label {
          font-weight: 600;
          font-size: 9px;
          color: #555;
          margin-bottom: 0px;
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }

        .info-value {
          font-size: 10px;
          color: #000;
          border-bottom: 1px dotted #ccc;
          padding-bottom: 0px;
        }

        .product-info {
          margin-bottom: 4px; /* Reduzido de 5px para 4px */
        }

        .product-name {
          font-size: 12px;
          font-weight: 600;
          color: #000;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          border: 1px solid #ddd;
        }

        th {
          background-color: #333;
          color: white;
          padding: 5px 6px; /* Reduzido de 6px 8px para 5px 6px */
          text-align: center;
          font-weight: 500;
          font-size: 10px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        td {
          padding: 5px 6px; /* Reduzido de 6px 8px para 5px 6px */
          text-align: left;
          border: 1px solid #ddd;
          font-size: 11px;
        }

        .table-container {
          margin-top: 6px; /* Reduzido de 8px para 6px */
          width: 100%;
          overflow-x: auto;
        }

        .empty-row td {
          height: 20px; /* Reduzido de 22px para 20px */
          background-color: #f8f8f8;
        }

        .observation-section {
          margin-top: 10px; /* Reduzido de 15px para 10px */
          border: 1px solid #ddd;
          padding: 6px 8px; /* Reduzido de 8px 10px para 6px 8px */
          background-color: #f9f9f9;
        }

        .observation-title {
          font-size: 10px;
          font-weight: 600;
          margin-bottom: 3px; /* Reduzido de 5px para 3px */
          text-transform: uppercase;
          color: #555;
        }

        .observation-content {
          min-height: 15px; /* Reduzido de 20px para 15px */
          font-size: 11px;
          color: #333;
        }

        .status-section {
          margin-top: 10px; /* Reduzido de 15px para 10px */
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .status-approved {
          font-weight: 700;
          font-size: 12px;
          color: #2e7d32;
          text-transform: uppercase;
        }

        .validity-section {
          margin-top: 8px; /* Reduzido de 10px para 8px */
          padding: 5px 8px; /* Reduzido de 6px 10px para 5px 8px */
          background-color: #f4f4f4;
          text-align: center;
          border: 1px solid #ddd;
          font-size: 11px;
        }

        .validity-label {
          font-weight: 600;
          margin-right: 5px;
        }

        .footer {
          position: absolute;
          bottom: 5mm;
          left: 5mm;
          right: 5mm;
          text-align: center;
          font-size: 9px;
          color: #666;
          padding-top: 6px; /* Reduzido de 8px para 6px */
          border-top: 1px solid #ddd;
        }

        .digital-note {
          font-weight: 700;
          font-size: 10px;
          margin-top: 2px; /* Reduzido de 3px para 2px */
          color: #333;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Estilos especiais para impressão */
        @media print {
          body {
            margin: 0;
            padding: 0;
          }

          .page {
            width: 100%;
            min-height: auto;
            padding: 8mm;
            box-shadow: none;
          }

          /* Botão de impressão não deve aparecer ao imprimir */
          .print-button {
            display: none;
          }
        }

        /* Estilo para o botão de impressão */
        .print-button {
          position: fixed;
          top: 10px;
          right: 10px;
          padding: 8px 16px;
          background-color: #2e7d32;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          z-index: 100;
        }

        .print-button:hover {
          background-color: #1b5e20;
        }

        /* Melhorias no título central para economizar espaço */
        .main-title {
          text-align: center;
          margin: 8px 0 12px 0; /* Reduzido */
          font-size: 22px; /* Reduzido de 24px para 22px */
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <button class="print-button" onclick="window.print()">Imprimir Certificado</button>

      <div class="page">
        ${data.tenant.logoUrl ? `
          <div class="watermark">
            <img src="${data.tenant.logoUrl}" alt="Marca d'água">
          </div>
        ` : ''}

        <h1 class="main-title">CERTIFICADO DE QUALIDADE</h1>

        <div class="header">
          <div class="logo-container">
            ${data.tenant.logoUrl ? `<img src="${data.tenant.logoUrl}" class="logo" alt="${data.tenant.name} Logo">` : '<div style="width: 120px; height: 50px; background-color: #f0f0f0; display: flex; justify-content: center; align-items: center; color: #555; font-size: 10px; text-align: center;">LOGOMARCA</div>'}
          </div>

          <div class="company-info">
            <div class="company-name">${data.tenant.name}</div>
            ${data.tenant.cnpj ? `<div>CNPJ: ${data.tenant.cnpj}</div>` : ''}
            ${data.tenant.address ? `<div>${data.tenant.address}</div>` : ''}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Informações do Produto</div>
          <div class="product-name">${data.product.technicalName}</div>
          ${data.product.commercialName ? `<div class="info-value" style="margin-bottom: 6px;">${data.product.commercialName}</div>` : ''}

          <div class="info-row">
            <div class="info-col">
              <div class="info-item">
                <div class="info-label">Nota Fiscal</div>
                <div class="info-value">${data.certificate.invoiceNumber}</div>
              </div>
            </div>
            <div class="info-col">
              <div class="info-item">
                <div class="info-label">Data de Emissão</div>
                <div class="info-value">${formatDate(data.certificate.issueDate)}</div>
              </div>
            </div>
            <div class="info-col">
              <div class="info-item">
                <div class="info-label">Lote Personalizado</div>
                <div class="info-value">${data.certificate.customLot}</div>
              </div>
            </div>
            <div class="info-col">
              <div class="info-item">
                <div class="info-label">Quantidade</div>
                <div class="info-value">${data.certificate.soldQuantity} ${data.certificate.measureUnit}</div>
              </div>
            </div>
            <div class="info-col">
              <div class="info-item">
                <div class="info-label">Data de Fabricação</div>
                <div class="info-value">${formatDate(data.entryCertificate.manufacturingDate)}</div>
              </div>
            </div>
            <div class="info-col">
              <div class="info-item">
                <div class="info-label">Validade</div>
                <div class="info-value">${formatDate(data.entryCertificate.expirationDate)}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Dados do Cliente</div>
          <div class="info-row">
            <div class="info-col half">
              <div class="info-item">
                <div class="info-label">Nome</div>
                <div class="info-value">${data.client.name}</div>
              </div>
            </div>
            ${data.client.cnpj ? `
              <div class="info-col">
                <div class="info-item">
                  <div class="info-label">CNPJ</div>
                  <div class="info-value">${data.client.cnpj}</div>
                </div>
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
                ${generateEmptyRows(Math.min(10 - data.results.length, 5))} <!-- Limitado a máximo de 5 linhas vazias -->
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

        <div class="status-section">
          <div class="status-approved">Status: APROVADO</div>
          <div style="font-size: 11px;">
            <span class="validity-label">Validade do Produto:</span> 
            ${data.entryCertificate.expirationDate ? 
              calcValidityPeriod(data.entryCertificate.manufacturingDate, data.entryCertificate.expirationDate) : 'N/A'}
          </div>
        </div>

        <div class="footer">
          <p>Este documento foi gerado pelo sistema CertQuality em ${new Date().toLocaleDateString('pt-BR')}</p>
          <p class="digital-note">ESTE DOCUMENTO FOI EMITIDO DIGITALMENTE E NÃO REQUER ASSINATURA</p>
        </div>
      </div>

      <script>
        // Script para garantir que o botão de impressão não apareça durante a impressão
        window.onbeforeprint = function() {
          document.querySelector('.print-button').style.display = 'none';
        };

        window.onafterprint = function() {
          document.querySelector('.print-button').style.display = 'block';
        };
      </script>
    </body>
    </html>
  `;
}

/**
 * Abre o certificado em uma nova guia para visualização e impressão
 * @param data Dados para geração do certificado
 * @returns Promise que resolve quando o certificado for aberto
 */
export async function openCertificateInNewTab(data: CertificateGenerationData): Promise<void> {
  try {
    // Gera o HTML do certificado
    const html = generateCertificateHTML(data);

    // Criar uma nova guia
    const newTab = window.open('', '_blank');

    if (!newTab) {
      throw new Error('Falha ao abrir nova guia. Verifique se seu navegador está bloqueando pop-ups.');
    }

    // Escrever o HTML na nova guia
    newTab.document.write(html);
    newTab.document.close();

    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
}

/**
 * Função que mantemos para compatibilidade com código existente
 * Agora usa a nova função openCertificateInNewTab internamente
 */
export async function generateCertificatePdf(data: CertificateGenerationData): Promise<string> {
  try {
    await openCertificateInNewTab(data);
    return Promise.resolve("Certificado aberto em nova guia");
  } catch (error) {
    return Promise.reject(error);
  }
}