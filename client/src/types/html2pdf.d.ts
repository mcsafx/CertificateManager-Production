declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number[];
    filename?: string;
    image?: {
      type?: string;
      quality?: number;
    };
    html2canvas?: {
      scale?: number;
      useCORS?: boolean;
      [key: string]: any;
    };
    jsPDF?: {
      unit?: string;
      format?: string;
      orientation?: 'portrait' | 'landscape';
      [key: string]: any;
    };
    [key: string]: any;
  }

  interface Html2Pdf {
    from(element: HTMLElement | string): Html2Pdf;
    set(options: Html2PdfOptions): Html2Pdf;
    outputPdf(type: string): Promise<string>;
    save(): Promise<void>;
    toPdf(): Html2Pdf;
    output(type: string, options?: any): Promise<any>;
  }

  function html2pdf(): Html2Pdf;
  export default html2pdf;
}