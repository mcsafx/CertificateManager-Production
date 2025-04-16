import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configuração para Neon Database (PostgreSQL serverless)
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL deve ser configurado. Verifique as variáveis de ambiente."
  );
}

// Criando pool de conexões
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Criando instância do Drizzle ORM
export const db = drizzle({ client: pool, schema });