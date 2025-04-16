import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

// Configuração de diretórios
const STORAGE_DIR = path.join(process.cwd(), 'uploads');
const TEMP_DIR = path.join(STORAGE_DIR, 'temp');

// Certificar que os diretórios existem
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Configuração de armazenamento temporário para uploads
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMP_DIR);
  },
  filename: (req, file, cb) => {
    // Gerar nome único para evitar colisões
    const uniqueFilename = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// Configuração de armazenamento permanente para arquivos válidos
const finalStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Criar diretório para o tenant se não existir
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return cb(new Error('Tenant ID não encontrado'), '');
    }
    
    const tenantDir = path.join(STORAGE_DIR, `tenant_${tenantId}`);
    if (!fs.existsSync(tenantDir)) {
      fs.mkdirSync(tenantDir, { recursive: true });
    }
    
    // Criar subdiretório baseado no tipo de arquivo (opcional)
    const fileType = req.body.fileType || 'documents';
    const typeDir = path.join(tenantDir, fileType);
    if (!fs.existsSync(typeDir)) {
      fs.mkdirSync(typeDir, { recursive: true });
    }
    
    cb(null, typeDir);
  },
  filename: (req, file, cb) => {
    // Pode usar nome original ou sanitizado, ou um UUID
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFilename = `${Date.now()}-${sanitizedName}`;
    cb(null, uniqueFilename);
  }
});

// Filtro para validar tipos de arquivo
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Lista de tipos MIME permitidos
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/csv',
    'text/plain'
  ];
  
  // Validar tipo de arquivo
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`));
  }
};

// Configurar multer para upload temporário (usado com os middlewares de verificação de limites)
export const tempUpload = multer({
  storage: tempStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // Limite máximo absoluto de 20MB
  }
});

// Configurar multer para upload final (usado após verificações de limite)
export const finalUpload = multer({
  storage: finalStorage,
  fileFilter: fileFilter
});

/**
 * Move um arquivo do armazenamento temporário para o permanente
 */
export async function moveFileToFinalStorage(
  tempFilePath: string, 
  tenantId: number, 
  fileType: string = 'documents', 
  customFilename?: string
): Promise<string> {
  // Criar diretório para o tenant se não existir
  const tenantDir = path.join(STORAGE_DIR, `tenant_${tenantId}`);
  if (!fs.existsSync(tenantDir)) {
    fs.mkdirSync(tenantDir, { recursive: true });
  }
  
  // Criar subdiretório baseado no tipo de arquivo
  const typeDir = path.join(tenantDir, fileType);
  if (!fs.existsSync(typeDir)) {
    fs.mkdirSync(typeDir, { recursive: true });
  }
  
  // Gerar nome de arquivo final
  const filename = customFilename || `${Date.now()}-${path.basename(tempFilePath)}`;
  const finalPath = path.join(typeDir, filename);
  
  // Mover arquivo
  fs.copyFileSync(tempFilePath, finalPath);
  fs.unlinkSync(tempFilePath); // Remover arquivo temporário
  
  return finalPath;
}

/**
 * Remover um arquivo
 */
export function removeFile(filePath: string): boolean {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erro ao remover arquivo:', error);
    return false;
  }
}

/**
 * Calcula o tamanho de um arquivo em MB
 */
export function getFileSizeInMB(filePath: string): number {
  try {
    const stats = fs.statSync(filePath);
    return stats.size / (1024 * 1024); // Converter bytes para MB
  } catch (error) {
    console.error('Erro ao calcular tamanho do arquivo:', error);
    return 0;
  }
}

/**
 * Cria um URL relativo para acesso ao arquivo
 */
export function getFileUrl(filePath: string): string {
  // Remover o caminho base e convertê-lo para URL
  const relativePath = filePath.replace(STORAGE_DIR, '');
  return `/api/files${relativePath.replace(/\\/g, '/')}`;
}